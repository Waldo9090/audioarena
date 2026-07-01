import { NextResponse } from "next/server";
import { z } from "zod";

import type { VoteRevealRow } from "@/lib/db/types";
import { envNumber } from "@/lib/env";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const VoteSchema = z.object({
  battleId: z.uuid(),
  chosenSide: z.enum(["left", "right"])
});

function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return apiError("Log in to vote.", 401);
    }

    const parsed = VoteSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return apiError("Choose left or right for a valid battle.");
    }

    const supabase = getSupabaseAdmin();
    await enforceRateLimit(supabase, {
      eventType: "vote",
      userId: user.id
    });

    const { data, error } = await supabase
      .rpc("cast_vote", {
        p_battle_id: parsed.data.battleId,
        p_user_id: user.id,
        p_chosen_side: parsed.data.chosenSide,
        p_k_factor: envNumber("ELO_K_FACTOR", 32)
      })
      .single();

    if (error || !data) {
      return apiError(error?.message || "Unable to save vote.", 409);
    }

    const reveal = data as VoteRevealRow;
    return NextResponse.json({
      battleId: reveal.battle_id,
      chosenSide: reveal.chosen_side,
      winner: {
        name: reveal.winner_display_name,
        provider: reveal.winner_provider,
        eloBefore: reveal.winner_elo_before,
        eloAfter: reveal.winner_elo_after
      },
      loser: {
        name: reveal.loser_display_name,
        provider: reveal.loser_provider,
        eloBefore: reveal.loser_elo_before,
        eloAfter: reveal.loser_elo_after
      },
      left: {
        name: reveal.left_display_name,
        provider: reveal.left_provider,
        eloAfter: reveal.left_elo_after
      },
      right: {
        name: reveal.right_display_name,
        provider: reveal.right_provider,
        eloAfter: reveal.right_elo_after
      }
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return apiError(error.message, 429);
    }

    const message = error instanceof Error ? error.message : "Unable to save vote.";
    return apiError(message, 500);
  }
}
