export type ModelRow = {
  id: string;
  display_order: number;
  display_name: string;
  provider: string;
  adapter: string;
  api_model_name: string;
  default_voice: string | null;
  enabled: boolean;
  elo: number;
  wins: number;
  losses: number;
  battles: number;
  failures: number;
  last_failure: string | null;
  created_at: string;
  updated_at: string;
};

export type AudioCacheRow = {
  id: string;
  cache_key: string;
  model_id: string;
  text_hash: string;
  text_length: number;
  storage_path: string;
  mime_type: string;
  generation_ms: number | null;
  expires_at: string;
  created_at: string;
};

export type LeaderboardRow = {
  id: string;
  display_name: string;
  provider: string;
  elo: number;
  wins: number;
  losses: number;
  battles: number;
  win_rate: number;
};

export type VoteRevealRow = {
  battle_id: string;
  chosen_side: "left" | "right";
  winner_model_id: string;
  loser_model_id: string;
  winner_display_name: string;
  winner_provider: string;
  loser_display_name: string;
  loser_provider: string;
  left_display_name: string;
  left_provider: string;
  left_elo_after: number;
  right_display_name: string;
  right_provider: string;
  right_elo_after: number;
  winner_elo_before: number;
  loser_elo_before: number;
  winner_elo_after: number;
  loser_elo_after: number;
};
