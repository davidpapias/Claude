import { pairJitter } from './rng';

/**
 * Exposure fairness. Ordering must not collapse onto the same profiles: a
 * candidate who has already been shown a lot is nudged down, a candidate who is
 * new is nudged up, and a small deterministic jitter breaks ties.
 *
 * None of these adjustments read likes, matches or any popularity count.
 */

export const EXPLORATION_MAX_POINTS = 4;
export const NEW_USER_BOOST_POINTS = 6;
export const MAX_OVER_EXPOSURE_PENALTY = 8;
export const SPAM_PENALTY_POINTS = 25;

/** Impressions in the trailing window before the penalty starts. */
export const IMPRESSION_SOFT_CAP = 60;
/** New users keep the boost for this long, or until the impression floor is met. */
export const NEW_USER_WINDOW_DAYS = 14;
export const NEW_USER_IMPRESSION_FLOOR = 25;

export interface ExposureSignals {
  /** Impressions the candidate received in the trailing 7 days. */
  recentImpressions: number;
  /** Candidate account creation timestamp (ISO 8601). */
  createdAt: string;
  /** Set by the spam heuristics in the safety layer. */
  spamFlagged?: boolean;
}

export interface ExposureAdjustment {
  explorationBonus: number;
  newUserBoost: number;
  overExposurePenalty: number;
  spamPenalty: number;
  total: number;
}

function daysSince(iso: string, now: Date): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  return (now.getTime() - then) / 86_400_000;
}

export function computeExposureAdjustment(
  seed: string,
  viewerId: string,
  candidateId: string,
  signals: ExposureSignals,
  now: Date = new Date(),
): ExposureAdjustment {
  const explorationBonus = pairJitter(seed, viewerId, candidateId) * EXPLORATION_MAX_POINTS;

  const age = daysSince(signals.createdAt, now);
  const isNew = age <= NEW_USER_WINDOW_DAYS && signals.recentImpressions < NEW_USER_IMPRESSION_FLOOR;
  const newUserBoost = isNew
    ? NEW_USER_BOOST_POINTS * (1 - signals.recentImpressions / NEW_USER_IMPRESSION_FLOOR)
    : 0;

  const excess = Math.max(0, signals.recentImpressions - IMPRESSION_SOFT_CAP);
  const overExposurePenalty = Math.min(
    MAX_OVER_EXPOSURE_PENALTY,
    Math.log2(1 + excess / IMPRESSION_SOFT_CAP) * MAX_OVER_EXPOSURE_PENALTY,
  );

  const spamPenalty = signals.spamFlagged ? SPAM_PENALTY_POINTS : 0;

  return {
    explorationBonus,
    newUserBoost,
    overExposurePenalty,
    spamPenalty,
    total: explorationBonus + newUserBoost - overExposurePenalty - spamPenalty,
  };
}
