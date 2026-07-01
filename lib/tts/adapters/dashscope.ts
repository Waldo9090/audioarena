import { env } from "@/lib/env";
import {
  cleanBaseUrl,
  decodeBase64OrHex,
  findAudioPayload,
  getVoice,
  jsonHeaders,
  TTSProviderError
} from "@/lib/tts/adapters/common";
import type { SynthesizeResult, TTSProviderAdapter } from "@/lib/tts/types";

type DashScopeResponse = {
  output?: {
    audio?: {
      data?: string;
      url?: string;
    };
  };
};

export const dashscopeAdapter: TTSProviderAdapter = {
  id: "dashscope",
  isConfigured() {
    return Boolean(env("DASHSCOPE_API_KEY") && env("DASHSCOPE_API_BASE_URL"));
  },
  async synthesize({ text, model }): Promise<SynthesizeResult> {
    const apiKey = env("DASHSCOPE_API_KEY");
    const baseUrl = env("DASHSCOPE_API_BASE_URL");
    if (!apiKey || !baseUrl) {
      throw new Error("DASHSCOPE_API_KEY and DASHSCOPE_API_BASE_URL are required.");
    }

    const started = Date.now();
    const response = await fetch(
      `${cleanBaseUrl(baseUrl)}/services/aigc/multimodal-generation/generation`,
      {
        method: "POST",
        headers: {
          ...jsonHeaders(apiKey)
        },
        body: JSON.stringify({
          model: model.api_model_name,
          input: {
            text,
            voice: getVoice(model.default_voice, "Cherry"),
            language_type: "English"
          }
        })
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new TTSProviderError(
        `DashScope TTS failed with ${response.status}: ${body.slice(0, 300)}`,
        "dashscope"
      );
    }

    const payload = (await response.json()) as DashScopeResponse;
    const audioUrl = payload.output?.audio?.url;
    if (audioUrl) {
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new TTSProviderError(
          `DashScope returned an audio URL that failed with ${audioResponse.status}.`,
          "dashscope"
        );
      }

      return {
        audioBuffer: Buffer.from(await audioResponse.arrayBuffer()),
        mimeType: audioResponse.headers.get("content-type")?.split(";")[0] || "audio/wav",
        generationMs: Date.now() - started
      };
    }

    const audioPayload = payload.output?.audio?.data || findAudioPayload(payload);
    if (!audioPayload) {
      throw new TTSProviderError("DashScope did not return audio data.", "dashscope");
    }

    return {
      audioBuffer: decodeBase64OrHex(audioPayload),
      mimeType: "audio/wav",
      generationMs: Date.now() - started
    };
  }
};
