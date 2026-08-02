-- 0001 — extensions, enums, helpers, audit log.
-- Everything in this schema is deny-by-default: RLS is enabled on every table and
-- access is granted only by an explicit policy.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- --- Enums ----------------------------------------------------------------

create type friendship_intention as enum (
  'close_friendship', 'casual_meetups', 'activity_partner', 'expand_circle',
  'new_in_city', 'language_practice', 'similar_life_stage'
);

create type social_energy as enum ('calm', 'mixed', 'active');
create type warm_up_speed as enum ('needs_time', 'in_between', 'opens_quickly');
create type group_preference as enum ('one_on_one', 'small_group', 'flexible', 'many_people');
create type contact_frequency as enum ('daily', 'few_times_week', 'weekly', 'occasional');
create type communication_style as enum ('long_messages', 'short_messages', 'voice_notes', 'meet_soon');
create type spontaneity as enum ('plans_ahead', 'flexible', 'spontaneous');
create type plan_preference as enum ('calm', 'mixed', 'active');
create type alcohol_preference as enum ('no_preference', 'prefers_alcohol_free', 'fine_with_alcohol');
create type day_block as enum ('morning', 'afternoon', 'evening');
create type account_status as enum ('active', 'suspended', 'banned', 'deleted');
create type decision_kind as enum ('pass', 'interested');
create type moderation_status as enum ('pending', 'approved', 'rejected');
create type report_category as enum (
  'harassment', 'unsolicited_sexual_content', 'persistent_romantic_intent', 'hate_speech',
  'threats', 'impersonation', 'fake_profile', 'spam', 'money_request', 'unsafe_behavior',
  'minor', 'other'
);
create type report_status as enum ('open', 'under_review', 'actioned', 'dismissed');
create type match_feedback_kind as enum (
  'we_talked', 'planning_to_meet', 'we_met', 'want_to_keep_in_touch',
  'not_compatible', 'inappropriate_behavior'
);
create type moderation_action_kind as enum (
  'warning', 'photo_removed', 'profile_hidden', 'suspended', 'banned', 'reinstated', 'dismissed'
);
create type staff_role as enum ('moderator', 'admin');

-- --- Timestamps -----------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --- Staff ----------------------------------------------------------------
-- Staff membership lives in its own table so a normal user can never grant
-- themselves a role by editing their profile.

create table staff_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role staff_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger staff_members_updated_at before update on staff_members
  for each row execute function set_updated_at();

-- SECURITY DEFINER so policies can consult staff membership without granting
-- users read access to the table itself.
create or replace function is_staff(min_role staff_role default 'moderator')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff_members s
    where s.user_id = auth.uid()
      and (min_role = 'moderator' or s.role = 'admin')
  );
$$;

-- --- Audit log ------------------------------------------------------------
-- Append-only. No policy grants update or delete to anyone, including staff.

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  -- Metadata must never contain message bodies, photos or exact coordinates.
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on audit_logs (created_at desc);
create index audit_logs_entity_idx on audit_logs (entity_type, entity_id);

create or replace function write_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
$$;

alter table staff_members enable row level security;
alter table audit_logs enable row level security;
