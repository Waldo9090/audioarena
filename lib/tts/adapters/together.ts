import { createConfigurableJsonTtsAdapter } from "@/lib/tts/adapters/configurable-json";

export const togetherAdapter = createConfigurableJsonTtsAdapter({
  id: "together",
  apiKeyEnv: "TOGETHER_API_KEY",
  baseUrlEnv: "TOGETHER_TTS_ENDPOINT",
  defaultPath: ""
});
