import { env } from "@/lib/env";
import { fetchAudio, jsonHeaders } from "@/lib/tts/adapters/common";
import type { TTSProviderAdapter } from "@/lib/tts/types";

export const deepgramAdapter: TTSProviderAdapter = {
  id: "deepgram",
  isConfigured() {
    return Boolean(env("DEEPGRAM_API_KEY"));
  },
  synthesize({ text, model }) {
    const apiKey = env("DEEPGRAM_API_KEY");
    if (!apiKey) {
      throw new Error("DEEPGRAM_API_KEY is not configured.");
    }

    const searchParams = new URLSearchParams({
      model: model.api_model_name || "aura-2-thalia-en"
    });

    return fetchAudio(
      "deepgram",
      `https://api.deepgram.com/v1/speak?${searchParams.toString()}`,
      {
        method: "POST",
        headers: {
          ...jsonHeaders(apiKey),
          Accept: "audio/mpeg"
        },
        body: JSON.stringify({ text })
      }
    );
  }
};
