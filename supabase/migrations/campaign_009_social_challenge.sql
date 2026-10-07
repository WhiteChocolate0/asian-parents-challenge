-- Anonymous challenge identity and direct referral network. Existing attempts stay intact.
create table if not exists campaign.participants (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(nickname) between 2 and 12),
  anonymous_token_hash text not null unique check (anonymous_token_hash ~ '^[0-9a-f]{64}$'),
  public_leaderboard_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists campaign.referral_links (
  id uuid primary key default gen_random_uuid(),
  owner_participant_id uuid not null unique references campaign.participants(id),
  token text not null unique check (token ~ '^[A-Za-z0-9_-]{12,64}$'),
  created_at timestamptz not null default now()
);

alter table campaign.participants
  add column if not exists source_referral_link_id uuid references campaign.referral_links(id);
alter table campaign.quiz_sessions
  add column if not exists participant_id uuid references campaign.participants(id),
  add column if not exists source_referral_link_id uuid references campaign.referral_links(id);
alter table campaign.quiz_results
  add column if not exists participant_id uuid references campaign.participants(id),
  add column if not exists completed_at timestamptz;

alter table campaign.quiz_results alter column completed_at set default now();

create table if not exists campaign.referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_link_id uuid not null references campaign.referral_links(id),
  visitor_participant_id uuid references campaign.participants(id),
  quiz_session_id uuid references campaign.quiz_sessions(id),
  event_type text not null check (event_type in ('OPENED', 'STARTED', 'COMPLETED')),
  created_at timestamptz not null default now(),
  check (event_type = 'OPENED' or visitor_participant_id is not null)
);

create unique index if not exists referral_events_once_per_session_idx
  on campaign.referral_events (quiz_session_id, event_type)
  where quiz_session_id is not null;
create index if not exists referral_events_link_type_created_idx
  on campaign.referral_events (referral_link_id, event_type, created_at desc);
create index if not exists participants_source_referral_idx
  on campaign.participants (source_referral_link_id);
create index if not exists quiz_sessions_participant_idx
  on campaign.quiz_sessions (participant_id, completed_at desc);
create index if not exists quiz_results_participant_completed_idx
  on campaign.quiz_results (participant_id, completed_at desc, id desc);

-- The board is derived from the newest completed attempt, never stored separately.
create or replace view campaign.latest_participant_results as
select distinct on (r.participant_id)
  r.participant_id, p.nickname, p.public_leaderboard_opt_in,
  coalesce(p.source_referral_link_id, s.source_referral_link_id) as source_referral_link_id,
  r.defense_value, r.persona_key,
  r.completed_at, r.id as result_id
from campaign.quiz_results r
join campaign.participants p on p.id = r.participant_id
join campaign.quiz_sessions s on s.id = r.quiz_session_id
where s.status = 'completed' and r.completed_at is not null
order by r.participant_id, r.completed_at desc, r.id desc;
revoke all on campaign.latest_participant_results from anon, authenticated;
grant select on campaign.latest_participant_results to service_role;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'campaign.participants'::regclass and tgname = 'participants_set_updated_at'
  ) then
    create trigger participants_set_updated_at before update on campaign.participants
    for each row execute function campaign.set_updated_at();
  end if;
end;
$$;

alter table campaign.participants enable row level security;
alter table campaign.participants force row level security;
alter table campaign.referral_links enable row level security;
alter table campaign.referral_links force row level security;
alter table campaign.referral_events enable row level security;
alter table campaign.referral_events force row level security;
revoke all on campaign.participants, campaign.referral_links, campaign.referral_events from anon, authenticated;
grant all on campaign.participants, campaign.referral_links, campaign.referral_events to service_role;
