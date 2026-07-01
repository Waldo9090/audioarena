import crypto from "node:crypto";

import { env } from "@/lib/env";
import {
  getVoice,
  pcm16ToWav,
  TTSProviderError
} from "@/lib/tts/adapters/common";
import type { SynthesizeResult, TTSProviderAdapter } from "@/lib/tts/types";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          mimeType?: string;
          data?: string;
        };
      }>;
    };
  }>;
};

type GoogleCredentials = {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri?: string;
};

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function getGoogleAccessToken(credentialsJson: string) {
  const credentials = JSON.parse(credentialsJson) as GoogleCredentials;
  const tokenUri = credentials.token_uri || "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: tokenUri,
      exp: now + 3600,
      iat: now
    })
  );
  const unsignedJwt = `${header}.${claim}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsignedJwt)
    .sign(credentials.private_key);
  const assertion = `${unsignedJwt}.${base64Url(signature)}`;

  const response = await fetch(tokenUri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new TTSProviderError(
      `Google service account token request failed with ${response.status}: ${body.slice(0, 300)}`,
      "gemini/google"
    );
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new TTSProviderError("Google service account token response was missing an access token.", "gemini/google");
  }

  return {
    accessToken: payload.access_token,
    projectId: credentials.project_id
  };
}

function requestBody(text: string, voiceName: string) {
  return {
    contents: [
      {
        parts: [{ text }]
      }
    ],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName
          }
        }
      }
    }
  };
}

export const geminiGoogleAdapter: TTSProviderAdapter = {
  id: "gemini/google",
  isConfigured() {
    return Boolean(env("GEMINI_API_KEY") || env("GOOGLE_CREDENTIALS_JSON"));
  },
  async synthesize({ text, model }): Promise<SynthesizeResult> {
    const apiKey = env("GEMINI_API_KEY");
    const credentialsJson = env("GOOGLE_CREDENTIALS_JSON");
    if (!apiKey && !credentialsJson) {
      throw new Error("GEMINI_API_KEY or GOOGLE_CREDENTIALS_JSON is required for Gemini TTS.");
    }

    const started = Date.now();
    const voiceName = getVoice(model.default_voice, "Kore");
    const response = apiKey
      ? await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            model.api_model_name
          )}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody(text, voiceName))
          }
        )
      : await (async () => {
          const { accessToken, projectId } = await getGoogleAccessToken(credentialsJson || "");
          const location = env("GOOGLE_CLOUD_LOCATION") || "us-central1";
          return fetch(
            `https://${location}-aiplatform.googleapis.com/v1/projects/${encodeURIComponent(
              projectId
            )}/locations/${encodeURIComponent(
              location
            )}/publishers/google/models/${encodeURIComponent(model.api_model_name)}:generateContent`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(requestBody(text, voiceName))
            }
          );
        })();

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new TTSProviderError(
        `Gemini TTS failed with ${response.status}: ${body.slice(0, 300)}`,
        "gemini/google"
      );
    }

    const payload = (await response.json()) as GeminiResponse;
    const inlineData = payload.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData?.data
    )?.inlineData;

    if (!inlineData?.data) {
      throw new TTSProviderError("Gemini TTS did not return audio data.", "gemini/google");
    }

    const rawBuffer = Buffer.from(inlineData.data, "base64");
    const mimeType = inlineData.mimeType || "audio/wav";
    const isRawPcm = mimeType.includes("audio/L16") || mimeType.includes("codec=pcm");

    return {
      audioBuffer: isRawPcm ? pcm16ToWav(rawBuffer) : rawBuffer,
      mimeType: isRawPcm ? "audio/wav" : mimeType.split(";")[0] || "audio/wav",
      generationMs: Date.now() - started
    };
  }
};
