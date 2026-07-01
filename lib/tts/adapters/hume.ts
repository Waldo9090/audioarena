import { env } from "@/lib/env";
import {
  decodeBase64OrHex,
  findAudioPayload,
  getVoice,
  TTSProviderError
} from "@/lib/tts/adapters/common";
import type { SynthesizeResult, TTSProviderAdapter } from "@/lib/tts/types";

export const humeAdapter: TTSProviderAdapter = {
  id: "hume",
  isConfigured() {
    return Boolean(env("HUME_API_KEY"));
  },
  async synthesize({ text, model }): Promise<SynthesizeResult> {
    const apiKey = env("HUME_API_KEY");
    if (!apiKey) {
      throw new Error("HUME_API_KEY is not configured.");
    }

    const started = Date.now();
    const response = await fetch("https://api.hume.ai/v0/tts", {
      method: "POST",
      headers: {
        "X-Hume-Api-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        utterances: [
          {
            text,
            voice: {
              name: getVoice(model.default_voice, "default")
            }
          }
        ],
        format: {
          type: "mp3"
        },
        model: model.api_model_name
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new TTSProviderError(
        `Hume TTS failed with ${response.status}: ${body.slice(0, 300)}`,
        "hume"
      );
    }

    const payload = await response.json();
    const audioPayload = findAudioPayload(payload);
    if (!audioPayload) {
      throw new TTSProviderError("Hume did not return audio data.", "hume");
    }

    return {
      audioBuffer: decodeBase64OrHex(audioPayload),
      mimeType: "audio/mpeg",
      generationMs: Date.now() - started
    };
  }
};
