create table if not exists campaign.quiz_results (
  id uuid primary key default gen_random_uuid(),
  quiz_session_id uuid not null unique references campaign.quiz_sessions(id) on delete cascade,
  defense_value smallint not null check (defense_value between 1 and 5),
  persona_key text not null,
  ability_scores_json jsonb not null,
  result_summary jsonb not null,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(ability_scores_json) = 'object'),
  check (jsonb_typeof(result_summary) = 'object')
);

create index if not exists quiz_results_persona_key_idx
  on campaign.quiz_results (persona_key);

alter table campaign.quiz_results enable row level security;
alter table campaign.quiz_results force row level security;
revoke all on campaign.quiz_results from anon, authenticated;
grant all on campaign.quiz_results to service_role;
