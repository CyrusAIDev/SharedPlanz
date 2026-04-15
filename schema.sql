-- Shared Planz — full schema
-- Run this in Supabase SQL editor (fresh database)

-- ── sessions ──────────────────────────────────────────────────────────────────
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text unique not null,
  created_at  timestamptz not null default now()
);

-- ── participants ──────────────────────────────────────────────────────────────
create table if not exists participants (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references sessions(id) on delete cascade,
  name          text not null,
  emoji         text,
  secret_emoji  text,
  joined_at     timestamptz not null default now(),
  unique (session_id, name)
);

-- ── plans ─────────────────────────────────────────────────────────────────────
create table if not exists plans (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid not null references sessions(id) on delete cascade,
  added_by          text not null,
  added_by_emoji    text,
  title             text not null,
  description       text,
  date_type         text not null default 'none',
  date_single       timestamptz,
  date_range_start  timestamptz,
  date_range_end    timestamptz,
  date_multi        text[],
  created_at        timestamptz not null default now()
);

-- ── ratings ───────────────────────────────────────────────────────────────────
create table if not exists ratings (
  id                uuid primary key default gen_random_uuid(),
  plan_id           uuid not null references plans(id) on delete cascade,
  participant_name  text not null,
  score             int not null check (score between 1 and 5),
  unique (plan_id, participant_name)
);

-- ── votes ─────────────────────────────────────────────────────────────────────
create table if not exists votes (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  created_by  text not null,
  question    text,
  plan_ids    text[] not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── vote_responses ────────────────────────────────────────────────────────────
create table if not exists vote_responses (
  id                uuid primary key default gen_random_uuid(),
  vote_id           uuid not null references votes(id) on delete cascade,
  participant_name  text not null,
  chosen_plan_id    uuid not null references plans(id) on delete cascade,
  unique (vote_id, participant_name)
);

-- ── availability ──────────────────────────────────────────────────────────────
create table if not exists availability (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references sessions(id) on delete cascade,
  participant_name    text not null,
  participant_emoji   text,
  free_dates          text[] not null default '{}',
  updated_at          timestamptz not null default now(),
  unique (session_id, participant_name)
);

-- ── Realtime ──────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table plans;
alter publication supabase_realtime add table ratings;
alter publication supabase_realtime add table votes;
alter publication supabase_realtime add table vote_responses;
alter publication supabase_realtime add table availability;

-- ── RLS (open for MVP) ────────────────────────────────────────────────────────
alter table sessions       enable row level security;
alter table participants   enable row level security;
alter table plans          enable row level security;
alter table ratings        enable row level security;
alter table votes          enable row level security;
alter table vote_responses enable row level security;
alter table availability   enable row level security;

create policy "public read sessions"         on sessions       for select using (true);
create policy "public insert sessions"       on sessions       for insert with check (true);
create policy "public read participants"     on participants   for select using (true);
create policy "public insert participants"   on participants   for insert with check (true);
create policy "public update participants"   on participants   for update using (true);
create policy "public read plans"            on plans          for select using (true);
create policy "public insert plans"          on plans          for insert with check (true);
create policy "public read ratings"          on ratings        for select using (true);
create policy "public insert ratings"        on ratings        for insert with check (true);
create policy "public update ratings"        on ratings        for update using (true);
create policy "public read votes"            on votes          for select using (true);
create policy "public insert votes"          on votes          for insert with check (true);
create policy "public update votes"          on votes          for update using (true);
create policy "public read vote_responses"   on vote_responses for select using (true);
create policy "public insert vote_responses" on vote_responses for insert with check (true);
create policy "public read availability"     on availability   for select using (true);
create policy "public insert availability"   on availability   for insert with check (true);
create policy "public update availability"   on availability   for update using (true);
