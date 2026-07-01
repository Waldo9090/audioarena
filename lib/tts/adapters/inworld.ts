import { createConfigurableJsonTtsAdapter } from "@/lib/tts/adapters/configurable-json";

export const inworldAdapter = createConfigurableJsonTtsAdapter({
  id: "inworld",
  apiKeyEnv: "INWORLD_API_KEY",
  baseUrlEnv: "INWORLD_TTS_BASE_URL"
});
