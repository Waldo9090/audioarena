import { env, envNumber } from "@/lib/env";
import { getVoice, TTSProviderError } from "@/lib/tts/adapters/common";
import type { SynthesizeResult, TTSModelConfig, TTSProviderAdapter } from "@/lib/tts/types";

const FAL_QUEUE_BASE_URL = "https://queue.fal.run";
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_POLL_INTERVAL_MS = 1_000;
const FAL_ENDPOINT_BY_MODEL_ID: Record<string, string> = {
  "elevenlabs-eleven-v3": "fal-ai/elevenlabs/tts/eleven-v3",
  "xai-grok-tts": "xai/tts/v1"
};

type FalSubmitResponse = {
  request_id?: string;
  response_url?: string;
  status_url?: string;
};

type FalStatusResponse = {
  status?: string;
  error?: string;
  error_type?: string;
  response_url?: string;
};

type FalAudioFile = {
  url?: string;
  content_type?: string;
};

function falHeaders(apiKey: string) {
  return {
    Authorization: `Key ${apiKey}`,
    "Content-Type": "application/json"
  };
}

function falEnvSuffix(modelId: string) {
  return modelId.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export function falEndpointEnvName(modelId: string) {
  return `FAL_ENDPOINT_${falEnvSuffix(modelId)}`;
}

function falInputTemplateEnvName(modelId: string) {
  return `FAL_INPUT_JSON_${falEnvSuffix(modelId)}`;
}

function falEndpoint(model: TTSModelConfig) {
  const override = env(falEndpointEnvName(model.id));
  if (override) {
    return override;
  }

  const mappedEndpoint = FAL_ENDPOINT_BY_MODEL_ID[model.id];
  if (mappedEndpoint) {
    return mappedEndpoint;
  }

  const configuredEndpoint = model.api_model_name.trim();
  return configuredEndpoint.startsWith("fal:") ? undefined : configuredEndpoint;
}

export function isFalModelConfigured(model: { id: string; api_model_name?: string }) {
  if (!env("FAL_KEY")) {
    return false;
  }

  if (env(falEndpointEnvName(model.id)) || FAL_ENDPOINT_BY_MODEL_ID[model.id]) {
    return true;
  }

  return Boolean(model.api_model_name && !model.api_model_name.trim().startsWith("fal:"));
}

function replaceTemplateValue(value: unknown, replacements: Record<string, string>): unknown {
  if (typeof value === "string") {
    return Object.entries(replacements).reduce(
      (nextValue, [key, replacement]) => nextValue.replaceAll(`{{${key}}}`, replacement),
      value
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceTemplateValue(item, replacements));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        replaceTemplateValue(item, replacements)
      ])
    );
  }

  return value;
}

function falInputFromTemplate(text: string, model: TTSModelConfig) {
  const template = env(falInputTemplateEnvName(model.id));
  if (!template) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(template) as unknown;
    return replaceTemplateValue(parsed, {
      text,
      voice: model.default_voice || "",
      model_id: model.id,
      api_model_name: model.api_model_name
    }) as Record<string, unknown>;
  } catch (error) {
    throw new TTSProviderError(
      `${falInputTemplateEnvName(model.id)} must be valid JSON. ${
        error instanceof Error ? error.message : String(error)
      }`,
      "fal"
    );
  }
}

function falInput(text: string, model: TTSModelConfig) {
  const templateInput = falInputFromTemplate(text, model);
  if (templateInput) {
    return templateInput;
  }

  if (model.id === "xai-grok-tts" || model.api_model_name === "xai/tts/v1") {
    return {
      text,
      voice: getVoice(model.default_voice, "eve"),
      language: "auto"
    };
  }

  if (
    model.id === "elevenlabs-eleven-v3" ||
    model.api_model_name === "fal-ai/elevenlabs/tts/eleven-v3"
  ) {
    return {
      text,
      voice: getVoice(model.default_voice, "Aria"),
      stability: 0.5,
      apply_text_normalization: "auto"
    };
  }

  return {
    text,
    ...(model.default_voice ? { voice: model.default_voice } : {})
  };
}

async function readJson<T>(response: Response, providerId: string): Promise<T> {
  const body = await response.text();

  if (!response.ok) {
    throw new TTSProviderError(
      `${providerId} TTS failed with ${response.status}: ${body.slice(0, 300)}`,
      providerId
    );
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new TTSProviderError(
      `${providerId} TTS returned invalid JSON: ${body.slice(0, 300)}`,
      providerId
    );
  }
}

async function submitFalRequest(options: {
  apiKey: string;
  endpoint: string;
  input: Record<string, unknown>;
}) {
  const response = await fetch(
    `${FAL_QUEUE_BASE_URL}/${options.endpoint.replace(/^\/+/, "")}`,
    {
      method: "POST",
      headers: falHeaders(options.apiKey),
      body: JSON.stringify(options.input)
    }
  );

  const data = await readJson<FalSubmitResponse>(response, "fal");
  if (!data.status_url || !data.response_url) {
    throw new TTSProviderError("Fal queue response did not include result URLs.", "fal");
  }

  return data;
}

async function waitForFalCompletion(options: {
  apiKey: string;
  statusUrl: string;
  timeoutMs: number;
  pollIntervalMs: number;
}) {
  const deadline = Date.now() + options.timeoutMs;

  while (Date.now() < deadline) {
    const response = await fetch(options.statusUrl, {
      headers: {
        Authorization: `Key ${options.apiKey}`
      }
    });
    const status = await readJson<FalStatusResponse>(response, "fal");

    if (status.status === "COMPLETED") {
      if (status.error) {
        throw new TTSProviderError(
          `Fal TTS failed: ${status.error_type ? `${status.error_type}: ` : ""}${status.error}`,
          "fal"
        );
      }
      return status.response_url;
    }

    if (status.error) {
      throw new TTSProviderError(
        `Fal TTS failed: ${status.error_type ? `${status.error_type}: ` : ""}${status.error}`,
        "fal"
      );
    }

    await new Promise((resolve) => setTimeout(resolve, options.pollIntervalMs));
  }

  throw new TTSProviderError(`Fal TTS timed out after ${options.timeoutMs}ms.`, "fal");
}

function audioUrlFromResult(result: unknown) {
  if (!result || typeof result !== "object") {
    return undefined;
  }

  const record = result as Record<string, unknown>;
  const audio = record.audio as FalAudioFile | undefined;
  if (audio && typeof audio.url === "string") {
    return {
      url: audio.url,
      contentType: typeof audio.content_type === "string" ? audio.content_type : undefined
    };
  }

  if (typeof record.audio_url === "string") {
    return {
      url: record.audio_url,
      contentType: undefined
    };
  }

  return undefined;
}

async function downloadFalAudio(options: {
  url: string;
  expectedContentType?: string;
  generationStartedAt: number;
}): Promise<SynthesizeResult> {
  const response = await fetch(options.url);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new TTSProviderError(
      `Fal audio download failed with ${response.status}: ${body.slice(0, 300)}`,
      "fal"
    );
  }

  const mimeType =
    response.headers.get("content-type")?.split(";")[0]?.trim() ||
    options.expectedContentType ||
    "audio/mpeg";

  return {
    audioBuffer: Buffer.from(await response.arrayBuffer()),
    mimeType,
    generationMs: Date.now() - options.generationStartedAt
  };
}

export const falAdapter: TTSProviderAdapter = {
  id: "fal",
  isConfigured() {
    return Boolean(env("FAL_KEY"));
  },
  async synthesize({ text, model }) {
    const apiKey = env("FAL_KEY");
    if (!apiKey) {
      throw new Error("FAL_KEY is not configured.");
    }

    const endpoint = falEndpoint(model);
    if (!endpoint) {
      throw new TTSProviderError(
        `Fal-backed model ${model.id} requires ${falEndpointEnvName(
          model.id
        )} or a concrete api_model_name endpoint.`,
        "fal"
      );
    }

    const generationStartedAt = Date.now();
    const submit = await submitFalRequest({
      apiKey,
      endpoint,
      input: falInput(text, model)
    });
    const statusUrl = submit.status_url;
    const fallbackResponseUrl = submit.response_url;
    if (!statusUrl || !fallbackResponseUrl) {
      throw new TTSProviderError("Fal queue response did not include result URLs.", "fal");
    }

    const responseUrl =
      (await waitForFalCompletion({
        apiKey,
        statusUrl,
        timeoutMs: envNumber("FAL_TTS_TIMEOUT_MS", DEFAULT_TIMEOUT_MS),
        pollIntervalMs: envNumber("FAL_TTS_POLL_INTERVAL_MS", DEFAULT_POLL_INTERVAL_MS)
      })) || fallbackResponseUrl;

    if (!responseUrl) {
      throw new TTSProviderError("Fal queue response did not include a result URL.", "fal");
    }

    const resultResponse = await fetch(responseUrl, {
      headers: {
        Authorization: `Key ${apiKey}`
      }
    });
    const result = await readJson<unknown>(resultResponse, "fal");
    const audio = audioUrlFromResult(result);

    if (!audio) {
      throw new TTSProviderError("Fal TTS response did not include an audio URL.", "fal");
    }

    return downloadFalAudio({
      url: audio.url,
      expectedContentType: audio.contentType,
      generationStartedAt
    });
  }
};
