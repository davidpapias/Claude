import type { AvailabilitySlot, MatchingProfile, Weekday } from '@circulo/types';

/**
 * Profile builder shared by tests, the compare CLI and the seed generator so all
 * three exercise the same shape.
 */
export function makeProfile(overrides: Partial<MatchingProfile> & { userId: string }): MatchingProfile {
  return {
    age: 30,
    location: { areaLabel: 'Roma Norte, CDMX', lat: 19.4, lon: -99.16 },
    languages: ['es'],
    intentions: ['expand_circle'],
    interests: ['cine', 'caminatas'],
    availability: [
      { weekday: 6, block: 'afternoon' },
      { weekday: 0, block: 'morning' },
    ],
    social: {
      socialEnergy: 'mixed',
      warmUpSpeed: 'in_between',
      groupPreference: 'small_group',
      contactFrequency: 'few_times_week',
      communicationStyles: ['short_messages'],
      spontaneity: 'flexible',
      planPreference: 'mixed',
      alcoholPreference: 'no_preference',
    },
    discovery: { maxDistanceKm: 25, minAge: 18, maxAge: 99 },
    createdAt: '2025-01-01T00:00:00.000Z',
    profileComplete: true,
    accountStatus: 'active',
    ...overrides,
  };
}

export function slots(...pairs: Array<[Weekday, AvailabilitySlot['block']]>): AvailabilitySlot[] {
  return pairs.map(([weekday, block]) => ({ weekday, block }));
}
