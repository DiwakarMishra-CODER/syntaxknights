-- Schema for the AI interview agent.
-- ALL session state lives here. Vercel serverless is stateless: nothing may
-- be held in an in-memory Map, module global, or variable between requests.

create extension if not exists "pgcrypto";

-- One row per interview session, keyed by the client-supplied sessionId.
create table if not exists sessions (
  id          text primary key,
  candidate   jsonb       not null,
  blueprint   jsonb,
  state       jsonb       not null default '{}'::jsonb,
  status      text        not null default 'active',
  created_at  timestamptz not null default now()
);

-- Every interviewer and candidate turn, in order.
create table if not exists turns (
  id           uuid        primary key default gen_random_uuid(),
  session_id   text        not null references sessions(id) on delete cascade,
  turn_number  int         not null,
  role         text        not null,
  content      text        not null,
  target_day   int,
  depth        int,
  rubric       jsonb,
  claims       jsonb       not null default '[]'::jsonb,
  rationale    text,
  created_at   timestamptz not null default now()
);

-- getRecentTurns() reads the tail of a session; this index serves it directly.
create index if not exists turns_session_turn_idx
  on turns (session_id, turn_number);

-- One final report per session.
create table if not exists reports (
  session_id  text        primary key references sessions(id) on delete cascade,
  feedback    jsonb       not null,
  created_at  timestamptz not null default now()
);
