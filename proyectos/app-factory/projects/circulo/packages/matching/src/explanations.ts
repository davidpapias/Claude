import type {
  AvailabilitySlot,
  FriendshipIntention,
  MatchingProfile,
  RecommendationExplanation,
} from '@circulo/types';
import { distanceKm } from './geo.js';

/**
 * Explanations must be concrete and checkable against the two profiles.
 * Forbidden: percentages of psychological compatibility, personality claims,
 * anything the user cannot verify by reading both profiles.
 */

const INTENTION_LABEL: Record<FriendshipIntention, string> = {
  close_friendship: 'crear una amistad cercana',
  casual_meetups: 'conocer gente de forma casual',
  activity_partner: 'encontrar compañía para planes',
  expand_circle: 'ampliar su círculo social',
  new_in_city: 'adaptarse a una ciudad nueva',
  language_practice: 'practicar un idioma',
  similar_life_stage: 'conocer gente en una etapa de vida similar',
};

const WEEKDAY_LABEL = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
] as const;

const BLOCK_LABEL = {
  morning: 'por la mañana',
  afternoon: 'por la tarde',
  evening: 'por la noche',
} as const;

const FREQUENCY_LABEL = {
  daily: 'hablar casi todos los días',
  few_times_week: 'hablar varias veces por semana',
  weekly: 'hablar una vez por semana',
  occasional: 'hablar de vez en cuando',
} as const;

const PLAN_LABEL = {
  calm: 'los planes tranquilos',
  mixed: 'mezclar planes tranquilos y activos',
  active: 'los planes activos',
} as const;

const GROUP_LABEL = {
  one_on_one: 'ver a una persona a la vez',
  small_group: 'los grupos pequeños',
  flexible: 'adaptarse al tamaño del grupo',
  many_people: 'conocer a varias personas a la vez',
} as const;

function slotLabel(slot: AvailabilitySlot): string {
  return `${WEEKDAY_LABEL[slot.weekday]} ${BLOCK_LABEL[slot.block]}`;
}

function sharedSlots(a: MatchingProfile, b: MatchingProfile): AvailabilitySlot[] {
  return a.availability.filter((slot) =>
    b.availability.some((other) => other.weekday === slot.weekday && other.block === slot.block),
  );
}

function listToSentence(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

export interface ExplanationOptions {
  /** Maps an interest slug to its display label. Falls back to the slug. */
  interestLabels?: Record<string, string>;
  maxExplanations?: number;
}

/**
 * Between one and three reasons, strongest first. Returns an empty array only
 * when two profiles share nothing concrete — in that case the caller should not
 * present the candidate as recommended.
 */
export function buildExplanations(
  viewer: MatchingProfile,
  candidate: MatchingProfile,
  options: ExplanationOptions = {},
): RecommendationExplanation[] {
  const max = options.maxExplanations ?? 3;
  const labels = options.interestLabels ?? {};
  const out: Array<RecommendationExplanation & { weight: number }> = [];

  const sharedIntentions = viewer.intentions.filter((i) => candidate.intentions.includes(i));
  const firstIntention = sharedIntentions[0];
  if (firstIntention) {
    out.push({
      code: `shared_intention:${firstIntention}`,
      text: `Los dos buscan ${INTENTION_LABEL[firstIntention]}.`,
      weight: 100,
    });
  }

  const slots = sharedSlots(viewer, candidate);
  const firstSlot = slots[0];
  if (firstSlot && slots.length >= 2) {
    out.push({
      code: 'shared_schedule',
      text: `Coinciden en ${slots.length} franjas de la semana, como el ${slotLabel(firstSlot)}.`,
      weight: 80,
    });
  } else if (firstSlot) {
    out.push({
      code: 'shared_schedule_single',
      text: `Los dos suelen tener libre el ${slotLabel(firstSlot)}.`,
      weight: 60,
    });
  }

  const sharedInterests = viewer.interests.filter((i) => candidate.interests.includes(i));
  if (sharedInterests.length > 0) {
    const shown = sharedInterests.slice(0, 3).map((slug) => labels[slug] ?? slug);
    out.push({
      code: 'shared_interests',
      text:
        sharedInterests.length > 3
          ? `Comparten ${sharedInterests.length} intereses, entre ellos ${listToSentence(shown)}.`
          : `Comparten interés por ${listToSentence(shown)}.`,
      weight: 75,
    });
  }

  if (viewer.social.contactFrequency === candidate.social.contactFrequency) {
    out.push({
      code: 'same_contact_frequency',
      text: `A ambos les gusta ${FREQUENCY_LABEL[viewer.social.contactFrequency]}.`,
      weight: 70,
    });
  }

  if (viewer.social.planPreference === candidate.social.planPreference) {
    out.push({
      code: 'same_plan_preference',
      text: `A los dos les van ${PLAN_LABEL[viewer.social.planPreference]}.`,
      weight: 55,
    });
  }

  if (viewer.social.groupPreference === candidate.social.groupPreference) {
    out.push({
      code: 'same_group_preference',
      text: `A ambos les gusta ${GROUP_LABEL[viewer.social.groupPreference]}.`,
      weight: 50,
    });
  }

  if (viewer.social.spontaneity === candidate.social.spontaneity) {
    out.push({
      code: 'same_spontaneity',
      text:
        viewer.social.spontaneity === 'spontaneous'
          ? 'Los dos prefieren los planes espontáneos.'
          : viewer.social.spontaneity === 'plans_ahead'
            ? 'Los dos suelen planear con anticipación.'
            : 'Los dos se adaptan a planes con o sin anticipación.',
      weight: 45,
    });
  }

  const km = distanceKm(viewer.location, candidate.location);
  if (km <= 5) {
    out.push({
      code: 'nearby',
      text: `Están en zonas cercanas: ${candidate.location.areaLabel}.`,
      weight: 40,
    });
  }

  const sharedLanguages = viewer.languages.filter((l) => candidate.languages.includes(l));
  if (sharedLanguages.length >= 2) {
    out.push({
      code: 'shared_languages',
      text: `Hablan ${sharedLanguages.length} idiomas en común.`,
      weight: 30,
    });
  }

  return out
    .sort((x, y) => y.weight - x.weight)
    .slice(0, max)
    .map(({ code, text }) => ({ code, text }));
}
