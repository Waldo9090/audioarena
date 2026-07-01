import { createConfigurableJsonTtsAdapter } from "@/lib/tts/adapters/configurable-json";

export const lightningAdapter = createConfigurableJsonTtsAdapter({
  id: "lightning",
  apiKeyEnv: "LIGHTNING_API_KEY",
  baseUrlEnv: "LIGHTNING_TTS_BASE_URL"
});
