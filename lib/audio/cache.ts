import "server-only";

import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { AudioCacheRow, ModelRow } from "@/lib/db/types";
import { env, envNumber } from "@/lib/env";
import { hashText } from "@/lib/text";
import { getTtsAdapter } from "@/lib/tts/registry";
import {
  AUDIO_BUCKET,
  createSignedAudioUrl,
  newOpaqueAudioPath
} from "@/lib/audio/storage";

export type BattleAudio = {
  audioCacheId: string;
  audioUrl: string;
  expiresAt: string;
};

function cacheVersion() {
  return env("TTS_CONFIG_VERSION") || "v1";
}

function buildCacheKey(model: ModelRow, textHash: string) {
  const rawKey = [
    model.id,
    model.api_model_name,
    model.default_voice || "",
    cacheVersion(),
    textHash
  ].join(":");

  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

function audioExpiresAt() {
  const ttlDays = envNumber("AUDIO_CACHE_TTL_DAYS", 30);
  return new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
}

async function findFreshCache(
  supabase: SupabaseClient,
  cacheKey: string
): Promise<AudioCacheRow | null> {
  const { data, error } = await supabase
    .from("audio_cache")
    .select("*")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as AudioCacheRow | null;
}

export async function recordModelFailure(
  supabase: SupabaseClient,
  modelId: string,
  error: unknown
) {
  const message = error instanceof Error ? error.message : String(error);
  const { error: rpcError } = await supabase.rpc("increment_model_failure", {
    p_model_id: modelId,
    p_last_failure: message.slice(0, 1000)
  });

  if (rpcError) {
    throw rpcError;
  }
}

export async function getOrCreateBattleAudio(options: {
  supabase: SupabaseClient;
  model: ModelRow;
  text: string;
}): Promise<BattleAudio> {
  const { supabase, model, text } = options;
  const textHash = hashText(text);
  const cacheKey = buildCacheKey(model, textHash);
  const existing = await findFreshCache(supabase, cacheKey);

  if (existing) {
    return {
      audioCacheId: existing.id,
      audioUrl: await createSignedAudioUrl(supabase, existing.storage_path),
      expiresAt: existing.expires_at
    };
  }

  const adapter = getTtsAdapter(model.adapter);
  const result = await adapter.synthesize({ text, model });
  const storagePath = newOpaqueAudioPath(result.mimeType);
  const expiresAt = audioExpiresAt();

  const { error: uploadError } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(storagePath, result.audioBuffer, {
      contentType: result.mimeType,
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error: insertError } = await supabase
    .from("audio_cache")
    .insert({
      cache_key: cacheKey,
      model_id: model.id,
      text_hash: textHash,
      text_length: text.length,
      storage_path: storagePath,
      mime_type: result.mimeType,
      generation_ms: result.generationMs,
      expires_at: expiresAt.toISOString()
    })
    .select("*")
    .single();

  if (insertError) {
    const racedCache = await findFreshCache(supabase, cacheKey);
    if (racedCache) {
      return {
        audioCacheId: racedCache.id,
        audioUrl: await createSignedAudioUrl(supabase, racedCache.storage_path),
        expiresAt: racedCache.expires_at
      };
    }

    throw insertError;
  }

  const row = data as AudioCacheRow;
  return {
    audioCacheId: row.id,
    audioUrl: await createSignedAudioUrl(supabase, row.storage_path),
    expiresAt: row.expires_at
  };
}
