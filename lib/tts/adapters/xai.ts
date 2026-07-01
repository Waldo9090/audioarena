import { createOpenAICompatibleSpeechAdapter } from "@/lib/tts/adapters/openai-compatible";

export const xaiAdapter = createOpenAICompatibleSpeechAdapter({
  id: "xai",
  apiKeyEnv: "XAI_API_KEY",
  baseUrlEnv: "XAI_TTS_BASE_URL",
  defaultBaseUrl: "https://api.x.ai/v1",
  defaultVoice: "default"
});
