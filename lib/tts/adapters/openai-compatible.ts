import { env } from "@/lib/env";
import { cleanBaseUrl, fetchAudio, getVoice, jsonHeaders } from "@/lib/tts/adapters/common";
import type { TTSProviderAdapter } from "@/lib/tts/types";

export function createOpenAICompatibleSpeechAdapter(options: {
  id: string;
  apiKeyEnv: string;
  baseUrlEnv?: string;
  defaultBaseUrl?: string;
  requireBaseUrl?: boolean;
  defaultVoice?: string;
}): TTSProviderAdapter {
  return {
    id: options.id,
    isConfigured() {
      const apiKey = env(options.apiKeyEnv);
      const baseUrl =
        (options.baseUrlEnv ? env(options.baseUrlEnv) : undefined) || options.defaultBaseUrl;
      return Boolean(apiKey && baseUrl && (!options.requireBaseUrl || env(options.baseUrlEnv || "")));
    },
    synthesize({ text, model }) {
      const apiKey = env(options.apiKeyEnv);
      const baseUrl =
        (options.baseUrlEnv ? env(options.baseUrlEnv) : undefined) || options.defaultBaseUrl;

      if (!apiKey || !baseUrl) {
        throw new Error(`${options.apiKeyEnv} and a TTS base URL are required.`);
      }

      return fetchAudio(options.id, `${cleanBaseUrl(baseUrl)}/audio/speech`, {
        method: "POST",
        headers: jsonHeaders(apiKey),
        body: JSON.stringify({
          model: model.api_model_name,
          voice: getVoice(model.default_voice, options.defaultVoice || "alloy"),
          input: text,
          response_format: "mp3",
          format: "mp3"
        })
      });
    }
  };
}
