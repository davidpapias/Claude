import type { MatchingProfile } from '@circulo/types';

/**
 * Conversation starters built from what two people actually share. The point is
 * to remove the blank-page moment after a match, so every starter is a question
 * both sides can answer, and none of them are romantic.
 */

export interface StarterOptions {
  interestLabels?: Record<string, string>;
  max?: number;
}

const GENERIC = [
  '¿Qué te ha gustado de tu zona últimamente?',
  '¿Cómo suele ser tu fin de semana ideal?',
  '¿Qué te gustaría hacer más seguido y casi nunca haces?',
];

export function buildConversationStarters(
  a: MatchingProfile,
  b: MatchingProfile,
  options: StarterOptions = {},
): string[] {
  const labels = options.interestLabels ?? {};
  const max = options.max ?? 3;
  const out: string[] = [];

  const sharedInterests = a.interests.filter((interest) => b.interests.includes(interest));
  const firstInterest = sharedInterests[0];
  if (firstInterest) {
    const label = (labels[firstInterest] ?? firstInterest).toLowerCase();
    out.push(`Los dos mencionaron ${label}. ¿Qué recomendarían sin pensarlo demasiado?`);
  }

  if (a.intentions.includes('new_in_city') && b.intentions.includes('new_in_city')) {
    out.push('Ambos están conociendo la ciudad. ¿Qué lugar les ha sorprendido últimamente?');
  }

  if (a.social.planPreference === 'calm' && b.social.planPreference === 'calm') {
    out.push('A los dos les van los planes tranquilos. ¿Cuál sería su domingo ideal?');
  } else if (a.social.planPreference === 'active' && b.social.planPreference === 'active') {
    out.push('A los dos les gustan los planes activos. ¿Qué actividad quieren probar este mes?');
  }

  const sharedSlot = a.availability.find((slot) =>
    b.availability.some((other) => other.weekday === slot.weekday && other.block === slot.block),
  );
  if (sharedSlot && out.length < max) {
    out.push('Coinciden en horarios. ¿Prefieren empezar por un café o por una caminata?');
  }

  const wantsCloseFriendship =
    a.intentions.includes('close_friendship') && b.intentions.includes('close_friendship');
  if (wantsCloseFriendship && out.length < max) {
    out.push('Los dos buscan amistades cercanas. ¿Qué hace que una amistad funcione para ustedes?');
  }

  for (const fallback of GENERIC) {
    if (out.length >= max) break;
    out.push(fallback);
  }

  return out.slice(0, max);
}
