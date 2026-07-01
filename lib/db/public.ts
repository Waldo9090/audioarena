import "server-only";

import type { LeaderboardRow, ModelRow } from "@/lib/db/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isModelRuntimeConfigured } from "@/lib/tts/registry";

export type PublicModelSummary = Pick<
  ModelRow,
  | "id"
  | "display_order"
  | "display_name"
  | "provider"
  | "adapter"
  | "enabled"
  | "elo"
  | "wins"
  | "losses"
  | "battles"
  | "failures"
> & {
  runtime_configured: boolean;
};

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getLeaderboardRows(): Promise<LeaderboardRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("elo", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    display_name: row.display_name,
    provider: row.provider,
    elo: asNumber(row.elo),
    wins: row.wins || 0,
    losses: row.losses || 0,
    battles: row.battles || 0,
    win_rate: asNumber(row.win_rate)
  }));
}

export async function getModelSummaries(): Promise<PublicModelSummary[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("model_summaries")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data || []) as ModelRow[]).map((model) => ({
    id: model.id,
    display_order: model.display_order,
    display_name: model.display_name,
    provider: model.provider,
    adapter: model.adapter,
    enabled: model.enabled,
    elo: asNumber(model.elo),
    wins: model.wins || 0,
    losses: model.losses || 0,
    battles: model.battles || 0,
    failures: model.failures || 0,
    runtime_configured: isModelRuntimeConfigured(model)
  }));
}
