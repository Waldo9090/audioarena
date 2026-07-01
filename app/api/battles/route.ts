import crypto from "node:crypto";
import { NextResponse } from "next/server";

import {
  getOrCreateBattleAudio,
  recordModelFailure,
  type BattleAudio
} from "@/lib/audio/cache";
import type { ModelRow } from "@/lib/db/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { enforceRateLimit, getClientIp, hashIp, RateLimitError } from "@/lib/rate-limit";
import { moderateTextForSpeech } from "@/lib/safety/moderation";
import { hashText, validateArenaText } from "@/lib/text";
import { getConfiguredBattleModels } from "@/lib/tts/registry";

export const runtime = "nodejs";

type GeneratedBattle = {
  leftModel: ModelRow;
  rightModel: ModelRow;
  leftAudio: BattleAudio;
  rightAudio: BattleAudio;
};

function pickTwoModels(models: ModelRow[]) {
  const leftIndex = crypto.randomInt(models.length);
  let rightIndex = crypto.randomInt(models.length - 1);
  if (rightIndex >= leftIndex) {
    rightIndex += 1;
  }

  return [models[leftIndex], models[rightIndex]] as const;
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function generateBattlePair(options: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  models: ModelRow[];
  text: string;
}) {
  const candidates = [...options.models];
  let lastError: unknown;

  while (candidates.length >= 2) {
    const [leftModel, rightModel] = pickTwoModels(candidates);
    let leftAudio: BattleAudio;

    try {
      leftAudio = await getOrCreateBattleAudio({
        supabase: options.supabase,
        model: leftModel,
        text: options.text
      });
    } catch (error) {
      lastError = error;
      await recordModelFailure(options.supabase, leftModel.id, error).catch(() => undefined);
      removeCandidate(candidates, leftModel.id);
      continue;
    }

    try {
      const rightAudio = await getOrCreateBattleAudio({
        supabase: options.supabase,
        model: rightModel,
        text: options.text
      });

      return {
        leftModel,
        rightModel,
        leftAudio,
        rightAudio
      } satisfies GeneratedBattle;
    } catch (error) {
      lastError = error;
      await recordModelFailure(options.supabase, rightModel.id, error).catch(() => undefined);
      removeCandidate(candidates, rightModel.id);
    }
  }

  const detail = lastError instanceof Error ? lastError.message : undefined;
  throw new Error(
    detail
      ? `Not enough working TTS providers are available. Last provider error: ${detail}`
      : "Not enough working TTS providers are available."
  );
}

function removeCandidate(candidates: ModelRow[], modelId: string) {
  const index = candidates.findIndex((model) => model.id === modelId);
  if (index >= 0) {
    candidates.splice(index, 1);
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return apiError("Log in to generate an arena battle.", 401);
    }

    const body = (await request.json().catch(() => ({}))) as { text?: unknown };
    const validation = validateArenaText(body.text);
    if (!validation.ok) {
      return apiError(validation.message);
    }

    const moderation = await moderateTextForSpeech(validation.text);
    if (!moderation.allowed) {
      return apiError(moderation.message || "This text is not safe for speech generation.", 400);
    }

    const supabase = getSupabaseAdmin();
    const ipHash = hashIp(getClientIp(request));
    await enforceRateLimit(supabase, {
      eventType: "generation",
      userId: user.id,
      ipHash
    });

    const { data: modelRows, error: modelsError } = await supabase
      .from("models")
      .select("*")
      .eq("enabled", true);

    if (modelsError) {
      throw modelsError;
    }

    const configuredModels = getConfiguredBattleModels((modelRows || []) as ModelRow[]);
    if (configuredModels.length < 2) {
      return apiError(
        "At least two enabled TTS models need working server-side credentials before battles can run.",
        503
      );
    }

    const { leftModel, rightModel, leftAudio, rightAudio } = await generateBattlePair({
      supabase,
      models: configuredModels,
      text: validation.text
    });

    const { data: battle, error: battleError } = await supabase
      .from("battles")
      .insert({
        user_id: user.id,
        text_hash: hashText(validation.text),
        text_length: validation.text.length,
        left_model_id: leftModel.id,
        right_model_id: rightModel.id,
        left_audio_cache_id: leftAudio.audioCacheId,
        right_audio_cache_id: rightAudio.audioCacheId,
        status: "pending"
      })
      .select("id")
      .single();

    if (battleError || !battle) {
      throw battleError || new Error("Unable to create battle.");
    }

    return NextResponse.json({
      battleId: battle.id,
      left: {
        label: "A",
        audioUrl: leftAudio.audioUrl
      },
      right: {
        label: "B",
        audioUrl: rightAudio.audioUrl
      }
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return apiError(error.message, 429);
    }

    const message = error instanceof Error ? error.message : "Unable to create battle.";
    const isProviderAvailabilityError = message.startsWith("Not enough working TTS providers");
    return apiError(
      isProviderAvailabilityError
        ? "Not enough working TTS providers are available right now. Check provider keys or try again after disabling failing models."
        : message,
      isProviderAvailabilityError ? 503 : 500
    );
  }
}
