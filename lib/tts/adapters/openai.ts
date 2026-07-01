import { env } from "@/lib/env";
import { fetchAudio, getVoice, jsonHeaders } from "@/lib/tts/adapters/common";
import type { TTSProviderAdapter } from "@/lib/tts/types";

export const openaiAdapter: TTSProviderAdapter = {
  id: "openai",
  isConfigured() {
    return Boolean(env("OPENAI_API_KEY"));
  },
  synthesize({ text, model }) {
    const apiKey = env("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    return fetchAudio("openai", "https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: jsonHeaders(apiKey),
      body: JSON.stringify({
        model: model.api_model_name || "gpt-4o-mini-tts",
        voice: getVoice(model.default_voice, "alloy"),
        input: text,
        format: "mp3"
      })
    });
  }
};
