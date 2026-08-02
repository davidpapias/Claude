import type {
  Decision,
  MatchFeedback,
  MatchingProfile,
  PublicProfile,
  Recommendation,
  ReportCategory,
} from '@circulo/types';
import { supabase } from './supabase';

/**
 * Every server call the app makes. Keeping them here means the screens never
 * build a query themselves, and the RPC surface stays reviewable in one file.
 */

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error('empty response');
  return result.data;
}

export interface CandidateProfile extends MatchingProfile {
  recentImpressions: number;
  spamFlagged: boolean;
}

export async function fetchDiscoveryCandidates(limit = 60): Promise<CandidateProfile[]> {
  const result = await supabase.rpc('discovery_candidates', { p_limit: limit });
  return unwrap(result) as CandidateProfile[];
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase.rpc('get_public_profile', { p_user_id: userId });
  if (error) throw new Error(error.message);
  return (data as PublicProfile | null) ?? null;
}

export async function saveRecommendationBatch(
  seed: string,
  recommendations: Recommendation[],
): Promise<string> {
  const result = await supabase.rpc('save_recommendation_batch', {
    p_seed: seed,
    p_items: recommendations.map((recommendation) => ({
      userId: recommendation.userId,
      score: recommendation.score,
      explanations: recommendation.explanations,
      breakdown: recommendation.breakdown,
    })),
  });
  return unwrap(result) as string;
}

export interface DecisionResult {
  matched: boolean;
  matchId: string | null;
  conversationId: string | null;
  idempotentReplay: boolean;
}

export async function recordDecision(
  targetUserId: string,
  decision: Decision,
  idempotencyKey: string,
): Promise<DecisionResult> {
  const result = await supabase.rpc('record_decision', {
    p_target_id: targetUserId,
    p_decision: decision,
    p_idempotency_key: idempotencyKey,
  });
  return unwrap(result) as DecisionResult;
}

export interface MatchSummary {
  matchId: string;
  conversationId: string;
  otherUserId: string;
  createdAt: string;
  lastMessageAt: string | null;
}

export async function fetchMatches(userId: string): Promise<MatchSummary[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('id, user_low, user_high, created_at, conversations(id, last_message_at)')
    .is('ended_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const conversation = Array.isArray(row.conversations) ? row.conversations[0] : row.conversations;
    return {
      matchId: row.id as string,
      conversationId: (conversation as { id: string } | undefined)?.id ?? '',
      otherUserId: row.user_low === userId ? (row.user_high as string) : (row.user_low as string),
      createdAt: row.created_at as string,
      lastMessageAt:
        (conversation as { last_message_at: string | null } | undefined)?.last_message_at ?? null,
    };
  });
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  photoPath: string | null;
  replyToId: string | null;
  createdAt: string;
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, photo_path, reply_to_id, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    photoPath: row.photo_path,
    replyToId: row.reply_to_id,
    createdAt: row.created_at,
  }));
}

export async function sendMessage(
  conversationId: string,
  body: string,
  replyToId?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc('send_message', {
    p_conversation_id: conversationId,
    p_body: body,
    p_reply_to_id: replyToId ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function endMatch(matchId: string, reason?: string): Promise<void> {
  const { error } = await supabase.rpc('end_match', { p_match_id: matchId, p_reason: reason ?? null });
  if (error) throw new Error(error.message);
}

export async function blockUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('block_user', { p_target_id: userId });
  if (error) throw new Error(error.message);
}

export async function unblockUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('unblock_user', { p_target_id: userId });
  if (error) throw new Error(error.message);
}

export async function fetchBlocks(): Promise<Array<{ id: string; blockedId: string; createdAt: string }>> {
  const { data, error } = await supabase
    .from('blocks')
    .select('id, blocked_id, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    blockedId: row.blocked_id,
    createdAt: row.created_at,
  }));
}

export async function reportUser(input: {
  reportedUserId: string;
  category: ReportCategory;
  details?: string | null;
  conversationId?: string | null;
  messageIds?: string[];
}): Promise<string> {
  const result = await supabase.rpc('report_user', {
    p_reported_user_id: input.reportedUserId,
    p_category: input.category,
    p_details: input.details ?? null,
    p_conversation_id: input.conversationId ?? null,
    p_message_ids: input.messageIds ?? null,
  });
  return unwrap(result) as string;
}

export async function submitMatchFeedback(matchId: string, feedback: MatchFeedback): Promise<void> {
  const { error } = await supabase.rpc('submit_match_feedback', {
    p_match_id: matchId,
    p_feedback: feedback,
  });
  if (error) throw new Error(error.message);
}

export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw new Error(error.message);
}

export async function exportMyData(): Promise<unknown> {
  const { data, error } = await supabase.rpc('export_my_data');
  if (error) throw new Error(error.message);
  return data;
}

export interface MyProfileState {
  profileComplete: boolean;
  onboardingStep: string;
  displayName: string | null;
  accountStatus: string;
}

export async function fetchMyState(userId: string): Promise<MyProfileState | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, profile_complete, account_status, onboarding_progress(step)')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const progress = Array.isArray(data.onboarding_progress)
    ? data.onboarding_progress[0]
    : data.onboarding_progress;

  return {
    displayName: data.display_name,
    profileComplete: data.profile_complete,
    accountStatus: data.account_status,
    onboardingStep: (progress as { step?: string } | null)?.step ?? 'identity',
  };
}

/** The viewer's own matching profile, needed to score candidates locally. */
export async function fetchMyMatchingProfile(userId: string): Promise<MatchingProfile | null> {
  const [profile, preferences, social, interests, intentions, languages, availability] =
    await Promise.all([
      supabase.from('profiles').select('id, birth_date, area_label, lat, lon, created_at, profile_complete, account_status').eq('id', userId).maybeSingle(),
      supabase.from('profile_preferences').select('max_distance_km, min_age, max_age').eq('user_id', userId).maybeSingle(),
      supabase.from('social_preferences').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('user_interests').select('interest_slug').eq('user_id', userId),
      supabase.from('user_friendship_intentions').select('intention').eq('user_id', userId),
      supabase.from('user_languages').select('language_code').eq('user_id', userId),
      supabase.from('availability_slots').select('weekday, block').eq('user_id', userId),
    ]);

  if (!profile.data || !preferences.data || !social.data) return null;

  const birth = new Date(profile.data.birth_date);
  const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));

  return {
    userId,
    age,
    location: {
      areaLabel: profile.data.area_label,
      lat: Math.round(profile.data.lat * 10) / 10,
      lon: Math.round(profile.data.lon * 10) / 10,
    },
    languages: (languages.data ?? []).map((row) => row.language_code),
    intentions: (intentions.data ?? []).map((row) => row.intention),
    interests: (interests.data ?? []).map((row) => row.interest_slug),
    availability: (availability.data ?? []).map((row) => ({
      weekday: row.weekday,
      block: row.block,
    })),
    social: {
      socialEnergy: social.data.social_energy,
      warmUpSpeed: social.data.warm_up_speed,
      groupPreference: social.data.group_preference,
      contactFrequency: social.data.contact_frequency,
      communicationStyles: social.data.communication_styles,
      spontaneity: social.data.spontaneity,
      planPreference: social.data.plan_preference,
      alcoholPreference: social.data.alcohol_preference,
    },
    discovery: {
      maxDistanceKm: preferences.data.max_distance_km,
      minAge: preferences.data.min_age,
      maxAge: preferences.data.max_age,
    },
    createdAt: profile.data.created_at,
    profileComplete: profile.data.profile_complete,
    accountStatus: profile.data.account_status,
  };
}
