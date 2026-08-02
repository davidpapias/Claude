import type { FilterReason, MatchingProfile } from '@circulo/types';
import { distanceKm } from './geo';

export interface ViewerContext {
  /** User ids the viewer blocked, or who blocked the viewer. */
  blockedUserIds: string[];
  /** User ids the viewer decided on recently (pass or interested). */
  recentlyDecidedUserIds: string[];
  /** User ids already matched with the viewer. */
  connectedUserIds: string[];
}

export const EMPTY_VIEWER_CONTEXT: ViewerContext = {
  blockedUserIds: [],
  recentlyDecidedUserIds: [],
  connectedUserIds: [],
};

/** Intentions that only make sense when both sides declare them. */
const MUTUALLY_REQUIRED_INTENTIONS = new Set(['language_practice']);

function intentionsCompatible(a: MatchingProfile, b: MatchingProfile): boolean {
  const shared = a.intentions.filter((intention) => b.intentions.includes(intention));
  if (shared.length > 0) return true;

  // No shared intention: still compatible unless either side declared only
  // intentions that require the same intention on the other side.
  const aStrict = a.intentions.every((i) => MUTUALLY_REQUIRED_INTENTIONS.has(i));
  const bStrict = b.intentions.every((i) => MUTUALLY_REQUIRED_INTENTIONS.has(i));
  return !aStrict && !bStrict;
}

function availabilityOverlaps(a: MatchingProfile, b: MatchingProfile): boolean {
  return a.availability.some((slot) =>
    b.availability.some((other) => other.weekday === slot.weekday && other.block === slot.block),
  );
}

function agePreferenceSatisfied(viewer: MatchingProfile, candidate: MatchingProfile): boolean {
  const viewerAccepts =
    candidate.age >= viewer.discovery.minAge && candidate.age <= viewer.discovery.maxAge;
  const candidateAccepts =
    viewer.age >= candidate.discovery.minAge && viewer.age <= candidate.discovery.maxAge;
  return viewerAccepts && candidateAccepts;
}

/**
 * Hard filters, applied before scoring. Returns `null` when the candidate is
 * eligible, otherwise the first reason it was excluded.
 *
 * Distance and age must satisfy BOTH sides: a candidate is never shown a viewer
 * who falls outside the candidate's own stated preferences.
 */
export function filterCandidate(
  viewer: MatchingProfile,
  candidate: MatchingProfile,
  context: ViewerContext = EMPTY_VIEWER_CONTEXT,
): FilterReason | null {
  if (candidate.userId === viewer.userId) return 'self';
  if (candidate.accountStatus !== 'active') return 'inactive_account';
  if (!candidate.profileComplete) return 'incomplete_profile';
  if (context.blockedUserIds.includes(candidate.userId)) return 'blocked';
  if (context.connectedUserIds.includes(candidate.userId)) return 'already_connected';
  if (context.recentlyDecidedUserIds.includes(candidate.userId)) return 'recently_decided';

  const km = distanceKm(viewer.location, candidate.location);
  if (km > viewer.discovery.maxDistanceKm || km > candidate.discovery.maxDistanceKm) {
    return 'distance';
  }

  if (!agePreferenceSatisfied(viewer, candidate)) return 'age_preference';

  const sharedLanguage = viewer.languages.some((lang) => candidate.languages.includes(lang));
  if (!sharedLanguage) return 'language';

  if (!intentionsCompatible(viewer, candidate)) return 'intention';
  if (!availabilityOverlaps(viewer, candidate)) return 'availability';

  return null;
}
