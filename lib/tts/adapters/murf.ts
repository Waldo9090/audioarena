import { env } from "@/lib/env";
import {
  decodeBase64OrHex,
  findAudioPayload,
  getVoice,
  jsonHeaders,
  TTSProviderError
} from "@/lib/tts/adapters/common";
import type { SynthesizeResult, TTSProviderAdapter } from "@/lib/tts/types";

type MurfResponse = {
  audioFile?: string;
  audioFileUrl?: string;
  encodedAudio?: string;
};

export const murfAdapter: TTSProviderAdapter = {
  id: "murf",
  isConfigured() {
    return Boolean(env("MURF_API_KEY"));
  },
  async synthesize({ text, model }): Promise<SynthesizeResult> {
    const apiKey = env("MURF_API_KEY");
    if (!apiKey) {
      throw new Error("MURF_API_KEY is not configured.");
    }

    const started = Date.now();
    const response = await fetch("https://api.murf.ai/v1/speech/generate", {
      method: "POST",
      headers: {
        ...jsonHeaders(),
        "api-key": apiKey
      },
      body: JSON.stringify({
        text,
        voiceId: getVoice(model.default_voice, "en-US-natalie"),
        modelVersion: model.api_model_name,
        format: "MP3"
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new TTSProviderError(
        `Murf TTS failed with ${response.status}: ${body.slice(0, 300)}`,
        "murf"
      );
    }

    const payload = (await response.json()) as MurfResponse;
    const audioUrl = payload.audioFile || payload.audioFileUrl;
    if (audioUrl) {
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new TTSProviderError("Murf returned an audio URL that could not be fetched.", "murf");
      }
      return {
        audioBuffer: Buffer.from(await audioResponse.arrayBuffer()),
        mimeType: audioResponse.headers.get("content-type")?.split(";")[0] || "audio/mpeg",
        generationMs: Date.now() - started
      };
    }

    const audioPayload = payload.encodedAudio || findAudioPayload(payload);
    if (!audioPayload) {
      throw new TTSProviderError("Murf did not return audio data.", "murf");
    }

    return {
      audioBuffer: decodeBase64OrHex(audioPayload),
      mimeType: "audio/mpeg",
      generationMs: Date.now() - started
    };
  }
};
