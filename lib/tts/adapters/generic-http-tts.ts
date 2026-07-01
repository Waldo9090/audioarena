import { env } from "@/lib/env";
import {
  cleanBaseUrl,
  decodeBase64OrHex,
  findAudioPayload,
  getVoice,
  jsonHeaders,
  TTSProviderError
} from "@/lib/tts/adapters/common";
import type { SynthesizeResult, TTSProviderAdapter } from "@/lib/tts/types";

function providerConfig(modelId: string) {
  if (modelId === "kokoro-tts") {
    return {
      id: "kokoro",
      baseUrl: env("KOKORO_API_BASE_URL"),
      apiKey: env("KOKORO_API_KEY")
    };
  }

  if (modelId === "chatterbox") {
    return {
      id: "chatterbox",
      baseUrl: env("CHATTERBOX_API_BASE_URL"),
      apiKey: env("CHATTERBOX_API_KEY")
    };
  }

  return {
    id: "generic_http_tts",
    baseUrl: undefined,
    apiKey: undefined
  };
}

export const genericHttpTtsAdapter: TTSProviderAdapter = {
  id: "generic_http_tts",
  isConfigured() {
    return Boolean(env("KOKORO_API_BASE_URL") || env("CHATTERBOX_API_BASE_URL"));
  },
  async synthesize({ text, model }): Promise<SynthesizeResult> {
    const config = providerConfig(model.id);
    if (!config.baseUrl) {
      throw new TTSProviderError(
        `${config.id} requires an API base URL for server-side TTS.`,
        "generic_http_tts"
      );
    }

    const url = `${cleanBaseUrl(config.baseUrl)}/v1/audio/speech`;
    const started = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: jsonHeaders(config.apiKey),
      body: JSON.stringify({
        model: model.api_model_name,
        voice: getVoice(model.default_voice, "default"),
        input: text,
        text,
        response_format: "mp3"
      })
    });

    const contentType = response.headers.get("content-type") || "";
    if (response.ok && contentType.startsWith("audio/")) {
      return {
        audioBuffer: Buffer.from(await response.arrayBuffer()),
        mimeType: contentType.split(";")[0] || "audio/mpeg",
        generationMs: Date.now() - started
      };
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new TTSProviderError(
        `${config.id} TTS failed with ${response.status}: ${body.slice(0, 300)}`,
        "generic_http_tts"
      );
    }

    const payload = await response.json();
    const audioPayload = findAudioPayload(payload);
    if (!audioPayload) {
      throw new TTSProviderError(`${config.id} did not return audio data.`, "generic_http_tts");
    }

    return {
      audioBuffer: decodeBase64OrHex(audioPayload),
      mimeType: "audio/mpeg",
      generationMs: Date.now() - started
    };
  }
};
