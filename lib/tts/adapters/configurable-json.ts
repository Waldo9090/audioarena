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

export function createConfigurableJsonTtsAdapter(options: {
  id: string;
  apiKeyEnv?: string;
  baseUrlEnv: string;
  defaultPath?: string;
  authHeader?: string;
}): TTSProviderAdapter {
  return {
    id: options.id,
    isConfigured() {
      return Boolean(env(options.baseUrlEnv) && (!options.apiKeyEnv || env(options.apiKeyEnv)));
    },
    async synthesize({ text, model }): Promise<SynthesizeResult> {
      const baseUrl = env(options.baseUrlEnv);
      const apiKey = options.apiKeyEnv ? env(options.apiKeyEnv) : undefined;

      if (!baseUrl || (options.apiKeyEnv && !apiKey)) {
        throw new Error(`${options.id} requires ${options.baseUrlEnv}${options.apiKeyEnv ? ` and ${options.apiKeyEnv}` : ""}.`);
      }

      const url = `${cleanBaseUrl(baseUrl)}${options.defaultPath || "/v1/audio/speech"}`;
      const headers =
        options.authHeader && apiKey
          ? { ...jsonHeaders(), [options.authHeader]: apiKey }
          : jsonHeaders(apiKey);
      const started = Date.now();
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: model.api_model_name,
          voice: getVoice(model.default_voice, "default"),
          input: text,
          text,
          response_format: "mp3",
          format: "mp3"
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
          `${options.id} TTS failed with ${response.status}: ${body.slice(0, 300)}`,
          options.id
        );
      }

      const payload = await response.json();
      const audioPayload = findAudioPayload(payload);
      if (!audioPayload) {
        throw new TTSProviderError(`${options.id} did not return audio data.`, options.id);
      }

      return {
        audioBuffer: decodeBase64OrHex(audioPayload),
        mimeType: "audio/mpeg",
        generationMs: Date.now() - started
      };
    }
  };
}
