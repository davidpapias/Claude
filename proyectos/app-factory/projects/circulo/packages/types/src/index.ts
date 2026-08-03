/**
 * Shared domain types.
 *
 * Rule: nothing in `MatchingProfile` may be a protected attribute. Gender,
 * pronouns, ethnicity, religion, orientation, disability and health data live on
 * `Profile` (for display and self-expression only) and are never passed to the
 * matching package. See docs/matching-system.md.
 */

export type UUID = string;

// --- Catalogs -------------------------------------------------------------

export const FRIENDSHIP_INTENTIONS = [
  'close_friendship',
  'casual_meetups',
  'activity_partner',
  'expand_circle',
  'new_in_city',
  'language_practice',
  'similar_life_stage',
] as const;
export type FriendshipIntention = (typeof FRIENDSHIP_INTENTIONS)[number];

export const SOCIAL_ENERGY = ['calm', 'mixed', 'active'] as const;
export type SocialEnergy = (typeof SOCIAL_ENERGY)[number];

export const WARM_UP_SPEED = ['needs_time', 'in_between', 'opens_quickly'] as const;
export type WarmUpSpeed = (typeof WARM_UP_SPEED)[number];

export const GROUP_PREFERENCE = ['one_on_one', 'small_group', 'flexible', 'many_people'] as const;
export type GroupPreference = (typeof GROUP_PREFERENCE)[number];

export const CONTACT_FREQUENCY = ['daily', 'few_times_week', 'weekly', 'occasional'] as const;
export type ContactFrequency = (typeof CONTACT_FREQUENCY)[number];

export const COMMUNICATION_STYLE = [
  'long_messages',
  'short_messages',
  'voice_notes',
  'meet_soon',
] as const;
export type CommunicationStyle = (typeof COMMUNICATION_STYLE)[number];

export const SPONTANEITY = ['plans_ahead', 'flexible', 'spontaneous'] as const;
export type Spontaneity = (typeof SPONTANEITY)[number];

export const PLAN_PREFERENCE = ['calm', 'mixed', 'active'] as const;
export type PlanPreference = (typeof PLAN_PREFERENCE)[number];

export const ALCOHOL_PREFERENCE = ['no_preference', 'prefers_alcohol_free', 'fine_with_alcohol'] as const;
export type AlcoholPreference = (typeof ALCOHOL_PREFERENCE)[number];

export const DAY_BLOCKS = ['morning', 'afternoon', 'evening'] as const;
export type DayBlock = (typeof DAY_BLOCKS)[number];

/** 0 = Sunday … 6 = Saturday, matching JS `Date#getDay`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface AvailabilitySlot {
  weekday: Weekday;
  block: DayBlock;
}

export const REPORT_CATEGORIES = [
  'harassment',
  'unsolicited_sexual_content',
  'persistent_romantic_intent',
  'hate_speech',
  'threats',
  'impersonation',
  'fake_profile',
  'spam',
  'money_request',
  'unsafe_behavior',
  'minor',
  'other',
] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const MATCH_FEEDBACK = [
  'we_talked',
  'planning_to_meet',
  'we_met',
  'want_to_keep_in_touch',
  'not_compatible',
  'inappropriate_behavior',
] as const;
export type MatchFeedback = (typeof MATCH_FEEDBACK)[number];

export const ACCOUNT_STATUS = ['active', 'suspended', 'banned', 'deleted'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUS)[number];

export const DECISION = ['pass', 'interested'] as const;
export type Decision = (typeof DECISION)[number];

// --- Profiles -------------------------------------------------------------

/** Approximate location. Exact coordinates never leave the server. */
export interface ApproximateLocation {
  /** Human label shown in the UI, e.g. "Coyoacán, CDMX". */
  areaLabel: string;
  /** Rounded to ~1 decimal (≈11 km) before it can ever reach a client. */
  lat: number;
  lon: number;
}

export interface SocialPreferences {
  socialEnergy: SocialEnergy;
  warmUpSpeed: WarmUpSpeed;
  groupPreference: GroupPreference;
  contactFrequency: ContactFrequency;
  communicationStyles: CommunicationStyle[];
  spontaneity: Spontaneity;
  planPreference: PlanPreference;
  alcoholPreference: AlcoholPreference;
}

export interface DiscoveryPreferences {
  maxDistanceKm: number;
  minAge: number;
  maxAge: number;
}

/**
 * The only shape the matching package accepts. Deliberately free of protected
 * attributes and of any popularity signal.
 */
export interface MatchingProfile {
  userId: UUID;
  age: number;
  location: ApproximateLocation;
  languages: string[];
  intentions: FriendshipIntention[];
  interests: string[];
  availability: AvailabilitySlot[];
  social: SocialPreferences;
  discovery: DiscoveryPreferences;
  /** Used only for the new-user exposure floor, never as a quality signal. */
  createdAt: string;
  profileComplete: boolean;
  accountStatus: AccountStatus;
}

export interface ProfilePhoto {
  id: UUID;
  storagePath: string;
  position: number;
  moderationStatus: 'pending' | 'approved' | 'rejected';
}

/** Everything shown on a card or profile screen. */
export interface PublicProfile {
  userId: UUID;
  displayName: string;
  age: number;
  areaLabel: string;
  pronouns: string | null;
  bio: string;
  lifeStage: string | null;
  intentions: FriendshipIntention[];
  interests: string[];
  languages: string[];
  availability: AvailabilitySlot[];
  social: SocialPreferences;
  boundaries: string[];
  conversationTopics: string[];
  wantsToTry: string[];
  photos: ProfilePhoto[];
}

// --- Recommendations ------------------------------------------------------

export type ScoreComponent =
  | 'intention'
  | 'socialStyle'
  | 'availability'
  | 'interests'
  | 'communication'
  | 'plans'
  | 'distance'
  | 'languages';

export type FilterReason =
  | 'inactive_account'
  | 'blocked'
  | 'recently_decided'
  | 'distance'
  | 'language'
  | 'age_preference'
  | 'intention'
  | 'availability'
  | 'already_connected'
  | 'incomplete_profile'
  | 'self';

export interface ScoreBreakdown {
  component: ScoreComponent;
  earned: number;
  max: number;
}

export interface RecommendationExplanation {
  /** Stable key so the copy can be localized and audited. */
  code: string;
  /** Human-readable Spanish sentence rendered on the card. */
  text: string;
}

export interface Recommendation {
  userId: UUID;
  score: number;
  breakdown: ScoreBreakdown[];
  explanations: RecommendationExplanation[];
  /** Deterministic exploration bonus applied on top of `score` for ordering. */
  explorationBonus: number;
}

export interface FilteredCandidate {
  userId: UUID;
  reason: FilterReason;
}

export interface RecommendationBatch {
  viewerId: UUID;
  seed: string;
  recommendations: Recommendation[];
  filtered: FilteredCandidate[];
}
