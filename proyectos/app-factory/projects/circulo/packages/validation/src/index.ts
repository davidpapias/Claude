import { z } from 'zod';
import {
  ALCOHOL_PREFERENCE,
  COMMUNICATION_STYLE,
  CONTACT_FREQUENCY,
  DAY_BLOCKS,
  FRIENDSHIP_INTENTIONS,
  GROUP_PREFERENCE,
  MATCH_FEEDBACK,
  PLAN_PREFERENCE,
  REPORT_CATEGORIES,
  SOCIAL_ENERGY,
  SPONTANEITY,
  WARM_UP_SPEED,
} from '@circulo/types';

/**
 * Single source of truth for input validation. The mobile app, the admin panel
 * and the database functions all validate against these rules; the database
 * additionally enforces them with constraints, because a client check is not a
 * security control.
 */

export const MIN_AGE = 18;
export const MAX_AGE = 120;
export const MAX_PHOTOS = 6;
export const MAX_BIO_LENGTH = 500;
export const MAX_MESSAGE_LENGTH = 2000;
export const MIN_INTERESTS = 3;
export const MAX_INTERESTS = 15;

export const emailSchema = z.string().trim().toLowerCase().email('Escribe un correo válido.');

export const passwordSchema = z
  .string()
  .min(10, 'Usa al menos 10 caracteres.')
  .max(128, 'Máximo 128 caracteres.');

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  ageConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'Debes confirmar que tienes 18 años o más.' }),
  }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar los términos para continuar.' }),
  }),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Escribe tu contraseña.'),
});

export const resetPasswordSchema = z.object({ email: emailSchema });

export const identityStepSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Escribe cómo quieres que te llamen.')
    .max(40, 'Máximo 40 caracteres.'),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD.')
    .refine((value) => ageFromBirthDate(value) >= MIN_AGE, {
      message: `Debes tener al menos ${MIN_AGE} años para usar la aplicación.`,
    })
    .refine((value) => ageFromBirthDate(value) <= MAX_AGE, { message: 'Revisa tu fecha de nacimiento.' }),
  pronouns: z.string().trim().max(30).optional().nullable(),
  areaLabel: z.string().trim().min(2, 'Indica tu zona o ciudad.').max(80),
  languages: z.array(z.string().min(2).max(10)).min(1, 'Elige al menos un idioma.').max(6),
  lifeStage: z.string().trim().max(60).optional().nullable(),
});

export function ageFromBirthDate(birthDate: string, today: Date = new Date()): number {
  const birth = new Date(`${birthDate}T00:00:00.000Z`);
  if (Number.isNaN(birth.getTime())) return -1;
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = today.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

export const bioStepSchema = z.object({
  bio: z
    .string()
    .trim()
    .min(40, 'Cuenta un poco más: al menos 40 caracteres ayudan a recibir mejores mensajes.')
    .max(MAX_BIO_LENGTH, `Máximo ${MAX_BIO_LENGTH} caracteres.`),
  conversationTopics: z.array(z.string().trim().min(2).max(40)).max(8).default([]),
  wantsToTry: z.array(z.string().trim().min(2).max(40)).max(8).default([]),
});

export const intentionsStepSchema = z.object({
  intentions: z
    .array(z.enum(FRIENDSHIP_INTENTIONS))
    .min(1, 'Elige al menos una intención.')
    .max(4, 'Elige como máximo cuatro para que se entienda tu intención.'),
});

export const interestsStepSchema = z.object({
  interests: z
    .array(z.string().min(1).max(40))
    .min(MIN_INTERESTS, `Elige al menos ${MIN_INTERESTS} intereses.`)
    .max(MAX_INTERESTS, `Máximo ${MAX_INTERESTS}.`),
});

export const socialStyleStepSchema = z.object({
  socialEnergy: z.enum(SOCIAL_ENERGY),
  warmUpSpeed: z.enum(WARM_UP_SPEED),
  groupPreference: z.enum(GROUP_PREFERENCE),
  planPreference: z.enum(PLAN_PREFERENCE),
  spontaneity: z.enum(SPONTANEITY),
  alcoholPreference: z.enum(ALCOHOL_PREFERENCE).default('no_preference'),
});

export const communicationStepSchema = z.object({
  contactFrequency: z.enum(CONTACT_FREQUENCY),
  communicationStyles: z
    .array(z.enum(COMMUNICATION_STYLE))
    .min(1, 'Elige al menos un estilo.')
    .max(4),
});

export const availabilitySlotSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  block: z.enum(DAY_BLOCKS),
});

export const availabilityStepSchema = z.object({
  availability: z
    .array(availabilitySlotSchema)
    .min(1, 'Marca al menos un momento en el que sueles estar libre.')
    .max(21),
});

export const distanceStepSchema = z
  .object({
    maxDistanceKm: z.number().int().min(1).max(200),
    minAge: z.number().int().min(MIN_AGE).max(MAX_AGE),
    maxAge: z.number().int().min(MIN_AGE).max(MAX_AGE),
  })
  .refine((value) => value.maxAge >= value.minAge, {
    message: 'La edad máxima debe ser mayor o igual que la mínima.',
    path: ['maxAge'],
  });

export const boundariesStepSchema = z.object({
  boundaries: z.array(z.string().trim().min(2).max(80)).max(8).default([]),
  friendshipExpectations: z.string().trim().max(300).optional().nullable(),
});

export const messageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z
    .string()
    .trim()
    .min(1, 'Escribe un mensaje.')
    .max(MAX_MESSAGE_LENGTH, `Máximo ${MAX_MESSAGE_LENGTH} caracteres.`),
  replyToId: z.string().uuid().optional().nullable(),
});

export const reportSchema = z.object({
  reportedUserId: z.string().uuid(),
  category: z.enum(REPORT_CATEGORIES),
  details: z.string().trim().max(1000).optional().nullable(),
  conversationId: z.string().uuid().optional().nullable(),
});

export const matchFeedbackSchema = z.object({
  matchId: z.string().uuid(),
  feedback: z.enum(MATCH_FEEDBACK),
});

export const decisionSchema = z.object({
  targetUserId: z.string().uuid(),
  decision: z.enum(['pass', 'interested']),
  /** Client-generated, stable per card, so a double tap cannot create two rows. */
  idempotencyKey: z.string().uuid(),
});

export const photoUploadSchema = z.object({
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
    errorMap: () => ({ message: 'Formato no permitido. Usa JPEG, PNG o WebP.' }),
  }),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(8 * 1024 * 1024, 'La imagen no puede pesar más de 8 MB.'),
  position: z.number().int().min(0).max(MAX_PHOTOS - 1),
});

export const notificationPreferencesSchema = z.object({
  newMatch: z.boolean(),
  newMessage: z.boolean(),
  conversationReminder: z.boolean(),
  securityUpdates: z.literal(true),
  accountUpdates: z.boolean(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type IdentityStepInput = z.infer<typeof identityStepSchema>;
export type SocialStyleStepInput = z.infer<typeof socialStyleStepSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type DecisionInput = z.infer<typeof decisionSchema>;
