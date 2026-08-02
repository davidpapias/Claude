-- 0003 — discovery, decisions, matches, conversations, messages, feedback.

-- --- Discovery ------------------------------------------------------------

create table profile_impressions (
  id bigint generated always as identity primary key,
  viewer_id uuid not null references profiles (id) on delete cascade,
  shown_user_id uuid not null references profiles (id) on delete cascade,
  batch_id uuid,
  created_at timestamptz not null default now()
);

create index impressions_shown_recent_idx on profile_impressions (shown_user_id, created_at desc);
create index impressions_viewer_idx on profile_impressions (viewer_id, created_at desc);

create table profile_decisions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references profiles (id) on delete cascade,
  target_id uuid not null references profiles (id) on delete cascade,
  decision decision_kind not null,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  -- One decision per pair: a double tap or a retry cannot create two rows.
  unique (actor_id, target_id),
  unique (actor_id, idempotency_key),
  constraint decisions_no_self check (actor_id <> target_id)
);

create index decisions_target_interested_idx on profile_decisions (target_id, decision)
  where decision = 'interested';

create table recommendation_batches (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references profiles (id) on delete cascade,
  seed text not null,
  candidate_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index recommendation_batches_viewer_idx on recommendation_batches (viewer_id, created_at desc);

create table recommendation_explanations (
  id bigint generated always as identity primary key,
  batch_id uuid not null references recommendation_batches (id) on delete cascade,
  shown_user_id uuid not null references profiles (id) on delete cascade,
  score numeric(5, 2) not null,
  -- [{ "code": "shared_intention:new_in_city", "text": "…" }]
  explanations jsonb not null default '[]'::jsonb,
  -- [{ "component": "intention", "earned": 14, "max": 20 }] — audit trail for
  -- "why was I shown this", and the data the compare tool renders.
  breakdown jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index recommendation_explanations_batch_idx on recommendation_explanations (batch_id);

-- --- Matches --------------------------------------------------------------
-- A match is stored once per pair, with the ids ordered. The unique constraint
-- makes concurrent mutual likes converge on exactly one row.

create table matches (
  id uuid primary key default gen_random_uuid(),
  user_low uuid not null references profiles (id) on delete cascade,
  user_high uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  ended_by uuid references profiles (id) on delete set null,
  end_reason text,
  constraint matches_ordered check (user_low < user_high),
  unique (user_low, user_high)
);

create index matches_user_low_idx on matches (user_low) where ended_at is null;
create index matches_user_high_idx on matches (user_high) where ended_at is null;

create or replace function is_match_member(p_match_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from matches m
    where m.id = p_match_id and (m.user_low = p_user_id or m.user_high = p_user_id)
  );
$$;

-- --- Conversations --------------------------------------------------------

create table conversations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references matches (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz
);

create table conversation_members (
  conversation_id uuid not null references conversations (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  muted boolean not null default false,
  primary key (conversation_id, user_id)
);

create index conversation_members_user_idx on conversation_members (user_id);

create or replace function is_conversation_member(p_conversation_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from conversation_members cm
    where cm.conversation_id = p_conversation_id and cm.user_id = p_user_id
  );
$$;

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  body text check (body is null or char_length(body) between 1 and 2000),
  photo_path text,
  reply_to_id uuid references messages (id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- No read receipts in the MVP: there is deliberately no `read_at` column.
  constraint messages_have_content check (
    (body is not null and char_length(trim(body)) > 0) or photo_path is not null
  )
);

create index messages_conversation_idx on messages (conversation_id, created_at desc);
create index messages_sender_recent_idx on messages (sender_id, created_at desc);

create table message_reactions (
  message_id uuid not null references messages (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  reaction text not null check (reaction in ('👍', '😄', '🙌', '👀', '🙏')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create or replace function bump_conversation_last_message()
returns trigger
language plpgsql
as $$
begin
  update conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_bump_conversation after insert on messages
  for each row execute function bump_conversation_last_message();

-- --- Post-match feedback ---------------------------------------------------
-- Private: the other person never sees it.

create table match_feedback (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  feedback match_feedback_kind not null,
  created_at timestamptz not null default now(),
  unique (match_id, author_id, feedback)
);

create index match_feedback_match_idx on match_feedback (match_id);

alter table profile_impressions enable row level security;
alter table profile_decisions enable row level security;
alter table recommendation_batches enable row level security;
alter table recommendation_explanations enable row level security;
alter table matches enable row level security;
alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;
alter table message_reactions enable row level security;
alter table match_feedback enable row level security;
