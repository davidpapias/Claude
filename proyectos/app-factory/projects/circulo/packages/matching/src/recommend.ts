import type {
  FilteredCandidate,
  MatchingProfile,
  Recommendation,
  RecommendationBatch,
} from '@circulo/types';
import { EMPTY_VIEWER_CONTEXT, filterCandidate, type ViewerContext } from './filters';
import { buildExplanations, type ExplanationOptions } from './explanations';
import { computeExposureAdjustment, type ExposureSignals } from './exposure';
import { scorePair } from './scoring';

/**
 * Keys that must never influence ranking. Present in profile display data, not
 * in matching data. Enforced at runtime so a future field addition cannot leak
 * a protected attribute into the score.
 */
export const PROTECTED_KEYS = [
  'gender',
  'genderIdentity',
  'pronouns',
  'ethnicity',
  'race',
  'religion',
  'sexualOrientation',
  'orientation',
  'disability',
  'health',
  'healthConditions',
  'diagnosis',
  'politicalAffiliation',
  'nationality',
  'immigrationStatus',
] as const;

export class ProtectedAttributeError extends Error {
  constructor(key: string) {
    super(`Protected attribute "${key}" must not reach the matching layer.`);
    this.name = 'ProtectedAttributeError';
  }
}

export function assertNoProtectedAttributes(profile: MatchingProfile): void {
  for (const key of Object.keys(profile)) {
    if ((PROTECTED_KEYS as readonly string[]).includes(key)) {
      throw new ProtectedAttributeError(key);
    }
  }
}

export interface RecommendOptions extends ExplanationOptions {
  seed: string;
  limit?: number;
  context?: ViewerContext;
  /** Exposure signals per candidate id. Missing entries are treated as zero. */
  exposure?: Record<string, ExposureSignals>;
  now?: Date;
  /** Candidates below this raw score are not shown at all. */
  minimumScore?: number;
}

export const DEFAULT_MINIMUM_SCORE = 25;
export const DEFAULT_LIMIT = 20;

/**
 * Full pipeline: hard filters → score → explanations → exposure adjustment →
 * deterministic ordering. Same inputs and same seed always produce the same batch.
 */
export function recommend(
  viewer: MatchingProfile,
  candidates: MatchingProfile[],
  options: RecommendOptions,
): RecommendationBatch {
  assertNoProtectedAttributes(viewer);

  const context = options.context ?? EMPTY_VIEWER_CONTEXT;
  const limit = options.limit ?? DEFAULT_LIMIT;
  const minimumScore = options.minimumScore ?? DEFAULT_MINIMUM_SCORE;
  const now = options.now ?? new Date();

  const filtered: FilteredCandidate[] = [];
  const scored: Array<Recommendation & { rank: number }> = [];

  for (const candidate of candidates) {
    assertNoProtectedAttributes(candidate);

    const reason = filterCandidate(viewer, candidate, context);
    if (reason) {
      filtered.push({ userId: candidate.userId, reason });
      continue;
    }

    const { score, breakdown } = scorePair(viewer, candidate);
    if (score < minimumScore) {
      filtered.push({ userId: candidate.userId, reason: 'intention' });
      continue;
    }

    const explanations = buildExplanations(viewer, candidate, options);
    if (explanations.length === 0) {
      // Nothing concrete to say: do not present it as a recommendation.
      filtered.push({ userId: candidate.userId, reason: 'intention' });
      continue;
    }

    const signals = options.exposure?.[candidate.userId] ?? {
      recentImpressions: 0,
      createdAt: candidate.createdAt,
    };
    const adjustment = computeExposureAdjustment(
      options.seed,
      viewer.userId,
      candidate.userId,
      signals,
      now,
    );

    scored.push({
      userId: candidate.userId,
      score,
      breakdown,
      explanations,
      explorationBonus: round2(adjustment.explorationBonus),
      rank: score + adjustment.total,
    });
  }

  scored.sort((a, b) => (b.rank !== a.rank ? b.rank - a.rank : a.userId.localeCompare(b.userId)));

  return {
    viewerId: viewer.userId,
    seed: options.seed,
    recommendations: scored.slice(0, limit).map(({ rank: _rank, ...rest }) => rest),
    filtered,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
