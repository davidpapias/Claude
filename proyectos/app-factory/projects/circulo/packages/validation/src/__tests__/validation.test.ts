import { describe, expect, it } from 'vitest';
import {
  ageFromBirthDate,
  identityStepSchema,
  messageSchema,
  photoUploadSchema,
  reportSchema,
  signUpSchema,
  distanceStepSchema,
} from '../index.js';

const TODAY = new Date('2026-01-01T00:00:00.000Z');

describe('age', () => {
  it('computes age from a birth date', () => {
    expect(ageFromBirthDate('2000-01-01', TODAY)).toBe(26);
    expect(ageFromBirthDate('2000-12-31', TODAY)).toBe(25);
  });

  it('rejects a user under 18', () => {
    const minor = new Date().getUTCFullYear() - 15;
    const result = identityStepSchema.safeParse({
      displayName: 'Ana',
      birthDate: `${minor}-01-01`,
      areaLabel: 'Roma Norte',
      languages: ['es'],
    });
    expect(result.success).toBe(false);
  });
});

describe('sign up', () => {
  it('requires age confirmation and terms', () => {
    const result = signUpSchema.safeParse({
      email: 'a@example.com',
      password: 'contraseña-larga',
      ageConfirmed: false,
      termsAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it('normalizes the email', () => {
    const result = signUpSchema.parse({
      email: '  Ana@Example.COM ',
      password: 'contraseña-larga',
      ageConfirmed: true,
      termsAccepted: true,
    });
    expect(result.email).toBe('ana@example.com');
  });
});

describe('messages', () => {
  it('rejects an empty message', () => {
    expect(
      messageSchema.safeParse({ conversationId: crypto.randomUUID(), body: '   ' }).success,
    ).toBe(false);
  });

  it('rejects a message over the limit', () => {
    expect(
      messageSchema.safeParse({ conversationId: crypto.randomUUID(), body: 'x'.repeat(2001) })
        .success,
    ).toBe(false);
  });
});

describe('photos', () => {
  it('rejects an unsupported mime type', () => {
    expect(photoUploadSchema.safeParse({ mimeType: 'image/gif', sizeBytes: 100, position: 0 }).success).toBe(false);
  });

  it('rejects an oversized file', () => {
    expect(
      photoUploadSchema.safeParse({ mimeType: 'image/jpeg', sizeBytes: 9_000_000, position: 0 })
        .success,
    ).toBe(false);
  });
});

describe('reports', () => {
  it('accepts every documented category', () => {
    const result = reportSchema.safeParse({
      reportedUserId: crypto.randomUUID(),
      category: 'unsolicited_sexual_content',
      details: 'Mensajes insistentes.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown category', () => {
    expect(
      reportSchema.safeParse({ reportedUserId: crypto.randomUUID(), category: 'whatever' }).success,
    ).toBe(false);
  });
});

describe('discovery preferences', () => {
  it('rejects an inverted age range', () => {
    expect(distanceStepSchema.safeParse({ maxDistanceKm: 20, minAge: 40, maxAge: 25 }).success).toBe(false);
  });

  it('accepts a valid range', () => {
    expect(distanceStepSchema.safeParse({ maxDistanceKm: 20, minAge: 25, maxAge: 40 }).success).toBe(true);
  });
});
