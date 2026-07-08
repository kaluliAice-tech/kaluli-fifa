-- =====================================================================
-- Kaluli FIFA World Cup 2026 Prediction Game — Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)
--
-- Game scope: Quarter Final (8 besar) through Final only.
-- 'round' columns/checks intentionally only allow: quarter_final,
-- semi_final, final. Round of 16 and earlier rounds are out of scope.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text,
  instagram text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------
create table if not exists public.matches (
  id text primary key, -- e.g. 'm1', 'q1', 's1', 'f1'
  round text not null check (round in ('quarter_final','semi_final','final')),
  team_a text not null,
  team_b text not null,
  team_a_flag text,
  team_b_flag text,
  team_a_score int,
  team_b_score int,
  winner_team text,
  kickoff_time timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming','locked','finished')),
  next_match_id text references public.matches(id),
  source_updated_at timestamptz,
  official_source_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- predictions
-- ---------------------------------------------------------------------
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  match_id text not null references public.matches(id) on delete cascade,
  round text not null check (round in ('quarter_final','semi_final','final')),
  predicted_winner text not null,
  is_correct boolean, -- null until match is finished + points recalculated
  points_earned int,
  multiplier int not null default 1,
  submitted_at timestamptz not null default now(),
  -- one prediction per user per round (enforces "1 match per active round")
  unique (user_id, round)
);

-- ---------------------------------------------------------------------
-- leaderboard (denormalized aggregate, kept in sync via trigger below)
-- ---------------------------------------------------------------------
create table if not exists public.leaderboard (
  user_id uuid primary key references public.users(id) on delete cascade,
  total_points int not null default 0,
  correct_predictions int not null default 0,
  longest_streak int not null default 0,
  current_streak int not null default 0,
  last_submit_time timestamptz
);

-- ---------------------------------------------------------------------
-- settings (single-row key/value store, used for e.g. active_round)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  key text primary key,
  value text
);

insert into public.settings (key, value)
values ('active_round', 'quarter_final')
on conflict (key) do nothing;

-- =====================================================================
-- Function: recompute a single user's leaderboard row from predictions
-- =====================================================================
create or replace function public.recompute_leaderboard_for_user(p_user_id uuid)
returns void
language plpgsql
as $$
declare
  rec record;
  round_order text[] := array['quarter_final','semi_final','final'];
  prev_correct boolean := false;
  total int := 0;
  correct_count int := 0;
  cur_streak int := 0;
  longest int := 0;
  last_submit timestamptz;
begin
  for rec in
    select p.*
    from public.predictions p
    where p.user_id = p_user_id
    order by array_position(round_order, p.round)
  loop
    last_submit := rec.submitted_at;
    if rec.is_correct is true then
      correct_count := correct_count + 1;
      cur_streak := cur_streak + 1;
      longest := greatest(longest, cur_streak);
      total := total + coalesce(rec.points_earned, 0);
      prev_correct := true;
    elsif rec.is_correct is false then
      cur_streak := 0;
      prev_correct := false;
    end if;
  end loop;

  insert into public.leaderboard (user_id, total_points, correct_predictions, longest_streak, current_streak, last_submit_time)
  values (p_user_id, total, correct_count, longest, cur_streak, last_submit)
  on conflict (user_id) do update set
    total_points = excluded.total_points,
    correct_predictions = excluded.correct_predictions,
    longest_streak = excluded.longest_streak,
    current_streak = excluded.current_streak,
    last_submit_time = excluded.last_submit_time;
end;
$$;

-- Keep leaderboard in sync whenever a prediction is scored/updated
create or replace function public.on_prediction_change()
returns trigger
language plpgsql
as $$
begin
  perform public.recompute_leaderboard_for_user(coalesce(new.user_id, old.user_id));
  return new;
end;
$$;

drop trigger if exists trg_prediction_change on public.predictions;
create trigger trg_prediction_change
after insert or update or delete on public.predictions
for each row execute function public.on_prediction_change();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.users enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.leaderboard enable row level security;
alter table public.settings enable row level security;

-- matches & leaderboard & settings: readable by everyone (anon key)
create policy "matches are public read" on public.matches for select using (true);
create policy "leaderboard is public read" on public.leaderboard for select using (true);
create policy "settings are public read" on public.settings for select using (true);

-- users: anyone can insert (register); read limited to own row via app-level
-- filtering (since this app uses simple phone-based accounts, not Supabase
-- Auth, RLS here stays permissive — tighten with Supabase Auth for production).
create policy "anyone can register" on public.users for insert with check (true);
create policy "users are readable" on public.users for select using (true);

-- predictions: anyone can insert their own prediction; read is public
-- (needed for leaderboard/bracket "Your Pick" badges); no client-side update
-- of is_correct/points_earned — that should only happen via the admin
-- "Calculate Points" action using the service role key or an authenticated
-- admin RPC, never the public anon key.
create policy "predictions are public read" on public.predictions for select using (true);
create policy "anyone can submit a prediction" on public.predictions for insert with check (true);

-- Writes to matches/settings (admin actions: add match, update score, set
-- active round) should go through the Supabase service role key from a
-- trusted context, NOT the public anon key. For a quick launch you can also
-- protect these with a Postgres policy tied to a Supabase Auth admin role;
-- this schema intentionally does not expose public write policies on
-- matches/settings so the anon key alone cannot tamper with scores.
--
-- QUICK-LAUNCH OPTION (lower security, matches the brief's "simple password
-- protection" admin panel using only the anon key from the browser). Only
-- enable this if you accept that anyone who reverse-engineers the frontend
-- could bypass the /admin password screen and write directly via the anon
-- key. For a real campaign with real prizes, use Supabase Auth + a proper
-- admin role instead, and remove these two policies.
--
-- create policy "quick-launch: anon can write matches" on public.matches
--   for all using (true) with check (true);
-- create policy "quick-launch: anon can write settings" on public.settings
--   for all using (true) with check (true);
