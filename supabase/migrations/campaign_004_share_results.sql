create table if not exists campaign.share_results (
  id uuid primary key default gen_random_uuid(),
  quiz_result_id uuid not null references campaign.quiz_results(id) on delete cascade,
  -- Only a SHA-256 hash is retained; the raw token is returned once by the API.
  share_token_hash text not null unique check (share_token_hash ~ '^[0-9a-f]{64}$'),
  share_format text not null default 'ig_story' check (share_format in ('ig_story', 'link', 'image')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  check (expires_at > created_at)
);

create index if not exists share_results_token_expiry_idx
  on campaign.share_results (share_token_hash, expires_at);

alter table campaign.share_results enable row level security;
alter table campaign.share_results force row level security;
revoke all on campaign.share_results from anon, authenticated;
grant all on campaign.share_results to service_role;
