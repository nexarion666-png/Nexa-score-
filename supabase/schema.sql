-- Optional Supabase persistence schema for future account history and consent-based rankings.
-- This app can run in preview mode without Supabase configured.
create extension if not exists pgcrypto;

create table if not exists public.score_snapshots (
  id uuid primary key default gen_random_uuid(),
  x_user_id text not null,
  x_username text not null,
  general_score integer not null check (general_score between 0 and 100),
  ct_score integer not null check (ct_score between 0 and 100),
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists score_snapshots_user_created_idx
  on public.score_snapshots (x_user_id, created_at desc);

create table if not exists public.leaderboard_opt_ins (
  id uuid primary key default gen_random_uuid(),
  x_user_id text not null unique,
  x_username text not null,
  display_name text,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.score_snapshots enable row level security;
alter table public.leaderboard_opt_ins enable row level security;

-- No public policies are added intentionally. Use a trusted server-side service role
-- for writes and add user-scoped policies only after app identity mapping is finalized.
