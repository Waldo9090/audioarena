import { createOpenAICompatibleSpeechAdapter } from "@/lib/tts/adapters/openai-compatible";

export const mistralAdapter = createOpenAICompatibleSpeechAdapter({
  id: "mistral",
  apiKeyEnv: "MISTRAL_API_KEY",
  baseUrlEnv: "MISTRAL_TTS_BASE_URL",
  defaultBaseUrl: "https://api.mistral.ai/v1",
  defaultVoice: "default"
});
