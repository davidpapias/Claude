import { supabase, env } from './supabase';

/**
 * Product analytics. Event names are documented in docs/analytics.md; the
 * database rejects properties that carry private content.
 */
export type AnalyticsEventName =
  | 'sign_up_started'
  | 'sign_up_completed'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'discovery_profile_viewed'
  | 'discovery_like'
  | 'discovery_pass'
  | 'match_created'
  | 'conversation_opened'
  | 'first_message_sent'
  | 'first_reply_received'
  | 'report_created'
  | 'block_created'
  | 'match_feedback_submitted'
  | 'account_deleted';

export async function track(
  name: AnalyticsEventName,
  properties: Record<string, string | number | boolean> = {},
): Promise<void> {
  if (!env.analyticsEnabled) return;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;

  // Analytics must never break the product: a failure here is swallowed.
  await supabase.from('analytics_events').insert({ user_id: data.user.id, name, properties });
}
