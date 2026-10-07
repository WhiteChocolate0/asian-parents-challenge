create table if not exists campaign.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  quiz_session_id uuid not null references campaign.quiz_sessions(id) on delete cascade,
  question_id text not null,
  selected_option text not null check (selected_option in ('A', 'B')),
  -- Auditing only: final scoring must still be recomputed from the published game version.
  score_delta numeric(8, 2) not null default 0,
  dimension_delta_json jsonb not null default '{}'::jsonb,
  answered_at timestamptz not null default now(),
  unique (quiz_session_id, question_id),
  check (jsonb_typeof(dimension_delta_json) = 'object')
);

create index if not exists quiz_answers_session_answered_at_idx
  on campaign.quiz_answers (quiz_session_id, answered_at);

alter table campaign.quiz_answers enable row level security;
alter table campaign.quiz_answers force row level security;
revoke all on campaign.quiz_answers from anon, authenticated;
grant all on campaign.quiz_answers to service_role;
