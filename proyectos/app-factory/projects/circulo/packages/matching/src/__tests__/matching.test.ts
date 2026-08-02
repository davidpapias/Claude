import { describe, expect, it } from 'vitest';
import type { MatchingProfile } from '@circulo/types';
import { makeProfile, slots } from '../fixtures.js';
import { filterCandidate } from '../filters.js';
import { scorePair, WEIGHTS } from '../scoring.js';
import { buildExplanations } from '../explanations.js';
import { computeExposureAdjustment } from '../exposure.js';
import { ProtectedAttributeError, recommend } from '../recommend.js';
import { buildConversationStarters } from '../starters.js';
import { distanceKm } from '../geo.js';

const SEED = 'test-seed';

describe('weights', () => {
  it('sum to 100', () => {
    const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });
});

describe('hard filters', () => {
  const viewer = makeProfile({ userId: 'viewer' });

  it('accepts a compatible candidate', () => {
    expect(filterCandidate(viewer, makeProfile({ userId: 'a' }))).toBeNull();
  });

  it('never returns the viewer', () => {
    expect(filterCandidate(viewer, viewer)).toBe('self');
  });

  it('excludes suspended accounts', () => {
    const candidate = makeProfile({ userId: 'a', accountStatus: 'suspended' });
    expect(filterCandidate(viewer, candidate)).toBe('inactive_account');
  });

  it('excludes incomplete profiles', () => {
    const candidate = makeProfile({ userId: 'a', profileComplete: false });
    expect(filterCandidate(viewer, candidate)).toBe('incomplete_profile');
  });

  it('excludes blocked users in either direction', () => {
    const candidate = makeProfile({ userId: 'blocked-one' });
    expect(filterCandidate(viewer, candidate, { blockedUserIds: ['blocked-one'], recentlyDecidedUserIds: [], connectedUserIds: [] })).toBe('blocked');
  });

  it('excludes users already decided on', () => {
    const candidate = makeProfile({ userId: 'seen' });
    expect(filterCandidate(viewer, candidate, { blockedUserIds: [], recentlyDecidedUserIds: ['seen'], connectedUserIds: [] })).toBe('recently_decided');
  });

  it('excludes users already connected', () => {
    const candidate = makeProfile({ userId: 'friend' });
    expect(filterCandidate(viewer, candidate, { blockedUserIds: [], recentlyDecidedUserIds: [], connectedUserIds: ['friend'] })).toBe('already_connected');
  });

  it('respects the distance limit of both sides', () => {
    const far = makeProfile({
      userId: 'far',
      location: { areaLabel: 'Toluca', lat: 19.29, lon: -99.65 },
    });
    expect(distanceKm(viewer.location, far.location)).toBeGreaterThan(25);
    expect(filterCandidate(viewer, far)).toBe('distance');

    const narrowViewer = makeProfile({ userId: 'viewer', discovery: { maxDistanceKm: 100, minAge: 18, maxAge: 99 } });
    const narrowCandidate = makeProfile({
      userId: 'narrow',
      location: { areaLabel: 'Toluca', lat: 19.29, lon: -99.65 },
      discovery: { maxDistanceKm: 5, minAge: 18, maxAge: 99 },
    });
    expect(filterCandidate(narrowViewer, narrowCandidate)).toBe('distance');
  });

  it('requires a shared language', () => {
    const candidate = makeProfile({ userId: 'a', languages: ['de'] });
    expect(filterCandidate(viewer, candidate)).toBe('language');
  });

  it('requires both age preferences to be satisfied', () => {
    const older = makeProfile({ userId: 'older', age: 60 });
    const picky = makeProfile({ userId: 'viewer', discovery: { maxDistanceKm: 25, minAge: 18, maxAge: 40 } });
    expect(filterCandidate(picky, older)).toBe('age_preference');

    const candidateWantsOlder = makeProfile({
      userId: 'a',
      discovery: { maxDistanceKm: 25, minAge: 45, maxAge: 99 },
    });
    expect(filterCandidate(viewer, candidateWantsOlder)).toBe('age_preference');
  });

  it('requires overlapping availability', () => {
    const candidate = makeProfile({ userId: 'a', availability: slots([2, 'morning']) });
    expect(filterCandidate(viewer, candidate)).toBe('availability');
  });

  it('excludes language-practice-only profiles when the viewer does not want it', () => {
    const candidate = makeProfile({ userId: 'a', intentions: ['language_practice'] });
    expect(filterCandidate(viewer, candidate)).toBe('intention');
  });
});

describe('scoring', () => {
  it('is symmetric', () => {
    const a = makeProfile({ userId: 'a', interests: ['cine', 'museos'] });
    const b = makeProfile({ userId: 'b', interests: ['cine', 'correr'], social: { ...a.social, socialEnergy: 'active' } });
    expect(scorePair(a, b).score).toBe(scorePair(b, a).score);
  });

  it('gives a high score to two closely aligned profiles', () => {
    const base: Partial<MatchingProfile> = {
      intentions: ['new_in_city', 'close_friendship'],
      interests: ['cine', 'caminatas', 'cafe', 'museos', 'libros'],
      availability: slots([6, 'afternoon'], [0, 'morning'], [3, 'evening'], [5, 'evening']),
      languages: ['es', 'en'],
    };
    const a = makeProfile({ userId: 'a', ...base });
    const b = makeProfile({ userId: 'b', ...base });
    expect(scorePair(a, b).score).toBeGreaterThan(90);
  });

  it('gives a low score to two misaligned profiles', () => {
    const a = makeProfile({
      userId: 'a',
      intentions: ['close_friendship'],
      interests: ['cine'],
      availability: slots([6, 'afternoon']),
      social: {
        socialEnergy: 'calm',
        warmUpSpeed: 'needs_time',
        groupPreference: 'one_on_one',
        contactFrequency: 'daily',
        communicationStyles: ['long_messages'],
        spontaneity: 'plans_ahead',
        planPreference: 'calm',
        alcoholPreference: 'prefers_alcohol_free',
      },
    });
    const b = makeProfile({
      userId: 'b',
      intentions: ['casual_meetups'],
      interests: ['motos'],
      availability: slots([6, 'afternoon']),
      location: { areaLabel: 'Lejos', lat: 19.55, lon: -99.05 },
      social: {
        socialEnergy: 'active',
        warmUpSpeed: 'opens_quickly',
        groupPreference: 'many_people',
        contactFrequency: 'occasional',
        communicationStyles: ['meet_soon'],
        spontaneity: 'spontaneous',
        planPreference: 'active',
        alcoholPreference: 'fine_with_alcohol',
      },
    });
    expect(scorePair(a, b).score).toBeLessThan(35);
  });

  it('breaks the score down into components that add up to the total', () => {
    const a = makeProfile({ userId: 'a' });
    const b = makeProfile({ userId: 'b', interests: ['cine'] });
    const { score, breakdown } = scorePair(a, b);
    const sum = breakdown.reduce((total, part) => total + part.earned, 0);
    expect(Math.abs(sum - score)).toBeLessThan(0.05);
    expect(breakdown).toHaveLength(8);
    for (const part of breakdown) {
      expect(part.earned).toBeLessThanOrEqual(part.max);
      expect(part.earned).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('explanations', () => {
  it('produces between one and three concrete reasons', () => {
    const a = makeProfile({ userId: 'a', intentions: ['new_in_city'], interests: ['cine', 'cafe'] });
    const b = makeProfile({ userId: 'b', intentions: ['new_in_city'], interests: ['cine', 'cafe'] });
    const reasons = buildExplanations(a, b);
    expect(reasons.length).toBeGreaterThanOrEqual(1);
    expect(reasons.length).toBeLessThanOrEqual(3);
  });

  it('never claims psychological compatibility or a percentage', () => {
    const a = makeProfile({ userId: 'a' });
    const b = makeProfile({ userId: 'b' });
    for (const reason of buildExplanations(a, b)) {
      expect(reason.text).not.toMatch(/%|compatibilidad psicológica|personalidad ideal/i);
    }
  });

  it('uses interest labels when provided', () => {
    const a = makeProfile({ userId: 'a', interests: ['cine'] });
    const b = makeProfile({ userId: 'b', interests: ['cine'] });
    const reasons = buildExplanations(a, b, { interestLabels: { cine: 'cine independiente' } });
    expect(reasons.some((r) => r.text.includes('cine independiente'))).toBe(true);
  });
});

describe('exposure fairness', () => {
  const signals = { recentImpressions: 0, createdAt: new Date().toISOString() };

  it('boosts new profiles with few impressions', () => {
    const adjustment = computeExposureAdjustment(SEED, 'viewer', 'new-user', signals);
    expect(adjustment.newUserBoost).toBeGreaterThan(0);
  });

  it('penalizes heavily over-exposed profiles', () => {
    const adjustment = computeExposureAdjustment(SEED, 'viewer', 'popular', {
      recentImpressions: 600,
      createdAt: '2024-01-01T00:00:00.000Z',
    });
    expect(adjustment.overExposurePenalty).toBeGreaterThan(0);
    expect(adjustment.overExposurePenalty).toBeLessThanOrEqual(8);
    expect(adjustment.newUserBoost).toBe(0);
  });

  it('penalizes spam-flagged accounts hard', () => {
    const adjustment = computeExposureAdjustment(SEED, 'viewer', 'spammer', {
      recentImpressions: 10,
      createdAt: '2024-01-01T00:00:00.000Z',
      spamFlagged: true,
    });
    expect(adjustment.total).toBeLessThan(-20);
  });

  it('is deterministic for the same seed', () => {
    const first = computeExposureAdjustment(SEED, 'viewer', 'candidate', signals);
    const second = computeExposureAdjustment(SEED, 'viewer', 'candidate', signals);
    expect(first.explorationBonus).toBe(second.explorationBonus);
  });
});

describe('recommend pipeline', () => {
  const viewer = makeProfile({ userId: 'viewer', interests: ['cine', 'cafe', 'caminatas'] });
  const candidates = Array.from({ length: 12 }, (_, i) =>
    makeProfile({
      userId: `user-${i}`,
      interests: i % 2 === 0 ? ['cine', 'cafe'] : ['cine'],
      intentions: i % 3 === 0 ? ['expand_circle', 'new_in_city'] : ['expand_circle'],
    }),
  );

  it('is deterministic for the same seed', () => {
    const first = recommend(viewer, candidates, { seed: SEED });
    const second = recommend(viewer, candidates, { seed: SEED });
    expect(first.recommendations.map((r) => r.userId)).toEqual(
      second.recommendations.map((r) => r.userId),
    );
  });

  it('produces a different order for a different seed', () => {
    const a = recommend(viewer, candidates, { seed: 'seed-a' });
    const b = recommend(viewer, candidates, { seed: 'seed-b' });
    expect(a.recommendations.map((r) => r.userId)).not.toEqual(b.recommendations.map((r) => r.userId));
  });

  it('records why each excluded candidate was excluded', () => {
    const blocked = makeProfile({ userId: 'blocked' });
    const batch = recommend(viewer, [...candidates, blocked], {
      seed: SEED,
      context: { blockedUserIds: ['blocked'], recentlyDecidedUserIds: [], connectedUserIds: [] },
    });
    expect(batch.filtered).toContainEqual({ userId: 'blocked', reason: 'blocked' });
    expect(batch.recommendations.some((r) => r.userId === 'blocked')).toBe(false);
  });

  it('always attaches at least one explanation to every recommendation', () => {
    const batch = recommend(viewer, candidates, { seed: SEED });
    expect(batch.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of batch.recommendations) {
      expect(recommendation.explanations.length).toBeGreaterThanOrEqual(1);
      expect(recommendation.explanations.length).toBeLessThanOrEqual(3);
    }
  });

  it('respects the limit', () => {
    const batch = recommend(viewer, candidates, { seed: SEED, limit: 5 });
    expect(batch.recommendations).toHaveLength(5);
  });

  it('rejects protected attributes reaching the ranking layer', () => {
    const tainted = { ...makeProfile({ userId: 'tainted' }), religion: 'any' } as never;
    expect(() => recommend(viewer, [tainted], { seed: SEED })).toThrow(ProtectedAttributeError);
  });

  it('spreads exposure instead of always ranking the same profile first', () => {
    const heavilyShown = candidates[0]!;
    const withoutExposure = recommend(viewer, candidates, { seed: SEED });
    const withExposure = recommend(viewer, candidates, {
      seed: SEED,
      exposure: {
        [heavilyShown.userId]: { recentImpressions: 900, createdAt: heavilyShown.createdAt },
      },
    });
    const before = withoutExposure.recommendations.findIndex((r) => r.userId === heavilyShown.userId);
    const after = withExposure.recommendations.findIndex((r) => r.userId === heavilyShown.userId);
    expect(after).toBeGreaterThan(before);
  });

  it('does not recommend anyone when nobody passes the filters', () => {
    const batch = recommend(viewer, [makeProfile({ userId: 'a', languages: ['ja'] })], { seed: SEED });
    expect(batch.recommendations).toHaveLength(0);
    expect(batch.filtered).toEqual([{ userId: 'a', reason: 'language' }]);
  });
});

describe('conversation starters', () => {
  it('builds starters from what two people share', () => {
    const a = makeProfile({ userId: 'a', intentions: ['new_in_city'], interests: ['cine'] });
    const b = makeProfile({ userId: 'b', intentions: ['new_in_city'], interests: ['cine'] });
    const starters = buildConversationStarters(a, b, { interestLabels: { cine: 'Cine' } });
    expect(starters).toHaveLength(3);
    expect(starters[0]).toContain('cine');
    expect(starters.some((s) => s.includes('ciudad'))).toBe(true);
  });

  it('falls back to generic questions when nothing is shared', () => {
    const a = makeProfile({ userId: 'a', interests: ['cine'], intentions: ['casual_meetups'] });
    const b = makeProfile({ userId: 'b', interests: ['motos'], intentions: ['expand_circle'] });
    const starters = buildConversationStarters(a, b);
    expect(starters.length).toBeGreaterThan(0);
  });

  it('never uses romantic language', () => {
    const a = makeProfile({ userId: 'a' });
    const b = makeProfile({ userId: 'b' });
    for (const starter of buildConversationStarters(a, b)) {
      expect(starter).not.toMatch(/cita|romántic|pareja|amor/i);
    }
  });
});
