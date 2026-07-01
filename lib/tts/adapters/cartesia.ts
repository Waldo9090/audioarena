import { env } from "@/lib/env";
import { fetchAudio, getVoice } from "@/lib/tts/adapters/common";
import type { TTSProviderAdapter } from "@/lib/tts/types";

export const cartesiaAdapter: TTSProviderAdapter = {
  id: "cartesia",
  isConfigured() {
    return Boolean(env("CARTESIA_API_KEY"));
  },
  synthesize({ text, model }) {
    const apiKey = env("CARTESIA_API_KEY");
    if (!apiKey) {
      throw new Error("CARTESIA_API_KEY is not configured.");
    }

    return fetchAudio("cartesia", "https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Cartesia-Version": "2025-04-16",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model_id: model.api_model_name || "sonic-3.5",
        transcript: text,
        voice: {
          mode: "id",
          id: getVoice(model.default_voice, "694f9389-aac1-45b6-b726-9d9369183238")
        },
        output_format: {
          container: "mp3",
          bit_rate: 128000,
          sample_rate: 44100
        }
      })
    });
  }
};
