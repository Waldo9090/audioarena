import { env } from "@/lib/env";
import type { SynthesizeResult } from "@/lib/tts/types";

export const noTtsEndpointMessage =
  "Provider is configured but no TTS endpoint is implemented.";

export class TTSProviderError extends Error {
  constructor(
    message: string,
    public readonly providerId: string
  ) {
    super(message);
    this.name = "TTSProviderError";
  }
}

export function hasEnv(...names: string[]) {
  return names.every((name) => Boolean(env(name)));
}

export function hasAnyEnv(...names: string[]) {
  return names.some((name) => Boolean(env(name)));
}

export function bearerHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`
  };
}

export function jsonHeaders(apiKey?: string) {
  return {
    ...(apiKey ? bearerHeaders(apiKey) : {}),
    "Content-Type": "application/json"
  };
}

export function getVoice(modelVoice: string | null, fallback: string) {
  return modelVoice && modelVoice.trim().length > 0 ? modelVoice : fallback;
}

export function cleanBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

export async function fetchAudio(
  providerId: string,
  url: string,
  init: RequestInit,
  fallbackMimeType = "audio/mpeg"
): Promise<SynthesizeResult> {
  const started = Date.now();
  const response = await fetch(url, init);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new TTSProviderError(
      `${providerId} TTS failed with ${response.status}: ${body.slice(0, 300)}`,
      providerId
    );
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const mimeType =
    response.headers.get("content-type")?.split(";")[0]?.trim() || fallbackMimeType;

  return {
    audioBuffer,
    mimeType,
    generationMs: Date.now() - started
  };
}

export function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function decodeBase64OrHex(value: string) {
  const compact = value.trim();
  if (/^[a-f0-9]+$/i.test(compact) && compact.length % 2 === 0) {
    return Buffer.from(compact, "hex");
  }

  return Buffer.from(compact, "base64");
}

export function findAudioPayload(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  for (const key of ["audio", "audio_base64", "audioContent", "audio_content", "base64"]) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.length > 64) {
      return candidate;
    }
  }

  for (const nested of Object.values(record)) {
    if (Array.isArray(nested)) {
      for (const item of nested) {
        const found = findAudioPayload(item);
        if (found) {
          return found;
        }
      }
    } else if (typeof nested === "object") {
      const found = findAudioPayload(nested);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

export function pcm16ToWav(pcmBuffer: Buffer, sampleRate = 24000, channels = 1) {
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const wavHeader = Buffer.alloc(44);

  wavHeader.write("RIFF", 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write("WAVE", 8);
  wavHeader.write("fmt ", 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(channels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(16, 34);
  wavHeader.write("data", 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([wavHeader, pcmBuffer]);
}
