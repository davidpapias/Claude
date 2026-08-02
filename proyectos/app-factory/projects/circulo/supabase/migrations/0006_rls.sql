-- 0006 — Row Level Security. Deny by default: privileges are revoked from the
-- client roles first, then granted back table by table, and every grant is
-- narrowed further by a policy.
--
-- Another user's profile is deliberately NOT readable through a table policy.
-- The only ways to see someone else are `get_public_profile` and
-- `discovery_candidates`, both SECURITY DEFINER, both of which strip private
-- columns and honour blocks. That is what stops profile scraping.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

-- --- Column guard ---------------------------------------------------------
-- A user may edit their profile, but not their own moderation state.

create or replace function guard_profile_self_update()
returns trigger
language plpgsql
as $$
begin
  -- Server-side writes (completeness recompute, account deletion, moderation)
  -- set this transaction-local flag before touching the guarded columns. A
  -- client cannot set it: it is only ever set inside SECURITY DEFINER functions
  -- and cleared before they return.
  if current_setting('circulo.system_write', true) = 'on' then
    return new;
  end if;

  if is_staff('moderator') then
    return new;
  end if;

  new.account_status := old.account_status;
  new.profile_complete := old.profile_complete;
  new.deleted_at := old.deleted_at;
  new.id := old.id;
  return new;
end;
$$;

create trigger profiles_guard_self_update before update on profiles
  for each row execute function guard_profile_self_update();

-- --- Profiles -------------------------------------------------------------

grant select, update on profiles to authenticated;

create policy profiles_select_own on profiles
  for select to authenticated using (id = auth.uid());

create policy profiles_select_staff on profiles
  for select to authenticated using (is_staff('moderator'));

create policy profiles_update_own on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- --- Photos ---------------------------------------------------------------

grant select, insert, update, delete on profile_photos to authenticated;

create policy photos_own on profile_photos
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy photos_staff_select on profile_photos
  for select to authenticated using (is_staff('moderator'));

-- --- Preferences and profile detail ---------------------------------------

grant select, insert, update, delete on profile_preferences to authenticated;
create policy preferences_own on profile_preferences
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on social_preferences to authenticated;
create policy social_own on social_preferences
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, delete on user_friendship_intentions to authenticated;
create policy user_intentions_own on user_friendship_intentions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, delete on user_interests to authenticated;
create policy user_interests_own on user_interests
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, delete on user_languages to authenticated;
create policy user_languages_own on user_languages
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, delete on availability_slots to authenticated;
create policy availability_own on availability_slots
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on onboarding_progress to authenticated;
create policy onboarding_own on onboarding_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --- Catalogs (public reference data) -------------------------------------

grant select on interests, languages, friendship_intentions to authenticated;
create policy interests_readable on interests for select to authenticated using (true);
create policy languages_readable on languages for select to authenticated using (true);
create policy intentions_readable on friendship_intentions for select to authenticated using (true);

-- --- Discovery ------------------------------------------------------------
-- Writes happen inside SECURITY DEFINER functions; clients only read their own
-- history, which is what powers "perfiles vistos" and the explanation trail.

grant select on profile_decisions, profile_impressions, recommendation_batches to authenticated;
create policy decisions_select_own on profile_decisions
  for select to authenticated using (actor_id = auth.uid());
create policy impressions_select_own on profile_impressions
  for select to authenticated using (viewer_id = auth.uid());
create policy batches_select_own on recommendation_batches
  for select to authenticated using (viewer_id = auth.uid());

grant select on recommendation_explanations to authenticated;
create policy explanations_select_own on recommendation_explanations
  for select to authenticated using (
    exists (select 1 from recommendation_batches b
            where b.id = batch_id and b.viewer_id = auth.uid()));

-- --- Matches and conversations --------------------------------------------

grant select on matches to authenticated;
create policy matches_select_member on matches
  for select to authenticated using (user_low = auth.uid() or user_high = auth.uid());
create policy matches_select_staff on matches
  for select to authenticated using (is_staff('moderator'));

grant select on conversations to authenticated;
create policy conversations_select_member on conversations
  for select to authenticated using (is_conversation_member(id, auth.uid()));

grant select, update on conversation_members to authenticated;
create policy conversation_members_select on conversation_members
  for select to authenticated using (is_conversation_member(conversation_id, auth.uid()));
create policy conversation_members_update_own on conversation_members
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, update on messages to authenticated;
-- Reading a conversation requires membership. There is no policy that lets a
-- non-member read a message, and none that lets anyone read a deleted one.
create policy messages_select_member on messages
  for select to authenticated using (
    deleted_at is null and is_conversation_member(conversation_id, auth.uid()));
-- Sending goes through `send_message`; the only client-side write is deleting
-- your own message.
create policy messages_soft_delete_own on messages
  for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid());

grant select, insert, delete on message_reactions to authenticated;
create policy reactions_member on message_reactions
  for all to authenticated
  using (
    user_id = auth.uid()
    and exists (select 1 from messages m
                where m.id = message_id and is_conversation_member(m.conversation_id, auth.uid())))
  with check (
    user_id = auth.uid()
    and exists (select 1 from messages m
                where m.id = message_id and is_conversation_member(m.conversation_id, auth.uid())));

grant select on match_feedback to authenticated;
-- Feedback is private: you can read only your own, never the other person's.
create policy match_feedback_select_own on match_feedback
  for select to authenticated using (author_id = auth.uid());

-- --- Safety ---------------------------------------------------------------

grant select on blocks to authenticated;
create policy blocks_select_own on blocks
  for select to authenticated using (blocker_id = auth.uid());

grant select on reports to authenticated;
create policy reports_select_own on reports
  for select to authenticated using (reporter_id = auth.uid());
create policy reports_staff on reports
  for all to authenticated using (is_staff('moderator')) with check (is_staff('moderator'));

grant select on report_evidence, moderation_actions, account_flags, audit_logs, staff_members to authenticated;
create policy report_evidence_staff on report_evidence
  for select to authenticated using (is_staff('moderator'));
create policy moderation_actions_staff on moderation_actions
  for select to authenticated using (is_staff('moderator'));
create policy account_flags_staff on account_flags
  for select to authenticated using (is_staff('moderator'));
-- Audit logs are readable by admins only, and are append-only for everyone:
-- no update or delete policy exists on this table.
create policy audit_logs_admin on audit_logs
  for select to authenticated using (is_staff('admin'));
create policy staff_members_staff on staff_members
  for select to authenticated using (is_staff('moderator'));

grant select on user_verifications to authenticated;
create policy verifications_own on user_verifications
  for select to authenticated using (user_id = auth.uid() or is_staff('moderator'));

-- --- Operations -----------------------------------------------------------

grant select, insert, update, delete on devices to authenticated;
create policy devices_own on devices
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, delete on push_tokens to authenticated;
create policy push_tokens_own on push_tokens
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, update on notifications to authenticated;
create policy notifications_own on notifications
  for select to authenticated using (user_id = auth.uid());
create policy notifications_mark_read on notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select on feature_flags to authenticated;
create policy feature_flags_readable on feature_flags for select to authenticated using (true);
create policy feature_flags_admin on feature_flags
  for all to authenticated using (is_staff('admin')) with check (is_staff('admin'));

-- Analytics is write-only from the client: events can be inserted for yourself
-- and never read back.
grant insert on analytics_events to authenticated;
create policy analytics_insert_own on analytics_events
  for insert to authenticated with check (user_id = auth.uid());

-- `rate_limit_buckets` intentionally has no grant and no policy: it is touched
-- only by SECURITY DEFINER functions.

-- --- Function execution ---------------------------------------------------

grant execute on function
  upsert_profile_identity(text, date, text, double precision, double precision, text, text),
  get_public_profile(uuid),
  discovery_candidates(integer),
  save_recommendation_batch(text, jsonb),
  record_decision(uuid, decision_kind, uuid),
  end_match(uuid, text),
  send_message(uuid, text, uuid, text),
  block_user(uuid),
  unblock_user(uuid),
  report_user(uuid, report_category, text, uuid, uuid[]),
  submit_match_feedback(uuid, match_feedback_kind),
  export_my_data(),
  delete_my_account(),
  is_staff(staff_role)
to authenticated;

grant execute on function
  moderate_set_account_status(uuid, account_status, uuid, text),
  moderate_resolve_report(uuid, report_status, text),
  moderate_review_photo(uuid, moderation_status, text)
to authenticated;
