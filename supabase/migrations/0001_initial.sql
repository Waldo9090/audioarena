create extension if not exists pgcrypto;

create table if not exists public.models (
  id text primary key,
  display_order integer not null default 0,
  display_name text not null,
  provider text not null,
  adapter text not null,
  api_model_name text not null,
  default_voice text null,
  enabled boolean not null default false,
  elo numeric not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  battles integer not null default 0,
  failures integer not null default 0,
  last_failure text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audio_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  model_id text not null references public.models(id) on delete restrict,
  text_hash text not null,
  text_length integer not null check (text_length >= 0 and text_length <= 1000),
  storage_path text not null unique,
  mime_type text not null,
  generation_ms integer null check (generation_ms is null or generation_ms >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.battles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text_hash text not null,
  text_length integer not null check (text_length >= 0 and text_length <= 1000),
  left_model_id text not null references public.models(id) on delete restrict,
  right_model_id text not null references public.models(id) on delete restrict,
  left_audio_cache_id uuid not null references public.audio_cache(id) on delete restrict,
  right_audio_cache_id uuid not null references public.audio_cache(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'voted', 'failed')),
  created_at timestamptz not null default now(),
  voted_at timestamptz null,
  constraint battles_distinct_models check (left_model_id <> right_model_id)
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null unique references public.battles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  chosen_side text not null check (chosen_side in ('left', 'right')),
  winner_model_id text not null references public.models(id) on delete restrict,
  loser_model_id text not null references public.models(id) on delete restrict,
  winner_elo_before numeric not null,
  loser_elo_before numeric not null,
  winner_elo_after numeric not null,
  loser_elo_after numeric not null,
  created_at timestamptz not null default now(),
  constraint votes_distinct_models check (winner_model_id <> loser_model_id)
);

create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete cascade,
  ip_hash text null,
  event_type text not null,
  created_at timestamptz not null default now(),
  constraint rate_limit_subject_present check (user_id is not null or ip_hash is not null)
);

create index if not exists models_enabled_idx on public.models(enabled);
create index if not exists models_elo_idx on public.models(elo desc);
create index if not exists audio_cache_lookup_idx on public.audio_cache(cache_key, expires_at);
create index if not exists audio_cache_expiry_idx on public.audio_cache(expires_at);
create index if not exists battles_user_created_idx on public.battles(user_id, created_at desc);
create index if not exists votes_user_created_idx on public.votes(user_id, created_at desc);
create index if not exists rate_limit_user_idx on public.rate_limit_events(user_id, event_type, created_at desc);
create index if not exists rate_limit_ip_idx on public.rate_limit_events(ip_hash, event_type, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists models_set_updated_at on public.models;
create trigger models_set_updated_at
before update on public.models
for each row execute function public.set_updated_at();

insert into public.models (
  id,
  display_order,
  display_name,
  provider,
  adapter,
  api_model_name,
  default_voice,
  enabled,
  elo,
  created_at,
  updated_at
)
values
  ('google-gemini-25-pro-tts', 1, 'Google Gemini 2.5 Pro TTS', 'Google', 'fal', 'fal:google-gemini-25-pro-tts', 'Kore', true, 1000, '2026-01-01 00:00:01+00', '2026-01-01 00:00:01+00'),
  ('google-gemini-31-flash-tts', 2, 'Google Gemini 3.1 Flash TTS', 'Google', 'fal', 'fal:google-gemini-31-flash-tts', 'Kore', true, 1000, '2026-01-01 00:00:02+00', '2026-01-01 00:00:02+00'),
  ('google-gemini-25-flash-tts', 3, 'Google Gemini 2.5 Flash TTS', 'Google', 'fal', 'fal:google-gemini-25-flash-tts', 'Kore', true, 1000, '2026-01-01 00:00:03+00', '2026-01-01 00:00:03+00'),
  ('elevenlabs-eleven-v3', 4, 'ElevenLabs Eleven v3', 'ElevenLabs', 'fal', 'fal-ai/elevenlabs/tts/eleven-v3', 'Aria', true, 1000, '2026-01-01 00:00:04+00', '2026-01-01 00:00:04+00'),
  ('openai-gpt-4o-mini-tts', 5, 'OpenAI GPT-4o Mini TTS', 'OpenAI', 'openai', 'gpt-4o-mini-tts', 'alloy', true, 1000, '2026-01-01 00:00:05+00', '2026-01-01 00:00:05+00'),
  ('xai-grok-tts', 6, 'Grok TTS', 'xAI', 'fal', 'xai/tts/v1', 'eve', true, 1000, '2026-01-01 00:00:06+00', '2026-01-01 00:00:06+00'),
  ('azure-mai-voice-2', 7, 'MAI-Voice-2', 'Microsoft/Azure', 'azure', 'mai-voice-2', 'en-US-AvaMultilingualNeural', true, 1000, '2026-01-01 00:00:07+00', '2026-01-01 00:00:07+00'),
  ('cartesia-sonic-35', 8, 'Cartesia Sonic 3.5', 'Cartesia', 'cartesia', 'sonic-3.5', '694f9389-aac1-45b6-b726-9d9369183238', true, 1000, '2026-01-01 00:00:08+00', '2026-01-01 00:00:08+00'),
  ('minimax-speech-25-turbo', 9, 'MiniMax Speech-2.5 Turbo', 'MiniMax', 'fal', 'fal:minimax-speech-25-turbo', 'English_Trustworth_Man', true, 1000, '2026-01-01 00:00:09+00', '2026-01-01 00:00:09+00'),
  ('minimax-speech-02-hd', 10, 'MiniMax Speech-02 HD', 'MiniMax', 'fal', 'fal:minimax-speech-02-hd', 'English_Trustworth_Man', true, 1000, '2026-01-01 00:00:10+00', '2026-01-01 00:00:10+00'),
  ('inworld-tts-15-max', 11, 'Inworld TTS-1.5 Max', 'Inworld', 'fal', 'fal:inworld-tts-15-max', 'default', true, 1000, '2026-01-01 00:00:11+00', '2026-01-01 00:00:11+00'),
  ('hume-octave', 12, 'Hume Octave', 'Hume', 'hume', 'octave', 'default', true, 1000, '2026-01-01 00:00:12+00', '2026-01-01 00:00:12+00'),
  ('lightning-v31-pro', 13, 'Lightning v3.1 Pro', 'Lightning', 'lightning', 'lightning-v3.1-pro', 'default', true, 1000, '2026-01-01 00:00:13+00', '2026-01-01 00:00:13+00'),
  ('murf-ai-gen2', 14, 'Murf AI Gen2', 'Murf', 'murf', 'murf-gen2', 'en-US-natalie', true, 1000, '2026-01-01 00:00:14+00', '2026-01-01 00:00:14+00'),
  ('lightning-v31', 15, 'Lightning v3.1', 'Lightning', 'lightning', 'lightning-v3.1', 'default', true, 1000, '2026-01-01 00:00:15+00', '2026-01-01 00:00:15+00'),
  ('mistral-voxtral-mini-2603', 16, 'Voxtral Mini TTS (2603)', 'Mistral', 'mistral', 'voxtral-mini-2603', 'default', true, 1000, '2026-01-01 00:00:16+00', '2026-01-01 00:00:16+00'),
  ('qwen3-tts-flash', 17, 'Qwen3 TTS Flash', 'Alibaba/Qwen', 'fal', 'fal:qwen3-tts-flash', 'Cherry', true, 1000, '2026-01-01 00:00:17+00', '2026-01-01 00:00:17+00'),
  ('kokoro-tts', 18, 'Kokoro TTS', 'Kokoro', 'fal', 'fal:kokoro-tts', 'af_heart', true, 1000, '2026-01-01 00:00:18+00', '2026-01-01 00:00:18+00'),
  ('deepgram-aura-v2', 19, 'Deepgram Aura v2', 'Deepgram', 'deepgram', 'aura-2-thalia-en', null, true, 1000, '2026-01-01 00:00:19+00', '2026-01-01 00:00:19+00'),
  ('amazon-polly', 20, 'Amazon Polly', 'Amazon', 'amazon_polly', 'neural', 'Joanna', true, 1000, '2026-01-01 00:00:20+00', '2026-01-01 00:00:20+00'),
  ('chatterbox', 21, 'Chatterbox', 'Chatterbox', 'fal', 'fal:chatterbox', 'default', true, 1000, '2026-01-01 00:00:21+00', '2026-01-01 00:00:21+00'),
  ('maya1', 22, 'Maya1', 'Maya', 'maya', 'maya1', 'default', true, 1000, '2026-01-01 00:00:22+00', '2026-01-01 00:00:22+00')
on conflict (id) do update set
  display_order = excluded.display_order,
  display_name = excluded.display_name,
  provider = excluded.provider,
  adapter = excluded.adapter,
  api_model_name = excluded.api_model_name,
  default_voice = excluded.default_voice,
  updated_at = now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio-cache',
  'audio-cache',
  false,
  52428800,
  array['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/ogg']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.models enable row level security;
alter table public.audio_cache enable row level security;
alter table public.battles enable row level security;
alter table public.votes enable row level security;
alter table public.rate_limit_events enable row level security;

drop view if exists public.leaderboard;
drop view if exists public.model_summaries;

create view public.model_summaries as
select
  id,
  display_order,
  display_name,
  provider,
  adapter,
  enabled,
  elo,
  wins,
  losses,
  battles,
  failures,
  created_at,
  updated_at
from public.models;

create view public.leaderboard as
select
  id,
  display_name,
  provider,
  elo,
  wins,
  losses,
  battles,
  case when battles = 0 then 0::numeric else wins::numeric / battles::numeric end as win_rate
from public.models
where enabled = true
order by elo desc, battles desc, display_name asc;

grant select on public.model_summaries to anon, authenticated;
grant select on public.leaderboard to anon, authenticated;

create or replace function public.increment_model_failure(
  p_model_id text,
  p_last_failure text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.models
  set failures = failures + 1,
      last_failure = p_last_failure
  where id = p_model_id;
$$;

revoke all on function public.increment_model_failure(text, text) from anon, authenticated;
grant execute on function public.increment_model_failure(text, text) to service_role;

create or replace function public.cast_vote(
  p_battle_id uuid,
  p_user_id uuid,
  p_chosen_side text,
  p_k_factor numeric default 32
)
returns table (
  battle_id uuid,
  chosen_side text,
  winner_model_id text,
  loser_model_id text,
  winner_display_name text,
  winner_provider text,
  loser_display_name text,
  loser_provider text,
  left_display_name text,
  left_provider text,
  left_elo_after numeric,
  right_display_name text,
  right_provider text,
  right_elo_after numeric,
  winner_elo_before numeric,
  loser_elo_before numeric,
  winner_elo_after numeric,
  loser_elo_after numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_battle public.battles%rowtype;
  v_left public.models%rowtype;
  v_right public.models%rowtype;
  v_winner_id text;
  v_loser_id text;
  v_winner_before numeric;
  v_loser_before numeric;
  v_winner_expected numeric;
  v_loser_expected numeric;
  v_winner_after numeric;
  v_loser_after numeric;
  v_left_after numeric;
  v_right_after numeric;
begin
  if p_chosen_side not in ('left', 'right') then
    raise exception 'Invalid vote side';
  end if;

  select * into v_battle
  from public.battles
  where id = p_battle_id
  for update;

  if not found then
    raise exception 'Battle not found';
  end if;

  if v_battle.user_id <> p_user_id then
    raise exception 'Battle does not belong to this user';
  end if;

  if v_battle.status <> 'pending' then
    raise exception 'Battle has already been resolved';
  end if;

  select * into v_left
  from public.models
  where id = v_battle.left_model_id
  for update;

  select * into v_right
  from public.models
  where id = v_battle.right_model_id
  for update;

  if p_chosen_side = 'left' then
    v_winner_id := v_left.id;
    v_loser_id := v_right.id;
    v_winner_before := v_left.elo;
    v_loser_before := v_right.elo;
  else
    v_winner_id := v_right.id;
    v_loser_id := v_left.id;
    v_winner_before := v_right.elo;
    v_loser_before := v_left.elo;
  end if;

  v_winner_expected := 1 / (1 + power(10, (v_loser_before - v_winner_before) / 400));
  v_loser_expected := 1 / (1 + power(10, (v_winner_before - v_loser_before) / 400));
  v_winner_after := v_winner_before + p_k_factor * (1 - v_winner_expected);
  v_loser_after := v_loser_before + p_k_factor * (0 - v_loser_expected);

  insert into public.votes (
    battle_id,
    user_id,
    chosen_side,
    winner_model_id,
    loser_model_id,
    winner_elo_before,
    loser_elo_before,
    winner_elo_after,
    loser_elo_after
  )
  values (
    p_battle_id,
    p_user_id,
    p_chosen_side,
    v_winner_id,
    v_loser_id,
    v_winner_before,
    v_loser_before,
    v_winner_after,
    v_loser_after
  );

  update public.models
  set
    elo = case when id = v_winner_id then v_winner_after else v_loser_after end,
    wins = wins + case when id = v_winner_id then 1 else 0 end,
    losses = losses + case when id = v_loser_id then 1 else 0 end,
    battles = battles + 1
  where id in (v_winner_id, v_loser_id);

  update public.battles
  set status = 'voted', voted_at = now()
  where id = p_battle_id;

  if p_chosen_side = 'left' then
    v_left_after := v_winner_after;
    v_right_after := v_loser_after;
  else
    v_left_after := v_loser_after;
    v_right_after := v_winner_after;
  end if;

  return query
  select
    p_battle_id,
    p_chosen_side,
    v_winner_id,
    v_loser_id,
    case when p_chosen_side = 'left' then v_left.display_name else v_right.display_name end,
    case when p_chosen_side = 'left' then v_left.provider else v_right.provider end,
    case when p_chosen_side = 'left' then v_right.display_name else v_left.display_name end,
    case when p_chosen_side = 'left' then v_right.provider else v_left.provider end,
    v_left.display_name,
    v_left.provider,
    v_left_after,
    v_right.display_name,
    v_right.provider,
    v_right_after,
    v_winner_before,
    v_loser_before,
    v_winner_after,
    v_loser_after;
end;
$$;

revoke all on function public.cast_vote(uuid, uuid, text, numeric) from anon, authenticated;
grant execute on function public.cast_vote(uuid, uuid, text, numeric) to service_role;
