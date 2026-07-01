import { env } from "@/lib/env";
import { amazonPollyAdapter } from "@/lib/tts/adapters/amazon-polly";
import { assemblyAiAdapter } from "@/lib/tts/adapters/assemblyai";
import { azureAdapter } from "@/lib/tts/adapters/azure";
import { cartesiaAdapter } from "@/lib/tts/adapters/cartesia";
import { dashscopeAdapter } from "@/lib/tts/adapters/dashscope";
import { deepgramAdapter } from "@/lib/tts/adapters/deepgram";
import { elevenLabsAdapter } from "@/lib/tts/adapters/elevenlabs";
import { falAdapter, isFalModelConfigured } from "@/lib/tts/adapters/fal";
import { geminiGoogleAdapter } from "@/lib/tts/adapters/gemini-google";
import { genericHttpTtsAdapter } from "@/lib/tts/adapters/generic-http-tts";
import { gladiaAdapter } from "@/lib/tts/adapters/gladia";
import { groqAdapter } from "@/lib/tts/adapters/groq";
import { humeAdapter } from "@/lib/tts/adapters/hume";
import { inworldAdapter } from "@/lib/tts/adapters/inworld";
import { lightningAdapter } from "@/lib/tts/adapters/lightning";
import { mayaAdapter } from "@/lib/tts/adapters/maya";
import { minimaxAdapter } from "@/lib/tts/adapters/minimax";
import { mistralAdapter } from "@/lib/tts/adapters/mistral";
import { murfAdapter } from "@/lib/tts/adapters/murf";
import { openaiAdapter } from "@/lib/tts/adapters/openai";
import { smallestAdapter } from "@/lib/tts/adapters/smallest";
import { speechmaticsAdapter } from "@/lib/tts/adapters/speechmatics";
import { createDisabledStubAdapter } from "@/lib/tts/adapters/stub";
import { togetherAdapter } from "@/lib/tts/adapters/together";
import { xaiAdapter } from "@/lib/tts/adapters/xai";
import type { ModelRow } from "@/lib/db/types";
import type { TTSProviderAdapter } from "@/lib/tts/types";

const adapters = new Map<string, TTSProviderAdapter>(
  [
    amazonPollyAdapter,
    assemblyAiAdapter,
    azureAdapter,
    cartesiaAdapter,
    dashscopeAdapter,
    deepgramAdapter,
    elevenLabsAdapter,
    falAdapter,
    geminiGoogleAdapter,
    genericHttpTtsAdapter,
    gladiaAdapter,
    groqAdapter,
    humeAdapter,
    inworldAdapter,
    lightningAdapter,
    mayaAdapter,
    minimaxAdapter,
    mistralAdapter,
    murfAdapter,
    openaiAdapter,
    smallestAdapter,
    speechmaticsAdapter,
    togetherAdapter,
    xaiAdapter
  ].map((adapter) => [adapter.id, adapter])
);

export function getTtsAdapter(adapterId: string) {
  return adapters.get(adapterId) || createDisabledStubAdapter(adapterId);
}

export function isModelRuntimeConfigured(
  model: Pick<ModelRow, "id" | "adapter"> & Partial<Pick<ModelRow, "api_model_name">>
) {
  if (model.adapter === "generic_http_tts") {
    if (model.id === "kokoro-tts") {
      return Boolean(env("KOKORO_API_BASE_URL"));
    }

    if (model.id === "chatterbox") {
      return Boolean(env("CHATTERBOX_API_BASE_URL"));
    }

    return false;
  }

  if (model.adapter === "maya") {
    return Boolean(env("MAYA_API_BASE_URL") && env("MAYA_API_KEY"));
  }

  if (model.adapter === "dashscope") {
    return Boolean(env("DASHSCOPE_API_KEY") && env("DASHSCOPE_API_BASE_URL"));
  }

  if (model.adapter === "fal") {
    return isFalModelConfigured(model);
  }

  return getTtsAdapter(model.adapter).isConfigured();
}

export function getConfiguredBattleModels<T extends ModelRow>(models: T[]) {
  return models.filter((model) => model.enabled && isModelRuntimeConfigured(model));
}

export function getAdapterIds() {
  return Array.from(adapters.keys()).sort();
}
