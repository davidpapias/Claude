-- 0002 — profiles, preferences and catalogs.
--
-- Location: `lat` / `lon` are the user's own approximate coordinates and are
-- readable only by the user. Everyone else sees `area_label` and, through the
-- matching RPC, coordinates coarsened to one decimal (~11 km). Exact
-- coordinates are never stored: the client rounds before sending, and the
-- constraint below rejects anything finer than two decimals.

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 40),
  birth_date date not null,
  pronouns text check (pronouns is null or char_length(pronouns) <= 30),
  area_label text not null check (char_length(area_label) between 2 and 80),
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  bio text not null default '' check (char_length(bio) <= 500),
  life_stage text check (life_stage is null or char_length(life_stage) <= 60),
  friendship_expectations text check (
    friendship_expectations is null or char_length(friendship_expectations) <= 300
  ),
  boundaries text[] not null default '{}',
  conversation_topics text[] not null default '{}',
  wants_to_try text[] not null default '{}',
  account_status account_status not null default 'active',
  onboarding_completed_at timestamptz,
  profile_complete boolean not null default false,
  last_active_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 18+ only, enforced by the database and not just by the client.
  constraint profiles_adults_only check (birth_date <= (current_date - interval '18 years')),
  -- Reject coordinates finer than ~1.1 km so a precise fix cannot be stored.
  constraint profiles_location_is_approximate check (
    abs(lat - round(lat::numeric, 2)::double precision) < 1e-9
    and abs(lon - round(lon::numeric, 2)::double precision) < 1e-9
  ),
  constraint profiles_boundaries_len check (array_length(boundaries, 1) is null or array_length(boundaries, 1) <= 8)
);

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

create index profiles_status_idx on profiles (account_status) where deleted_at is null;
create index profiles_location_idx on profiles (lat, lon) where account_status = 'active';
create index profiles_complete_idx on profiles (profile_complete, account_status);

create or replace function profile_age(p_birth_date date)
returns integer
language sql
immutable
as $$
  select extract(year from age(current_date, p_birth_date))::integer;
$$;

-- --- Photos ---------------------------------------------------------------

create table profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  storage_path text not null unique,
  position smallint not null check (position between 0 and 5),
  moderation_status moderation_status not null default 'pending',
  moderation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, position)
);

create trigger profile_photos_updated_at before update on profile_photos
  for each row execute function set_updated_at();

create index profile_photos_user_idx on profile_photos (user_id, position);
create index profile_photos_moderation_idx on profile_photos (moderation_status)
  where moderation_status = 'pending';

-- --- Discovery preferences -------------------------------------------------

create table profile_preferences (
  user_id uuid primary key references profiles (id) on delete cascade,
  max_distance_km integer not null default 25 check (max_distance_km between 1 and 200),
  min_age integer not null default 18 check (min_age >= 18),
  max_age integer not null default 99 check (max_age <= 120),
  notification_new_match boolean not null default true,
  notification_new_message boolean not null default true,
  notification_conversation_reminder boolean not null default true,
  notification_account_updates boolean not null default true,
  hide_from_discovery boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint preferences_age_range check (max_age >= min_age)
);

create trigger profile_preferences_updated_at before update on profile_preferences
  for each row execute function set_updated_at();

-- --- Social preferences ----------------------------------------------------

create table social_preferences (
  user_id uuid primary key references profiles (id) on delete cascade,
  social_energy social_energy not null default 'mixed',
  warm_up_speed warm_up_speed not null default 'in_between',
  group_preference group_preference not null default 'small_group',
  contact_frequency contact_frequency not null default 'few_times_week',
  communication_styles communication_style[] not null default '{short_messages}',
  spontaneity spontaneity not null default 'flexible',
  plan_preference plan_preference not null default 'mixed',
  alcohol_preference alcohol_preference not null default 'no_preference',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_styles_not_empty check (array_length(communication_styles, 1) between 1 and 4)
);

create trigger social_preferences_updated_at before update on social_preferences
  for each row execute function set_updated_at();

-- --- Catalogs and joins ----------------------------------------------------

create table friendship_intentions (
  code friendship_intention primary key,
  label text not null,
  description text not null
);

create table user_friendship_intentions (
  user_id uuid not null references profiles (id) on delete cascade,
  intention friendship_intention not null references friendship_intentions (code),
  created_at timestamptz not null default now(),
  primary key (user_id, intention)
);

create table interests (
  slug text primary key,
  label text not null,
  category text not null
);

create table user_interests (
  user_id uuid not null references profiles (id) on delete cascade,
  interest_slug text not null references interests (slug),
  created_at timestamptz not null default now(),
  primary key (user_id, interest_slug)
);

create index user_interests_slug_idx on user_interests (interest_slug);

create table languages (
  code text primary key check (char_length(code) between 2 and 10),
  label text not null
);

create table user_languages (
  user_id uuid not null references profiles (id) on delete cascade,
  language_code text not null references languages (code),
  primary key (user_id, language_code)
);

create table availability_slots (
  user_id uuid not null references profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  block day_block not null,
  primary key (user_id, weekday, block)
);

create table onboarding_progress (
  user_id uuid primary key references profiles (id) on delete cascade,
  step text not null default 'identity',
  completed_steps text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create trigger onboarding_progress_updated_at before update on onboarding_progress
  for each row execute function set_updated_at();

-- --- Profile completeness --------------------------------------------------
-- A profile is discoverable only when it has enough substance for a good
-- recommendation and at least one approved photo.

create or replace function recompute_profile_complete(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_complete boolean;
begin
  select
    p.bio <> ''
    and exists (select 1 from profile_photos ph where ph.user_id = p.id and ph.moderation_status = 'approved')
    and exists (select 1 from user_friendship_intentions ui where ui.user_id = p.id)
    and (select count(*) from user_interests uix where uix.user_id = p.id) >= 3
    and exists (select 1 from availability_slots a where a.user_id = p.id)
    and exists (select 1 from user_languages ul where ul.user_id = p.id)
    and exists (select 1 from social_preferences sp where sp.user_id = p.id)
  into v_complete
  from profiles p
  where p.id = p_user_id;

  perform set_config('circulo.system_write', 'on', true);
  update profiles set profile_complete = coalesce(v_complete, false) where id = p_user_id;
  perform set_config('circulo.system_write', 'off', true);
end;
$$;

create or replace function touch_profile_complete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform recompute_profile_complete(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

create trigger photos_completeness after insert or update or delete on profile_photos
  for each row execute function touch_profile_complete();
create trigger interests_completeness after insert or delete on user_interests
  for each row execute function touch_profile_complete();
create trigger intentions_completeness after insert or delete on user_friendship_intentions
  for each row execute function touch_profile_complete();
create trigger availability_completeness after insert or delete on availability_slots
  for each row execute function touch_profile_complete();
create trigger languages_completeness after insert or delete on user_languages
  for each row execute function touch_profile_complete();
create trigger social_completeness after insert or update on social_preferences
  for each row execute function touch_profile_complete();

alter table profiles enable row level security;
alter table profile_photos enable row level security;
alter table profile_preferences enable row level security;
alter table social_preferences enable row level security;
alter table friendship_intentions enable row level security;
alter table user_friendship_intentions enable row level security;
alter table interests enable row level security;
alter table user_interests enable row level security;
alter table languages enable row level security;
alter table user_languages enable row level security;
alter table availability_slots enable row level security;
alter table onboarding_progress enable row level security;
