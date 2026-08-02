/**
 * Centralized configuration, design tokens and product copy.
 * No secrets here — only public, non-sensitive values.
 */

export interface AppEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appName: string;
  minAge: number;
  analyticsEnabled: boolean;
}

class MissingEnvError extends Error {
  constructor(key: string) {
    super(`Missing environment variable: ${key}. Copy .env.example to .env.`);
    this.name = 'MissingEnvError';
  }
}

function required(record: Record<string, string | undefined>, key: string): string {
  const value = record[key];
  if (!value) throw new MissingEnvError(key);
  return value;
}

/** Reads the mobile (EXPO_PUBLIC_*) or admin (NEXT_PUBLIC_*) environment. */
export function readEnv(
  source: Record<string, string | undefined>,
  prefix: 'EXPO_PUBLIC' | 'NEXT_PUBLIC',
): AppEnv {
  return {
    supabaseUrl: required(source, `${prefix}_SUPABASE_URL`),
    supabaseAnonKey: required(source, `${prefix}_SUPABASE_ANON_KEY`),
    appName: source[`${prefix}_APP_NAME`] ?? 'Círculo',
    minAge: Number(source[`${prefix}_MIN_AGE`] ?? 18),
    analyticsEnabled: (source[`${prefix}_ANALYTICS_ENABLED`] ?? 'false') === 'true',
  };
}

// --- Design tokens --------------------------------------------------------
// Warm, calm, non-romantic. No red/pink romance palette, no hearts.

export const colors = {
  light: {
    background: '#FBF8F4',
    surface: '#FFFFFF',
    surfaceMuted: '#F2EDE6',
    border: '#E3DBD1',
    text: '#231F1B',
    textMuted: '#6B625A',
    primary: '#1F6F63', // deep teal — conversation, not romance
    primaryText: '#FFFFFF',
    accent: '#E08A3C', // warm amber for highlights
    success: '#2E7D53',
    warning: '#B4690E',
    danger: '#B3261E',
    focus: '#1F6F63',
  },
  dark: {
    background: '#16130F',
    surface: '#211C17',
    surfaceMuted: '#2B241D',
    border: '#3B332B',
    text: '#F5EFE8',
    textMuted: '#B9AFA4',
    primary: '#6FD3C0',
    primaryText: '#0E2A26',
    accent: '#F0A55E',
    success: '#7ED4A2',
    warning: '#E5B168',
    danger: '#F2B8B5',
    focus: '#6FD3C0',
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ColorToken = keyof (typeof colors)['light'];

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radii = { sm: 8, md: 14, lg: 22, pill: 999 } as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  subtitle: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
} as const;

export const shadows = {
  card: {
    shadowColor: '#231F1B',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
} as const;

/** iOS and Android minimum touch target. */
export const MIN_TOUCH_TARGET = 44;

// --- Product limits -------------------------------------------------------

export const limits = {
  dailyDecisions: 60,
  messagesPerMinute: 20,
  reportsPerDay: 20,
  decisionsPerMinute: 30,
  recommendationBatchSize: 20,
  /** A pass hides that profile from discovery for this long. */
  passCooldownDays: 30,
} as const;

// --- Feature flags (defaults; the database `feature_flags` table wins) ------

export const defaultFeatureFlags = {
  conversationReminders: true,
  photoModerationQueue: true,
  identityVerification: false,
  premiumFilters: false,
  travelMode: false,
} as const;

export type FeatureFlag = keyof typeof defaultFeatureFlags;

// --- Copy -----------------------------------------------------------------

export const safetyTips = [
  'Queden en un lugar público la primera vez.',
  'Cuéntale a alguien de confianza dónde estarás.',
  'Llega y regresa por tu cuenta si puedes.',
  'No compartas datos bancarios ni envíes dinero.',
  'Si algo te incomoda, puedes terminar el encuentro en cualquier momento.',
] as const;

/** Fallbacks when a match shares nothing specific enough for a tailored opener. */
export const genericConversationStarters = [
  '¿Qué te ha gustado de tu zona últimamente?',
  '¿Cómo suele ser tu fin de semana ideal?',
  '¿Qué te gustaría hacer más seguido y casi nunca haces?',
] as const;

export const INTEREST_CATALOG = [
  { slug: 'cine', label: 'Cine', category: 'cultura' },
  { slug: 'series', label: 'Series', category: 'cultura' },
  { slug: 'libros', label: 'Libros', category: 'cultura' },
  { slug: 'museos', label: 'Museos', category: 'cultura' },
  { slug: 'musica-en-vivo', label: 'Música en vivo', category: 'cultura' },
  { slug: 'teatro', label: 'Teatro', category: 'cultura' },
  { slug: 'cafe', label: 'Cafeterías', category: 'social' },
  { slug: 'cocinar', label: 'Cocinar', category: 'social' },
  { slug: 'juegos-de-mesa', label: 'Juegos de mesa', category: 'social' },
  { slug: 'videojuegos', label: 'Videojuegos', category: 'social' },
  { slug: 'caminatas', label: 'Caminatas', category: 'aire-libre' },
  { slug: 'ciclismo', label: 'Ciclismo', category: 'aire-libre' },
  { slug: 'correr', label: 'Correr', category: 'aire-libre' },
  { slug: 'senderismo', label: 'Senderismo', category: 'aire-libre' },
  { slug: 'natacion', label: 'Natación', category: 'aire-libre' },
  { slug: 'gimnasio', label: 'Gimnasio', category: 'bienestar' },
  { slug: 'yoga', label: 'Yoga', category: 'bienestar' },
  { slug: 'meditacion', label: 'Meditación', category: 'bienestar' },
  { slug: 'fotografia', label: 'Fotografía', category: 'creatividad' },
  { slug: 'dibujo', label: 'Dibujo y pintura', category: 'creatividad' },
  { slug: 'escritura', label: 'Escritura', category: 'creatividad' },
  { slug: 'musica-tocar', label: 'Tocar un instrumento', category: 'creatividad' },
  { slug: 'idiomas', label: 'Idiomas', category: 'aprendizaje' },
  { slug: 'tecnologia', label: 'Tecnología', category: 'aprendizaje' },
  { slug: 'ciencia', label: 'Ciencia', category: 'aprendizaje' },
  { slug: 'emprender', label: 'Emprender', category: 'aprendizaje' },
  { slug: 'voluntariado', label: 'Voluntariado', category: 'comunidad' },
  { slug: 'mascotas', label: 'Mascotas', category: 'comunidad' },
  { slug: 'jardineria', label: 'Jardinería', category: 'comunidad' },
  { slug: 'viajes', label: 'Viajes', category: 'comunidad' },
] as const;

export const interestLabels: Record<string, string> = Object.fromEntries(
  INTEREST_CATALOG.map((interest) => [interest.slug, interest.label]),
);
