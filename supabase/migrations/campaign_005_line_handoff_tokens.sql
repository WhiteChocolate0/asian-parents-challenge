create table if not exists campaign.link_tokens (
  id uuid primary key default gen_random_uuid(),
  quiz_result_id uuid not null references campaign.quiz_results(id) on delete cascade,
  -- Token is one-time, short-lived, and stored only as a hash.
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'active' check (status in ('active', 'consumed', 'expired', 'revoked')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  check (expires_at > created_at),
  check ((status = 'consumed') = (consumed_at is not null))
);

create index if not exists link_tokens_active_expiry_idx
  on campaign.link_tokens (status, expires_at);

alter table campaign.link_tokens enable row level security;
alter table campaign.link_tokens force row level security;
revoke all on campaign.link_tokens from anon, authenticated;
grant all on campaign.link_tokens to service_role;

-- The LINE Bot owns its own transactional consume implementation (or a narrowly
-- scoped SECURITY DEFINER RPC managed by the Bot team).  This website migration
-- deliberately creates no policy or grant for linebot tables.
