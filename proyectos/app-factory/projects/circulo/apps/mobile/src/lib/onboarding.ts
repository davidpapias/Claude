import type { AvailabilitySlot, FriendshipIntention } from '@circulo/types';
import { supabase } from './supabase';
import { track } from './analytics';

/**
 * Onboarding is short steps with a save after each one, so an interrupted
 * signup can resume exactly where it stopped instead of starting over.
 */
export const ONBOARDING_STEPS = [
  'identity',
  'photos',
  'bio',
  'intentions',
  'interests',
  'social',
  'communication',
  'availability',
  'distance',
  'boundaries',
  'summary',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const STEP_TITLES: Record<OnboardingStep, string> = {
  identity: '¿Cómo te llamas?',
  photos: 'Tu foto',
  bio: 'Cuéntanos de ti',
  intentions: '¿Qué buscas?',
  interests: 'Tus intereses',
  social: 'Tu estilo social',
  communication: 'Cómo te gusta conversar',
  availability: '¿Cuándo sueles estar libre?',
  distance: 'Cerca de ti',
  boundaries: 'Tus límites',
  summary: 'Revisa tu perfil',
};

export function nextStep(step: OnboardingStep): OnboardingStep | null {
  const index = ONBOARDING_STEPS.indexOf(step);
  return ONBOARDING_STEPS[index + 1] ?? null;
}

export function stepProgress(step: OnboardingStep): { current: number; total: number } {
  return { current: ONBOARDING_STEPS.indexOf(step) + 1, total: ONBOARDING_STEPS.length };
}

async function markStepCompleted(userId: string, step: OnboardingStep): Promise<void> {
  const upcoming = nextStep(step);
  const { data } = await supabase
    .from('onboarding_progress')
    .select('completed_steps')
    .eq('user_id', userId)
    .maybeSingle();

  const completed = new Set<string>(data?.completed_steps ?? []);
  completed.add(step);

  await supabase
    .from('onboarding_progress')
    .upsert({ user_id: userId, step: upcoming ?? 'summary', completed_steps: [...completed] });

  void track('onboarding_step_completed', { step });
}

export async function saveIdentity(
  userId: string,
  input: {
    displayName: string;
    birthDate: string;
    areaLabel: string;
    lat: number;
    lon: number;
    pronouns?: string | null;
    lifeStage?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.rpc('upsert_profile_identity', {
    p_display_name: input.displayName,
    p_birth_date: input.birthDate,
    p_area_label: input.areaLabel,
    p_lat: input.lat,
    p_lon: input.lon,
    p_pronouns: input.pronouns ?? null,
    p_life_stage: input.lifeStage ?? null,
  });
  if (error) throw new Error(error.message);
  await markStepCompleted(userId, 'identity');
}

export async function savePhoto(userId: string, localUri: string, position = 0): Promise<void> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${position}-${Date.now()}.${extension}`;

  const upload = await supabase.storage.from('profile-photos').upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: false,
  });
  if (upload.error) throw new Error(upload.error.message);

  // Replace whatever occupied this position; photos start as `pending` and are
  // only visible to others once moderation approves them.
  await supabase.from('profile_photos').delete().eq('user_id', userId).eq('position', position);
  const { error } = await supabase
    .from('profile_photos')
    .insert({ user_id: userId, storage_path: path, position });
  if (error) throw new Error(error.message);

  await markStepCompleted(userId, 'photos');
}

export async function saveBio(
  userId: string,
  input: { bio: string; conversationTopics: string[]; wantsToTry: string[] },
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      bio: input.bio,
      conversation_topics: input.conversationTopics,
      wants_to_try: input.wantsToTry,
    })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  await markStepCompleted(userId, 'bio');
}

export async function saveIntentions(
  userId: string,
  intentions: FriendshipIntention[],
): Promise<void> {
  await supabase.from('user_friendship_intentions').delete().eq('user_id', userId);
  const { error } = await supabase
    .from('user_friendship_intentions')
    .insert(intentions.map((intention) => ({ user_id: userId, intention })));
  if (error) throw new Error(error.message);
  await markStepCompleted(userId, 'intentions');
}

export async function saveInterests(userId: string, interests: string[]): Promise<void> {
  await supabase.from('user_interests').delete().eq('user_id', userId);
  const { error } = await supabase
    .from('user_interests')
    .insert(interests.map((slug) => ({ user_id: userId, interest_slug: slug })));
  if (error) throw new Error(error.message);
  await markStepCompleted(userId, 'interests');
}

export async function saveSocial(
  userId: string,
  input: Record<string, string>,
  step: OnboardingStep,
): Promise<void> {
  const { error } = await supabase.from('social_preferences').update(input).eq('user_id', userId);
  if (error) throw new Error(error.message);
  await markStepCompleted(userId, step);
}

export async function saveCommunication(
  userId: string,
  input: { contactFrequency: string; communicationStyles: string[] },
): Promise<void> {
  const { error } = await supabase
    .from('social_preferences')
    .update({
      contact_frequency: input.contactFrequency,
      communication_styles: input.communicationStyles,
    })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  await markStepCompleted(userId, 'communication');
}

export async function saveAvailability(
  userId: string,
  slots: AvailabilitySlot[],
): Promise<void> {
  await supabase.from('availability_slots').delete().eq('user_id', userId);
  const { error } = await supabase
    .from('availability_slots')
    .insert(slots.map((slot) => ({ user_id: userId, weekday: slot.weekday, block: slot.block })));
  if (error) throw new Error(error.message);

  // Languages default to Spanish when the user did not change them; a profile
  // without a language can never be matched.
  const languages = await supabase.from('user_languages').select('language_code').eq('user_id', userId);
  if ((languages.data ?? []).length === 0) {
    await supabase.from('user_languages').insert({ user_id: userId, language_code: 'es' });
  }

  await markStepCompleted(userId, 'availability');
}

export async function saveDistance(
  userId: string,
  input: { maxDistanceKm: number; minAge: number; maxAge: number },
): Promise<void> {
  const { error } = await supabase
    .from('profile_preferences')
    .update({
      max_distance_km: input.maxDistanceKm,
      min_age: input.minAge,
      max_age: input.maxAge,
    })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  await markStepCompleted(userId, 'distance');
}

export async function saveBoundaries(
  userId: string,
  input: { boundaries: string[]; friendshipExpectations: string | null },
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      boundaries: input.boundaries,
      friendship_expectations: input.friendshipExpectations,
    })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  await markStepCompleted(userId, 'boundaries');
}

export async function finishOnboarding(userId: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', userId);
  await markStepCompleted(userId, 'summary');
  void track('onboarding_completed');
}
