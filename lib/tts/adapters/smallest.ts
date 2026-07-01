import { createConfigurableJsonTtsAdapter } from "@/lib/tts/adapters/configurable-json";

export const smallestAdapter = createConfigurableJsonTtsAdapter({
  id: "smallest",
  apiKeyEnv: "SMALLEST_API_KEY",
  baseUrlEnv: "SMALLEST_API_BASE_URL"
});
