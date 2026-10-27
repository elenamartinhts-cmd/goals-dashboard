-- Goals Dashboard — initial schema
-- Run this once in Supabase → SQL Editor → New query → Run

-- ── Settings ───────────────────────────────────────────────────────────────
create table if not exists settings (
  id          text primary key default 'singleton',
  data        jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

-- Insert default settings row
insert into settings (id, data) values ('singleton', '{
  "income_goal": 10000,
  "core_closes_target": 5,
  "offers": [
    {
      "id": "core",
      "name": "Core offer — $19,000",
      "price": 19000,
      "commission": 1900,
      "is_core": true
    }
  ],
  "working_days": ["mon","tue","wed","thu","fri","sat"],
  "shift_start": "15:00",
  "shift_end": "03:00",
  "motto": "$10K months. Act like it.",
  "morning_start": "05:00",
  "night_start": "15:00",
  "expected_calls_per_day": 4,
  "tracking_start": "2026-11-01",
  "warmup_start": "2026-10-27",
  "tracking_end": "2026-12-31"
}')
on conflict (id) do nothing;

-- ── Calls ──────────────────────────────────────────────────────────────────
create table if not exists calls (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  showed      boolean not null,
  outcome     text,  -- 'closed' | 'deposit' | 'follow_up' | 'lost' | null (no-show)
  offer_id    text,
  commission  numeric(10,2),
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists calls_date_idx on calls (date desc);

-- ── Skill reviews ──────────────────────────────────────────────────────────
create table if not exists skill_reviews (
  id                    uuid primary key default gen_random_uuid(),
  date                  date not null,
  calls_reviewed        int not null default 0,
  objection_handling    numeric(3,1),  -- 1–5 or null
  statement_close       numeric(3,1),
  commitment_phase      numeric(3,1),
  tonality_confidence   numeric(3,1),
  deep_questions        numeric(3,1),
  focus_skill           text not null default '',
  why                   text not null default '',
  drill                 text not null default '',
  todos                 text[] not null default '{}',
  win                   text not null default '',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists reviews_date_idx on skill_reviews (date desc);

-- ── Sheet cache ────────────────────────────────────────────────────────────
create table if not exists sheet_cache (
  id          text primary key default 'singleton',
  fetched_at  timestamptz not null default now(),
  data        jsonb not null default '{}'
);

-- ── updated_at trigger function ────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger calls_updated_at
  before update on calls
  for each row execute function set_updated_at();

create trigger reviews_updated_at
  before update on skill_reviews
  for each row execute function set_updated_at();
