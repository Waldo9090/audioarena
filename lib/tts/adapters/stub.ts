import type { TTSProviderAdapter } from "@/lib/tts/types";
import { noTtsEndpointMessage, TTSProviderError } from "@/lib/tts/adapters/common";

export function createDisabledStubAdapter(id: string): TTSProviderAdapter {
  return {
    id,
    isConfigured() {
      return false;
    },
    async synthesize() {
      throw new TTSProviderError(noTtsEndpointMessage, id);
    }
  };
}
