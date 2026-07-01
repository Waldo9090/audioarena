import { createConfigurableJsonTtsAdapter } from "@/lib/tts/adapters/configurable-json";

export const mayaAdapter = createConfigurableJsonTtsAdapter({
  id: "maya",
  apiKeyEnv: "MAYA_API_KEY",
  baseUrlEnv: "MAYA_API_BASE_URL"
});
