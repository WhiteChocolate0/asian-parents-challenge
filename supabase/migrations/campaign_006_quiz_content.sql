-- Versioned quiz content and scoring configuration.  The frontend renders this
-- data; it must not embed scoring rules in page components.
create table if not exists campaign.quiz_questions (
  id text primary key,
  stage_no smallint not null check (stage_no between 1 and 3),
  stage_title text not null,
  order_no smallint not null unique check (order_no between 1 and 15),
  display_text text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists campaign.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id text not null references campaign.quiz_questions(id) on delete cascade,
  option_key text not null check (option_key in ('A', 'B', 'C')),
  display_text text not null,
  money_score smallint not null default 0,
  safety_score smallint not null default 0,
  face_score smallint not null default 0,
  tradition_score smallint not null default 0,
  unique (question_id, option_key)
);

drop trigger if exists quiz_questions_set_updated_at on campaign.quiz_questions;
create trigger quiz_questions_set_updated_at
before update on campaign.quiz_questions
for each row execute function campaign.set_updated_at();

alter table campaign.quiz_questions enable row level security;
alter table campaign.quiz_questions force row level security;
alter table campaign.quiz_options enable row level security;
alter table campaign.quiz_options force row level security;
revoke all on campaign.quiz_questions, campaign.quiz_options from anon, authenticated;
grant all on campaign.quiz_questions, campaign.quiz_options to service_role;
