import { env } from "@/lib/env";
import {
  decodeBase64OrHex,
  findAudioPayload,
  getVoice,
  jsonHeaders,
  TTSProviderError
} from "@/lib/tts/adapters/common";
import type { SynthesizeResult, TTSProviderAdapter } from "@/lib/tts/types";

export const minimaxAdapter: TTSProviderAdapter = {
  id: "minimax",
  isConfigured() {
    return Boolean(env("MINIMAX_API_KEY"));
  },
  async synthesize({ text, model }): Promise<SynthesizeResult> {
    const apiKey = env("MINIMAX_API_KEY");
    if (!apiKey) {
      throw new Error("MINIMAX_API_KEY is not configured.");
    }

    const started = Date.now();
    const response = await fetch("https://api.minimax.io/v1/t2a_v2", {
      method: "POST",
      headers: jsonHeaders(apiKey),
      body: JSON.stringify({
        model: model.api_model_name,
        text,
        stream: false,
        voice_setting: {
          voice_id: getVoice(model.default_voice, "English_Trustworth_Man"),
          speed: 1,
          vol: 1,
          pitch: 0
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: "mp3",
          channel: 1
        }
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new TTSProviderError(
        `MiniMax TTS failed with ${response.status}: ${body.slice(0, 300)}`,
        "minimax"
      );
    }

    const payload = await response.json();
    const audioPayload = findAudioPayload(payload);
    if (!audioPayload) {
      throw new TTSProviderError("MiniMax did not return audio data.", "minimax");
    }

    return {
      audioBuffer: decodeBase64OrHex(audioPayload),
      mimeType: "audio/mpeg",
      generationMs: Date.now() - started
    };
  }
};
