-- 0004 — blocks, reports, moderation, flags, verification, operations.

create table blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  constraint blocks_no_self check (blocker_id <> blocked_id)
);

create index blocks_blocked_idx on blocks (blocked_id);

-- Symmetric visibility check used by every discovery and messaging path.
create or replace function is_blocked_pair(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from blocks b
    where (b.blocker_id = p_a and b.blocked_id = p_b)
       or (b.blocker_id = p_b and b.blocked_id = p_a)
  );
$$;

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles (id) on delete set null,
  reported_user_id uuid not null references profiles (id) on delete cascade,
  category report_category not null,
  details text check (details is null or char_length(details) <= 1000),
  conversation_id uuid references conversations (id) on delete set null,
  status report_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_no_self check (reporter_id is null or reporter_id <> reported_user_id)
);

create trigger reports_updated_at before update on reports
  for each row execute function set_updated_at();

create index reports_status_idx on reports (status, created_at desc);
create index reports_reported_user_idx on reports (reported_user_id, created_at desc);

-- Message ids only. Moderators read the evidence through a controlled view;
-- the report row itself never copies private message bodies.
create table report_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports (id) on delete cascade,
  message_id uuid references messages (id) on delete set null,
  photo_path text,
  created_at timestamptz not null default now()
);

create table moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports (id) on delete set null,
  target_user_id uuid not null references profiles (id) on delete cascade,
  moderator_id uuid not null references auth.users (id) on delete restrict,
  action moderation_action_kind not null,
  note text check (note is null or char_length(note) <= 1000),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index moderation_actions_target_idx on moderation_actions (target_user_id, created_at desc);

create table account_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  flag text not null,
  reason text,
  created_at timestamptz not null default now(),
  cleared_at timestamptz,
  unique (user_id, flag)
);

create index account_flags_active_idx on account_flags (user_id) where cleared_at is null;

create table user_verifications (
  user_id uuid primary key references profiles (id) on delete cascade,
  method text not null check (method in ('selfie', 'document')),
  status moderation_status not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- --- Operations -----------------------------------------------------------

create table devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  app_version text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table push_tokens (
  token text primary key,
  user_id uuid not null references profiles (id) on delete cascade,
  device_id uuid references devices (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index push_tokens_user_idx on push_tokens (user_id);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  kind text not null check (kind in ('new_match', 'new_message', 'conversation_reminder', 'security', 'account')),
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, created_at desc);

create table feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);

create trigger feature_flags_updated_at before update on feature_flags
  for each row execute function set_updated_at();

-- Product analytics. Never stores message bodies, photos or coordinates:
-- the check below rejects the field names outright.
create table analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid references profiles (id) on delete set null,
  name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint analytics_no_private_content check (
    not (properties ?| array['body', 'message', 'message_body', 'photo', 'photo_path', 'lat', 'lon', 'email'])
  )
);

create index analytics_events_name_idx on analytics_events (name, created_at desc);

-- --- Rate limiting --------------------------------------------------------
-- Counter buckets, written by the RPCs below. Cheap, and enough to stop the
-- automation patterns the MVP needs to survive.

create table rate_limit_buckets (
  user_id uuid not null references profiles (id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (user_id, action, window_start)
);

create or replace function consume_rate_limit(
  p_action text,
  p_limit integer,
  p_window interval
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz := date_trunc('minute', now())
    - make_interval(secs => (extract(epoch from date_trunc('minute', now()))::bigint % greatest(1, extract(epoch from p_window)::bigint)));
  v_count integer;
begin
  if auth.uid() is null then
    return false;
  end if;

  insert into rate_limit_buckets (user_id, action, window_start, count)
  values (auth.uid(), p_action, v_window_start, 1)
  on conflict (user_id, action, window_start)
    do update set count = rate_limit_buckets.count + 1
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

alter table blocks enable row level security;
alter table reports enable row level security;
alter table report_evidence enable row level security;
alter table moderation_actions enable row level security;
alter table account_flags enable row level security;
alter table user_verifications enable row level security;
alter table devices enable row level security;
alter table push_tokens enable row level security;
alter table notifications enable row level security;
alter table feature_flags enable row level security;
alter table analytics_events enable row level security;
alter table rate_limit_buckets enable row level security;
