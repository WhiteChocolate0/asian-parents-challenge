-- Campaign-owned data lives in its own schema.  Do not put LINE Bot state here.
create schema if not exists campaign;
create extension if not exists pgcrypto;

create table if not exists campaign.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  anonymous_session_id uuid not null unique,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'expired', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'completed') = (completed_at is not null))
);

create or replace function campaign.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quiz_sessions_set_updated_at on campaign.quiz_sessions;
create trigger quiz_sessions_set_updated_at
before update on campaign.quiz_sessions
for each row execute function campaign.set_updated_at();

create index if not exists quiz_sessions_status_started_at_idx
  on campaign.quiz_sessions (status, started_at desc);

-- Browser traffic uses the website API; it never receives direct table grants.
alter table campaign.quiz_sessions enable row level security;
alter table campaign.quiz_sessions force row level security;
revoke all on schema campaign from anon, authenticated;
revoke all on campaign.quiz_sessions from anon, authenticated;
grant usage on schema campaign to service_role;
grant all on campaign.quiz_sessions to service_role;
