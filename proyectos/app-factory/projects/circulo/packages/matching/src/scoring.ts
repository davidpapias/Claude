import {
  CONTACT_FREQUENCY,
  GROUP_PREFERENCE,
  PLAN_PREFERENCE,
  SOCIAL_ENERGY,
  SPONTANEITY,
  WARM_UP_SPEED,
  type MatchingProfile,
  type ScoreBreakdown,
  type ScoreComponent,
} from '@circulo/types';
import { distanceKm } from './geo';

/** Weights sum to 100. Changing one requires updating docs/matching-system.md. */
export const WEIGHTS: Record<ScoreComponent, number> = {
  intention: 20,
  socialStyle: 18,
  availability: 15,
  interests: 15,
  communication: 12,
  plans: 8,
  distance: 7,
  languages: 5,
};

/** Similarity of two ordinal values, 1 when equal, 0 at opposite ends. */
function ordinalSimilarity<T extends string>(scale: readonly T[], a: T, b: T): number {
  const ia = scale.indexOf(a);
  const ib = scale.indexOf(b);
  if (ia < 0 || ib < 0) return 0;
  const span = scale.length - 1;
  return span === 0 ? 1 : 1 - Math.abs(ia - ib) / span;
}

function overlapCount<T>(a: readonly T[], b: readonly T[]): number {
  const set = new Set(b);
  return a.filter((item) => set.has(item)).length;
}

/** Saturating ratio: `full` overlaps or more scores 1. */
function saturate(count: number, full: number): number {
  return Math.min(1, count / full);
}

export function intentionScore(a: MatchingProfile, b: MatchingProfile): number {
  const shared = overlapCount(a.intentions, b.intentions);
  if (shared === 0) return 0;
  // One shared intention is most of the signal; a second adds confidence.
  return Math.min(1, 0.7 + 0.3 * (shared - 1));
}

export function socialStyleScore(a: MatchingProfile, b: MatchingProfile): number {
  const energy = ordinalSimilarity(SOCIAL_ENERGY, a.social.socialEnergy, b.social.socialEnergy);
  const group = ordinalSimilarity(
    GROUP_PREFERENCE,
    a.social.groupPreference,
    b.social.groupPreference,
  );
  const warmUp = ordinalSimilarity(WARM_UP_SPEED, a.social.warmUpSpeed, b.social.warmUpSpeed);
  // Two people who both need time are compatible; so are two who open quickly.
  // A large gap is the friction we want to down-rank, hence plain similarity.
  return energy * 0.45 + group * 0.35 + warmUp * 0.2;
}

export function availabilityScore(a: MatchingProfile, b: MatchingProfile): number {
  const shared = a.availability.filter((slot) =>
    b.availability.some((other) => other.weekday === slot.weekday && other.block === slot.block),
  ).length;
  return saturate(shared, 4);
}

export function interestScore(a: MatchingProfile, b: MatchingProfile): number {
  const shared = overlapCount(a.interests, b.interests);
  return saturate(shared, 5);
}

export function communicationScore(a: MatchingProfile, b: MatchingProfile): number {
  const frequency = ordinalSimilarity(
    CONTACT_FREQUENCY,
    a.social.contactFrequency,
    b.social.contactFrequency,
  );
  const styles = saturate(overlapCount(a.social.communicationStyles, b.social.communicationStyles), 2);
  return frequency * 0.6 + styles * 0.4;
}

export function planScore(a: MatchingProfile, b: MatchingProfile): number {
  const plans = ordinalSimilarity(PLAN_PREFERENCE, a.social.planPreference, b.social.planPreference);
  const spontaneity = ordinalSimilarity(SPONTANEITY, a.social.spontaneity, b.social.spontaneity);
  const alcohol = alcoholCompatibility(a, b);
  return plans * 0.5 + spontaneity * 0.3 + alcohol * 0.2;
}

/** Only a comfort signal for shared plans. Never a filter, never displayed as a label. */
function alcoholCompatibility(a: MatchingProfile, b: MatchingProfile): number {
  const x = a.social.alcoholPreference;
  const y = b.social.alcoholPreference;
  if (x === 'no_preference' || y === 'no_preference' || x === y) return 1;
  return 0.4;
}

export function distanceScore(a: MatchingProfile, b: MatchingProfile): number {
  const limit = Math.min(a.discovery.maxDistanceKm, b.discovery.maxDistanceKm);
  if (limit <= 0) return 0;
  const km = distanceKm(a.location, b.location);
  return Math.max(0, 1 - km / limit);
}

export function languageScore(a: MatchingProfile, b: MatchingProfile): number {
  return saturate(overlapCount(a.languages, b.languages), 2);
}

const COMPONENTS: Record<ScoreComponent, (a: MatchingProfile, b: MatchingProfile) => number> = {
  intention: intentionScore,
  socialStyle: socialStyleScore,
  availability: availabilityScore,
  interests: interestScore,
  communication: communicationScore,
  plans: planScore,
  distance: distanceScore,
  languages: languageScore,
};

export interface ScoreResult {
  score: number;
  breakdown: ScoreBreakdown[];
}

/**
 * Compatibility score from 0 to 100. Symmetric: `score(a, b) === score(b, a)`.
 * It orders candidates. It is not a claim about psychological compatibility.
 */
export function scorePair(a: MatchingProfile, b: MatchingProfile): ScoreResult {
  const breakdown = (Object.keys(COMPONENTS) as ScoreComponent[]).map((component) => {
    const max = WEIGHTS[component];
    const ratio = COMPONENTS[component](a, b);
    return { component, max, earned: round2(ratio * max) };
  });

  const score = round2(breakdown.reduce((total, part) => total + part.earned, 0));
  return { score, breakdown };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
