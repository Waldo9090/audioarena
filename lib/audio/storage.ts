import "server-only";

import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const AUDIO_BUCKET = "audio-cache";

export function extensionForMimeType(mimeType: string) {
  if (mimeType.includes("wav")) {
    return "wav";
  }

  if (mimeType.includes("ogg")) {
    return "ogg";
  }

  if (mimeType.includes("mp4") || mimeType.includes("aac")) {
    return "m4a";
  }

  return "mp3";
}

export function newOpaqueAudioPath(mimeType: string) {
  return `audio-cache/${crypto.randomUUID()}.${extensionForMimeType(mimeType)}`;
}

export async function createSignedAudioUrl(
  supabase: SupabaseClient,
  storagePath: string
) {
  const { data, error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(storagePath, 60 * 30);

  if (error || !data?.signedUrl) {
    throw error || new Error("Unable to create signed audio URL.");
  }

  return data.signedUrl;
}
