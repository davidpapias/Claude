-- Security and behavior tests for the schema.
--
--   pnpm db:test
--
-- Everything here runs as a normal `authenticated` user with a JWT subject, so
-- the assertions exercise the same policies the mobile app hits. A failing
-- assertion aborts the script with a non-zero exit code.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages = notice;

\set ana   '''11111111-1111-4111-8111-111111111111'''
\set beto  '''22222222-2222-4222-8222-222222222222'''
\set caro  '''33333333-3333-4333-8333-333333333333'''
\set mod   '''44444444-4444-4444-8444-444444444444'''

-- --- Fixtures (service role) ---------------------------------------------

insert into auth.users (id, email) values
  (:ana::uuid, 'ana@example.com'),
  (:beto::uuid, 'beto@example.com'),
  (:caro::uuid, 'caro@example.com'),
  (:mod::uuid, 'mod@example.com')
on conflict do nothing;

insert into staff_members (user_id, role) values (:mod::uuid, 'admin') on conflict do nothing;

create or replace function test_complete_profile(
  p_user uuid,
  p_name text,
  p_birth date,
  p_area text,
  p_lat double precision,
  p_lon double precision,
  p_interests text[],
  p_intentions friendship_intention[],
  p_languages text[]
)
returns void
language plpgsql
as $$
begin
  perform login_as(p_user);
  perform upsert_profile_identity(p_name, p_birth, p_area, p_lat, p_lon);

  update profiles set bio = 'Me mudé hace poco y quiero conocer gente con planes tranquilos.'
  where id = p_user;

  insert into user_interests (user_id, interest_slug)
  select p_user, unnest(p_interests) on conflict do nothing;

  insert into user_friendship_intentions (user_id, intention)
  select p_user, unnest(p_intentions) on conflict do nothing;

  insert into user_languages (user_id, language_code)
  select p_user, unnest(p_languages) on conflict do nothing;

  insert into availability_slots (user_id, weekday, block) values
    (p_user, 6, 'afternoon'), (p_user, 0, 'morning'), (p_user, 3, 'evening')
  on conflict do nothing;

  insert into profile_photos (user_id, storage_path, position)
  values (p_user, p_user::text || '/main.jpg', 0)
  on conflict do nothing;

  perform login_as_service();
  -- Photo review is a moderator action; approving here is the equivalent of a
  -- moderator clearing the queue.
  update profile_photos set moderation_status = 'approved' where user_id = p_user;
  perform recompute_profile_complete(p_user);
end;
$$;

select test_complete_profile(:ana::uuid, 'Ana', '1994-05-02', 'Roma Norte, CDMX', 19.41, -99.16,
  array['cine', 'cafe', 'caminatas'], array['new_in_city', 'expand_circle']::friendship_intention[], array['es', 'en']);
select test_complete_profile(:beto::uuid, 'Beto', '1991-09-14', 'Condesa, CDMX', 19.41, -99.18,
  array['cine', 'cafe', 'museos'], array['new_in_city', 'close_friendship']::friendship_intention[], array['es']);
select test_complete_profile(:caro::uuid, 'Caro', '1996-02-20', 'Del Valle, CDMX', 19.38, -99.16,
  array['yoga', 'libros', 'cafe'], array['expand_circle']::friendship_intention[], array['es']);

\echo ''
\echo '--- profiles and privacy'

select login_as(:ana::uuid);

select assert_true(
  (select count(*) from profiles where id = :beto::uuid) = 0,
  'a user cannot read another user''s profile row directly');

select assert_true(
  (select count(*) from profiles) = 1,
  'selecting all profiles returns only your own row');

select assert_true(
  get_public_profile(:beto::uuid) ->> 'displayName' = 'Beto',
  'the public profile RPC returns the other user''s display name');

select assert_true(
  not (get_public_profile(:beto::uuid) ? 'lat') and not (get_public_profile(:beto::uuid) ? 'lon'),
  'the public profile never contains coordinates');

select assert_true(
  (select count(*) from jsonb_array_elements(discovery_candidates(50)) c
   where (c ->> 'userId')::uuid = :beto::uuid) = 1,
  'discovery returns a compatible candidate');

select assert_true(
  (select (c -> 'location' ->> 'lat')::numeric = round((c -> 'location' ->> 'lat')::numeric, 1)
   from jsonb_array_elements(discovery_candidates(50)) c limit 1),
  'discovery coordinates are coarsened to one decimal');

select assert_true(
  (select count(*) from jsonb_array_elements(discovery_candidates(50)) c
   where (c ->> 'userId')::uuid = :ana::uuid) = 0,
  'discovery never returns the viewer');

\echo ''
\echo '--- profile edits cannot escalate'

select login_as(:mod::uuid);
select moderate_set_account_status(:ana::uuid, 'suspended', null, 'Prueba de escalada de privilegios.');

select login_as(:ana::uuid);
update profiles set account_status = 'active', profile_complete = true where id = :ana::uuid;
select assert_true(
  (select account_status from profiles where id = :ana::uuid) = 'suspended',
  'a suspended user cannot reinstate themselves');

select login_as(:mod::uuid);
select moderate_set_account_status(:ana::uuid, 'active', null, 'Fin de la prueba.');

\echo ''
\echo '--- decisions and matches'

select login_as(:ana::uuid);
select assert_true(
  (record_decision(:beto::uuid, 'interested', gen_random_uuid()) ->> 'matched') = 'false',
  'one-sided interest does not create a match');

select login_as(:beto::uuid);
select assert_true(
  (record_decision(:ana::uuid, 'interested', gen_random_uuid()) ->> 'matched') = 'true',
  'mutual interest creates a match');

select assert_true(
  (select count(*) from matches
   where user_low = least(:ana::uuid, :beto::uuid) and user_high = greatest(:ana::uuid, :beto::uuid)) = 1,
  'exactly one match row exists for the pair');

-- Replaying the same decision must not create a second row or a second match.
select login_as(:beto::uuid);
select record_decision(:ana::uuid, 'interested', gen_random_uuid());
select assert_true(
  (select count(*) from profile_decisions where actor_id = :beto::uuid and target_id = :ana::uuid) = 1,
  'a repeated decision is idempotent');

select login_as(:ana::uuid);
select assert_true(
  (select count(*) from jsonb_array_elements(discovery_candidates(50)) c
   where (c ->> 'userId')::uuid = :beto::uuid) = 0,
  'a matched user no longer appears in discovery');

\echo ''
\echo '--- messaging'

select login_as(:ana::uuid);
select send_message((select c.id from conversations c join matches m on m.id = c.match_id
                     where m.user_low = least(:ana::uuid, :beto::uuid)
                       and m.user_high = greatest(:ana::uuid, :beto::uuid)),
                    'Hola Beto, vi que también acabas de mudarte.');

select assert_true(
  (select count(*) from messages) = 1,
  'the sender can read the message they sent');

select login_as(:beto::uuid);
select assert_true(
  (select count(*) from messages) = 1,
  'the other member of the match can read the message');

select login_as(:caro::uuid);
select assert_true(
  (select count(*) from messages) = 0,
  'a non-member cannot read the conversation');

select assert_true(
  (select count(*) from conversations) = 0,
  'a non-member cannot even see that the conversation exists');

do $$
declare
  v_conversation uuid;
begin
  perform login_as_service();
  select c.id into v_conversation from conversations c;
  perform login_as('33333333-3333-4333-8333-333333333333'::uuid);
  begin
    perform send_message(v_conversation, 'Intento entrar en una conversación ajena.');
    raise exception 'ASSERTION FAILED: a non-member was able to send a message';
  exception
    when sqlstate '42501' then
      raise notice '  ok — a non-member cannot send a message into the conversation';
  end;
end
$$;

\echo ''
\echo '--- messaging without a match'

do $$
declare
  v_match uuid;
  v_conversation uuid;
begin
  perform login_as_service();
  select m.id, c.id into v_match, v_conversation from matches m join conversations c on c.match_id = m.id;

  perform login_as('11111111-1111-4111-8111-111111111111'::uuid);
  perform end_match(v_match, 'no compatible');

  begin
    perform send_message(v_conversation, 'Mensaje después de deshacer el match.');
    raise exception 'ASSERTION FAILED: a message was accepted after the match ended';
  exception
    when sqlstate '42501' then
      raise notice '  ok — messages are rejected once the match has ended';
  end;
end
$$;

\echo ''
\echo '--- blocking'

select login_as(:caro::uuid);
select block_user(:beto::uuid);

select assert_true(
  (select count(*) from jsonb_array_elements(discovery_candidates(50)) c
   where (c ->> 'userId')::uuid = :beto::uuid) = 0,
  'a blocked user disappears from discovery');

select login_as(:beto::uuid);
select assert_true(
  (select count(*) from jsonb_array_elements(discovery_candidates(50)) c
   where (c ->> 'userId')::uuid = :caro::uuid) = 0,
  'the block is symmetric: the blocked user cannot see the blocker either');

do $$
begin
  perform login_as('22222222-2222-4222-8222-222222222222'::uuid);
  begin
    perform record_decision('33333333-3333-4333-8333-333333333333'::uuid, 'interested', gen_random_uuid());
    raise exception 'ASSERTION FAILED: a blocked user was able to express interest';
  exception
    when sqlstate '42501' then
      raise notice '  ok — a blocked user cannot express interest';
  end;
end
$$;

\echo ''
\echo '--- reports and moderation'

select login_as(:caro::uuid);
select report_user(:beto::uuid, 'harassment', 'Mensajes insistentes después de pedir espacio.');

select assert_true(
  (select count(*) from reports where reporter_id = :caro::uuid) = 1,
  'the reporter can see their own report');

select login_as(:ana::uuid);
select assert_true(
  (select count(*) from reports) = 0,
  'an unrelated user cannot see other people''s reports');

do $$
begin
  perform login_as('11111111-1111-4111-8111-111111111111'::uuid);
  begin
    perform moderate_set_account_status('22222222-2222-4222-8222-222222222222'::uuid, 'suspended');
    raise exception 'ASSERTION FAILED: a normal user performed a moderation action';
  exception
    when sqlstate '42501' then
      raise notice '  ok — a normal user cannot suspend an account';
  end;
end
$$;

select login_as(:mod::uuid);
select assert_true(
  (select count(*) from reports) >= 1,
  'a moderator sees the report queue');

select moderate_set_account_status(:beto::uuid, 'suspended', null, 'Reporte confirmado.');
select assert_true(
  (select account_status from profiles where id = :beto::uuid) = 'suspended',
  'a moderator can suspend an account');

select login_as(:ana::uuid);
select assert_true(
  (select count(*) from jsonb_array_elements(discovery_candidates(50)) c
   where (c ->> 'userId')::uuid = :beto::uuid) = 0,
  'a suspended account is not shown in discovery');

select assert_true(
  (select count(*) from audit_logs) = 0,
  'a normal user cannot read the audit log');

select login_as(:mod::uuid);
select assert_true(
  (select count(*) from audit_logs) > 0,
  'an admin can read the audit log');

\echo ''
\echo '--- privacy constraints'

do $$
begin
  perform login_as_service();
  begin
    insert into profiles (id, display_name, birth_date, area_label, lat, lon)
    values (gen_random_uuid(), 'Menor', current_date - interval '15 years', 'Centro', 19.4, -99.1);
    raise exception 'ASSERTION FAILED: a profile under 18 was accepted';
  exception
    when check_violation then raise notice '  ok — the database rejects a profile under 18';
  end;

  begin
    insert into profiles (id, display_name, birth_date, area_label, lat, lon)
    values (gen_random_uuid(), 'Precisa', '1990-01-01', 'Centro', 19.412345, -99.163214);
    raise exception 'ASSERTION FAILED: precise coordinates were accepted';
  exception
    when check_violation then raise notice '  ok — the database rejects precise coordinates';
    when unique_violation then raise exception 'ASSERTION FAILED: precise coordinates were accepted';
  end;
end
$$;

do $$
begin
  perform login_as('11111111-1111-4111-8111-111111111111'::uuid);
  begin
    insert into analytics_events (user_id, name, properties)
    values (auth.uid(), 'first_message_sent', '{"body": "contenido privado"}'::jsonb);
    raise exception 'ASSERTION FAILED: an analytics event carried private content';
  exception
    when check_violation then raise notice '  ok — analytics rejects private message content';
  end;

  insert into analytics_events (user_id, name, properties)
  values (auth.uid(), 'first_message_sent', '{"conversation_age_minutes": 3}'::jsonb);
  raise notice '  ok — analytics accepts a non-sensitive event';
end
$$;

\echo ''
\echo '--- account deletion'

select login_as(:caro::uuid);
select delete_my_account();
select assert_true(
  (select account_status from profiles where id = :caro::uuid) = 'deleted'
    and (select display_name from profiles where id = :caro::uuid) = 'Cuenta eliminada',
  'deleting an account anonymizes the profile and marks it deleted');

select login_as(:ana::uuid);
select assert_true(
  (select count(*) from jsonb_array_elements(discovery_candidates(50)) c
   where (c ->> 'userId')::uuid = :caro::uuid) = 0,
  'a deleted account never appears in discovery');

select login_as_service();
drop function test_complete_profile(uuid, text, date, text, double precision, double precision, text[], friendship_intention[], text[]);

\echo ''
\echo 'All database assertions passed.'
