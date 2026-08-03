-- 0005 — RPCs. Every write path a client can reach goes through one of these
-- functions so authorization, rate limiting and idempotency live on the server.

-- --- Profile bootstrap ----------------------------------------------------

create or replace function upsert_profile_identity(
  p_display_name text,
  p_birth_date date,
  p_area_label text,
  p_lat double precision,
  p_lon double precision,
  p_pronouns text default null,
  p_life_stage text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- Coarsen before storing: the server never keeps a precise fix.
  insert into profiles (id, display_name, birth_date, area_label, lat, lon, pronouns, life_stage)
  values (
    v_user, trim(p_display_name), p_birth_date, trim(p_area_label),
    round(p_lat::numeric, 2)::double precision, round(p_lon::numeric, 2)::double precision,
    nullif(trim(coalesce(p_pronouns, '')), ''), nullif(trim(coalesce(p_life_stage, '')), '')
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    birth_date = excluded.birth_date,
    area_label = excluded.area_label,
    lat = excluded.lat,
    lon = excluded.lon,
    pronouns = excluded.pronouns,
    life_stage = excluded.life_stage;

  insert into profile_preferences (user_id) values (v_user) on conflict do nothing;
  insert into social_preferences (user_id) values (v_user) on conflict do nothing;
  insert into onboarding_progress (user_id) values (v_user) on conflict do nothing;

  return v_user;
end;
$$;

-- --- Public profile -------------------------------------------------------
-- The only way another user's profile can be read. Exact coordinates are never
-- part of the payload; a blocked pair sees nothing at all.

create or replace function get_public_profile(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_viewer uuid := auth.uid();
  v_result jsonb;
begin
  if v_viewer is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if v_viewer <> p_user_id and is_blocked_pair(v_viewer, p_user_id) then
    return null;
  end if;

  select jsonb_build_object(
    'userId', p.id,
    'displayName', p.display_name,
    'age', profile_age(p.birth_date),
    'areaLabel', p.area_label,
    'pronouns', p.pronouns,
    'bio', p.bio,
    'lifeStage', p.life_stage,
    'boundaries', to_jsonb(p.boundaries),
    'conversationTopics', to_jsonb(p.conversation_topics),
    'wantsToTry', to_jsonb(p.wants_to_try),
    'intentions', coalesce((
      select jsonb_agg(ui.intention order by ui.intention)
      from user_friendship_intentions ui where ui.user_id = p.id
    ), '[]'::jsonb),
    'interests', coalesce((
      select jsonb_agg(uix.interest_slug order by uix.interest_slug)
      from user_interests uix where uix.user_id = p.id
    ), '[]'::jsonb),
    'languages', coalesce((
      select jsonb_agg(ul.language_code order by ul.language_code)
      from user_languages ul where ul.user_id = p.id
    ), '[]'::jsonb),
    'availability', coalesce((
      select jsonb_agg(jsonb_build_object('weekday', a.weekday, 'block', a.block)
                       order by a.weekday, a.block)
      from availability_slots a where a.user_id = p.id
    ), '[]'::jsonb),
    'social', coalesce((
      select jsonb_build_object(
        'socialEnergy', sp.social_energy,
        'warmUpSpeed', sp.warm_up_speed,
        'groupPreference', sp.group_preference,
        'contactFrequency', sp.contact_frequency,
        'communicationStyles', to_jsonb(sp.communication_styles),
        'spontaneity', sp.spontaneity,
        'planPreference', sp.plan_preference,
        'alcoholPreference', sp.alcohol_preference)
      from social_preferences sp where sp.user_id = p.id
    ), '{}'::jsonb),
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object('id', ph.id, 'storagePath', ph.storage_path,
                                          'position', ph.position, 'moderationStatus', ph.moderation_status)
                       order by ph.position)
      from profile_photos ph
      where ph.user_id = p.id and (ph.moderation_status = 'approved' or p.id = v_viewer)
    ), '[]'::jsonb)
  )
  into v_result
  from profiles p
  where p.id = p_user_id
    and p.deleted_at is null
    and (p.account_status = 'active' or p.id = v_viewer);

  return v_result;
end;
$$;

-- --- Discovery ------------------------------------------------------------
-- Hard filters run here, where they cannot be bypassed by a client. Ranking,
-- scoring and explanations run in @circulo/matching over this output; see
-- docs/decisions/0003-ranking-runs-in-the-client-for-the-mvp.md.

create or replace function discovery_candidates(p_limit integer default 60)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_viewer uuid := auth.uid();
  v_result jsonb;
begin
  if v_viewer is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select coalesce(jsonb_agg(candidate), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'userId', c.id,
      'age', profile_age(c.birth_date),
      -- One decimal ≈ 11 km. The client never receives anything finer.
      'location', jsonb_build_object(
        'areaLabel', c.area_label,
        'lat', round(c.lat::numeric, 1),
        'lon', round(c.lon::numeric, 1)),
      'languages', coalesce((select jsonb_agg(ul.language_code) from user_languages ul where ul.user_id = c.id), '[]'::jsonb),
      'intentions', coalesce((select jsonb_agg(ui.intention) from user_friendship_intentions ui where ui.user_id = c.id), '[]'::jsonb),
      'interests', coalesce((select jsonb_agg(uix.interest_slug) from user_interests uix where uix.user_id = c.id), '[]'::jsonb),
      'availability', coalesce((
        select jsonb_agg(jsonb_build_object('weekday', a.weekday, 'block', a.block))
        from availability_slots a where a.user_id = c.id), '[]'::jsonb),
      'social', (
        select jsonb_build_object(
          'socialEnergy', sp.social_energy, 'warmUpSpeed', sp.warm_up_speed,
          'groupPreference', sp.group_preference, 'contactFrequency', sp.contact_frequency,
          'communicationStyles', to_jsonb(sp.communication_styles), 'spontaneity', sp.spontaneity,
          'planPreference', sp.plan_preference, 'alcoholPreference', sp.alcohol_preference)
        from social_preferences sp where sp.user_id = c.id),
      'discovery', jsonb_build_object(
        'maxDistanceKm', cp.max_distance_km, 'minAge', cp.min_age, 'maxAge', cp.max_age),
      'createdAt', c.created_at,
      'profileComplete', c.profile_complete,
      'accountStatus', c.account_status,
      'recentImpressions', (
        select count(*) from profile_impressions pi
        where pi.shown_user_id = c.id and pi.created_at > now() - interval '7 days'),
      'spamFlagged', exists (
        select 1 from account_flags af
        where af.user_id = c.id and af.flag = 'spam' and af.cleared_at is null)
    ) as candidate
    from profiles c
    join profile_preferences cp on cp.user_id = c.id
    join profile_preferences vp on vp.user_id = v_viewer
    join profiles v on v.id = v_viewer
    where c.id <> v_viewer
      and c.account_status = 'active'
      and c.deleted_at is null
      and c.profile_complete
      and not cp.hide_from_discovery
      -- Blocks, in either direction.
      and not is_blocked_pair(v_viewer, c.id)
      -- Already decided (a pass expires after the cooldown).
      and not exists (
        select 1 from profile_decisions d
        where d.actor_id = v_viewer and d.target_id = c.id
          and (d.decision = 'interested' or d.created_at > now() - interval '30 days'))
      -- Already matched.
      and not exists (
        select 1 from matches m
        where m.ended_at is null
          and ((m.user_low = least(v_viewer, c.id) and m.user_high = greatest(v_viewer, c.id))))
      -- Age preferences, both directions.
      and profile_age(c.birth_date) between vp.min_age and vp.max_age
      and profile_age(v.birth_date) between cp.min_age and cp.max_age
    order by c.last_active_at desc
    limit greatest(1, least(p_limit, 200))
  ) candidates;

  return v_result;
end;
$$;

create or replace function save_recommendation_batch(p_seed text, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viewer uuid := auth.uid();
  v_batch uuid;
begin
  if v_viewer is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  insert into recommendation_batches (viewer_id, seed, candidate_count)
  values (v_viewer, p_seed, coalesce(jsonb_array_length(p_items), 0))
  returning id into v_batch;

  insert into recommendation_explanations (batch_id, shown_user_id, score, explanations, breakdown)
  select v_batch, (item ->> 'userId')::uuid, (item ->> 'score')::numeric,
         coalesce(item -> 'explanations', '[]'::jsonb), coalesce(item -> 'breakdown', '[]'::jsonb)
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) item;

  insert into profile_impressions (viewer_id, shown_user_id, batch_id)
  select v_viewer, (item ->> 'userId')::uuid, v_batch
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) item;

  return v_batch;
end;
$$;

-- --- Decisions and matches ------------------------------------------------

create or replace function record_decision(
  p_target_id uuid,
  p_decision decision_kind,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_low uuid;
  v_high uuid;
  v_match uuid;
  v_conversation uuid;
  v_mutual boolean := false;
  v_existing profile_decisions%rowtype;
begin
  if v_actor is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if v_actor = p_target_id then
    raise exception 'cannot decide on your own profile' using errcode = '22023';
  end if;
  if is_blocked_pair(v_actor, p_target_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not consume_rate_limit('decision', 30, interval '1 minute') then
    raise exception 'rate limit exceeded' using errcode = '53400';
  end if;

  -- Idempotent: replaying the same key returns the original outcome.
  select * into v_existing from profile_decisions
  where actor_id = v_actor and (idempotency_key = p_idempotency_key or target_id = p_target_id);

  if found then
    select m.id into v_match from matches m
    where m.user_low = least(v_actor, p_target_id) and m.user_high = greatest(v_actor, p_target_id)
      and m.ended_at is null;
    select c.id into v_conversation from conversations c where c.match_id = v_match;
    return jsonb_build_object('matched', v_match is not null, 'matchId', v_match,
                              'conversationId', v_conversation, 'idempotentReplay', true);
  end if;

  insert into profile_decisions (actor_id, target_id, decision, idempotency_key)
  values (v_actor, p_target_id, p_decision, p_idempotency_key);

  if p_decision = 'interested' then
    select exists (
      select 1 from profile_decisions d
      where d.actor_id = p_target_id and d.target_id = v_actor and d.decision = 'interested'
    ) into v_mutual;
  end if;

  if v_mutual then
    v_low := least(v_actor, p_target_id);
    v_high := greatest(v_actor, p_target_id);

    -- Concurrent mutual likes both reach here; the unique constraint makes them
    -- converge on exactly one match row.
    insert into matches (user_low, user_high) values (v_low, v_high)
    on conflict (user_low, user_high) do update set ended_at = null, ended_by = null, end_reason = null
    returning id into v_match;

    insert into conversations (match_id) values (v_match)
    on conflict (match_id) do nothing;

    select id into v_conversation from conversations where match_id = v_match;

    insert into conversation_members (conversation_id, user_id)
    values (v_conversation, v_low), (v_conversation, v_high)
    on conflict do nothing;

    insert into notifications (user_id, kind, payload)
    select unnest(array[v_low, v_high]), 'new_match', jsonb_build_object('matchId', v_match);
  end if;

  return jsonb_build_object('matched', v_mutual, 'matchId', v_match,
                            'conversationId', v_conversation, 'idempotentReplay', false);
end;
$$;

create or replace function end_match(p_match_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if not is_match_member(p_match_id, v_user) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  update matches
  set ended_at = now(), ended_by = v_user, end_reason = left(coalesce(p_reason, ''), 200)
  where id = p_match_id and ended_at is null;

  perform write_audit_log('match_ended', 'match', p_match_id, jsonb_build_object('reason', p_reason));
end;
$$;

-- --- Messaging ------------------------------------------------------------

create or replace function send_message(
  p_conversation_id uuid,
  p_body text,
  p_reply_to_id uuid default null,
  p_photo_path text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid := auth.uid();
  v_match matches%rowtype;
  v_other uuid;
  v_message uuid;
begin
  if v_sender is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not is_conversation_member(p_conversation_id, v_sender) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not consume_rate_limit('message', 20, interval '1 minute') then
    raise exception 'rate limit exceeded' using errcode = '53400';
  end if;

  select m.* into v_match from matches m
  join conversations c on c.match_id = m.id
  where c.id = p_conversation_id;

  -- A message can only exist inside a live match between two unblocked users.
  if v_match.ended_at is not null then
    raise exception 'match no longer active' using errcode = '42501';
  end if;

  v_other := case when v_match.user_low = v_sender then v_match.user_high else v_match.user_low end;
  if is_blocked_pair(v_sender, v_other) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  insert into messages (conversation_id, sender_id, body, reply_to_id, photo_path)
  values (p_conversation_id, v_sender, nullif(trim(coalesce(p_body, '')), ''), p_reply_to_id, p_photo_path)
  returning id into v_message;

  insert into notifications (user_id, kind, payload)
  values (v_other, 'new_message', jsonb_build_object('conversationId', p_conversation_id));

  return jsonb_build_object('messageId', v_message);
end;
$$;

-- --- Safety ---------------------------------------------------------------

create or replace function block_user(p_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null or v_user = p_target_id then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  insert into blocks (blocker_id, blocked_id) values (v_user, p_target_id)
  on conflict do nothing;

  -- Blocking ends any live match immediately: no further interaction is possible.
  update matches set ended_at = now(), ended_by = v_user, end_reason = 'blocked'
  where ended_at is null
    and user_low = least(v_user, p_target_id) and user_high = greatest(v_user, p_target_id);

  perform write_audit_log('user_blocked', 'user', p_target_id, '{}'::jsonb);
end;
$$;

create or replace function unblock_user(p_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from blocks where blocker_id = auth.uid() and blocked_id = p_target_id;
  perform write_audit_log('user_unblocked', 'user', p_target_id, '{}'::jsonb);
end;
$$;

create or replace function report_user(
  p_reported_user_id uuid,
  p_category report_category,
  p_details text default null,
  p_conversation_id uuid default null,
  p_message_ids uuid[] default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_report uuid;
  v_open_reports integer;
begin
  if v_user is null or v_user = p_reported_user_id then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not consume_rate_limit('report', 20, interval '1 day') then
    raise exception 'rate limit exceeded' using errcode = '53400';
  end if;

  insert into reports (reporter_id, reported_user_id, category, details, conversation_id)
  values (v_user, p_reported_user_id, p_category, left(coalesce(p_details, ''), 1000), p_conversation_id)
  returning id into v_report;

  if p_message_ids is not null then
    insert into report_evidence (report_id, message_id)
    select v_report, unnest(p_message_ids);
  end if;

  -- Severe categories, or repeated reports, hide the profile while it is reviewed.
  select count(*) into v_open_reports from reports
  where reported_user_id = p_reported_user_id and status in ('open', 'under_review');

  if p_category in ('minor', 'threats', 'unsolicited_sexual_content') or v_open_reports >= 3 then
    insert into account_flags (user_id, flag, reason)
    values (p_reported_user_id, 'hidden_pending_review', 'automatic: report threshold')
    on conflict (user_id, flag) do nothing;

    update profile_preferences set hide_from_discovery = true where user_id = p_reported_user_id;
  end if;

  perform write_audit_log('report_created', 'report', v_report,
                          jsonb_build_object('category', p_category));
  return v_report;
end;
$$;

create or replace function submit_match_feedback(p_match_id uuid, p_feedback match_feedback_kind)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_match_member(p_match_id, auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  insert into match_feedback (match_id, author_id, feedback)
  values (p_match_id, auth.uid(), p_feedback)
  on conflict do nothing;
end;
$$;

-- --- Account --------------------------------------------------------------

create or replace function export_my_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  return jsonb_build_object(
    'profile', (select to_jsonb(p) - 'lat' - 'lon' from profiles p where p.id = v_user),
    'preferences', (select to_jsonb(pp) from profile_preferences pp where pp.user_id = v_user),
    'social', (select to_jsonb(sp) from social_preferences sp where sp.user_id = v_user),
    'interests', (select coalesce(jsonb_agg(ui.interest_slug), '[]'::jsonb) from user_interests ui where ui.user_id = v_user),
    'availability', (select coalesce(jsonb_agg(jsonb_build_object('weekday', a.weekday, 'block', a.block)), '[]'::jsonb)
                     from availability_slots a where a.user_id = v_user),
    'matches', (select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'createdAt', m.created_at)), '[]'::jsonb)
                from matches m where m.user_low = v_user or m.user_high = v_user),
    'messages', (select coalesce(jsonb_agg(jsonb_build_object('conversationId', ms.conversation_id,
                                                              'body', ms.body, 'createdAt', ms.created_at)), '[]'::jsonb)
                 from messages ms where ms.sender_id = v_user)
  );
end;
$$;

create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- Content the other person needs for an open report is kept, but nothing
  -- identifying remains and the account can never be discovered again.
  update matches set ended_at = coalesce(ended_at, now()), end_reason = coalesce(end_reason, 'account_deleted')
  where (user_low = v_user or user_high = v_user) and ended_at is null;

  delete from profile_photos where user_id = v_user;
  delete from push_tokens where user_id = v_user;
  delete from user_interests where user_id = v_user;
  delete from availability_slots where user_id = v_user;

  perform set_config('circulo.system_write', 'on', true);

  update profiles
  set display_name = 'Cuenta eliminada',
      bio = '',
      pronouns = null,
      life_stage = null,
      area_label = 'n/d',
      boundaries = '{}',
      conversation_topics = '{}',
      wants_to_try = '{}',
      account_status = 'deleted',
      profile_complete = false,
      deleted_at = now()
  where id = v_user;

  perform set_config('circulo.system_write', 'off', true);

  update profile_preferences set hide_from_discovery = true where user_id = v_user;

  perform write_audit_log('account_deleted', 'user', v_user, '{}'::jsonb);
end;
$$;

-- --- Moderation (staff only) ----------------------------------------------

create or replace function moderate_set_account_status(
  p_user_id uuid,
  p_status account_status,
  p_report_id uuid default null,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_staff('moderator') then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  perform set_config('circulo.system_write', 'on', true);
  update profiles set account_status = p_status where id = p_user_id;
  perform set_config('circulo.system_write', 'off', true);

  insert into moderation_actions (report_id, target_user_id, moderator_id, action, note)
  values (
    p_report_id, p_user_id, auth.uid(),
    (case p_status when 'suspended' then 'suspended' when 'banned' then 'banned' else 'reinstated' end)::moderation_action_kind,
    p_note
  );

  perform write_audit_log('account_status_changed', 'user', p_user_id,
                          jsonb_build_object('status', p_status, 'reportId', p_report_id));
end;
$$;

create or replace function moderate_resolve_report(
  p_report_id uuid,
  p_status report_status,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target uuid;
begin
  if not is_staff('moderator') then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  update reports set status = p_status where id = p_report_id
  returning reported_user_id into v_target;

  insert into moderation_actions (report_id, target_user_id, moderator_id, action, note)
  values (p_report_id, v_target, auth.uid(),
          (case p_status when 'dismissed' then 'dismissed' else 'warning' end)::moderation_action_kind, p_note);

  -- Clear the automatic hide when no open report remains.
  if not exists (
    select 1 from reports r
    where r.reported_user_id = v_target and r.status in ('open', 'under_review')
  ) then
    update account_flags set cleared_at = now()
    where user_id = v_target and flag = 'hidden_pending_review' and cleared_at is null;
    update profile_preferences set hide_from_discovery = false where user_id = v_target;
  end if;

  perform write_audit_log('report_resolved', 'report', p_report_id,
                          jsonb_build_object('status', p_status));
end;
$$;

create or replace function moderate_review_photo(
  p_photo_id uuid,
  p_status moderation_status,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  if not is_staff('moderator') then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  update profile_photos set moderation_status = p_status, moderation_note = p_note
  where id = p_photo_id
  returning user_id into v_owner;

  if p_status = 'rejected' then
    insert into moderation_actions (target_user_id, moderator_id, action, note)
    values (v_owner, auth.uid(), 'photo_removed', p_note);
  end if;

  perform write_audit_log('photo_reviewed', 'photo', p_photo_id,
                          jsonb_build_object('status', p_status));
end;
$$;
