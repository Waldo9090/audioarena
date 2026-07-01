import { env } from "@/lib/env";
import { fetchAudio, getVoice } from "@/lib/tts/adapters/common";
import type { TTSProviderAdapter } from "@/lib/tts/types";

export const elevenLabsAdapter: TTSProviderAdapter = {
  id: "elevenlabs",
  isConfigured() {
    return Boolean(env("ELEVENLABS_API_KEY"));
  },
  synthesize({ text, model }) {
    const apiKey = env("ELEVENLABS_API_KEY");
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY is not configured.");
    }

    const voiceId = getVoice(model.default_voice, "21m00Tcm4TlvDq8ikWAM");
    return fetchAudio(
      "elevenlabs",
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg"
        },
        body: JSON.stringify({
          text,
          model_id: model.api_model_name || "eleven_v3",
          output_format: "mp3_44100_128"
        })
      }
    );
  }
};
