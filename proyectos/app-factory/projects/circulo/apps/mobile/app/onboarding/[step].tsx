import { useState } from 'react';
import { Image, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { INTEREST_CATALOG, spacing } from '@circulo/config';
import {
  ALCOHOL_PREFERENCE,
  COMMUNICATION_STYLE,
  CONTACT_FREQUENCY,
  DAY_BLOCKS,
  FRIENDSHIP_INTENTIONS,
  GROUP_PREFERENCE,
  PLAN_PREFERENCE,
  SOCIAL_ENERGY,
  SPONTANEITY,
  WARM_UP_SPEED,
  type AvailabilitySlot,
  type FriendshipIntention,
  type Weekday,
} from '@circulo/types';
import {
  availabilityStepSchema,
  bioStepSchema,
  distanceStepSchema,
  identityStepSchema,
  intentionsStepSchema,
  interestsStepSchema,
} from '@circulo/validation';
import { Body, Button, Caption, Chip, Field, Heading, Row, Screen } from '@/components/ui';
import { useUserId } from '@/lib/session';
import { humanError } from '@/lib/errors';
import { fetchPublicProfile } from '@/lib/api';
import {
  STEP_TITLES,
  finishOnboarding,
  nextStep,
  saveAvailability,
  saveBio,
  saveBoundaries,
  saveCommunication,
  saveDistance,
  saveIdentity,
  saveIntentions,
  saveInterests,
  savePhoto,
  saveSocial,
  stepProgress,
  type OnboardingStep,
} from '@/lib/onboarding';

const INTENTION_LABELS: Record<FriendshipIntention, string> = {
  close_friendship: 'Crear una amistad cercana',
  casual_meetups: 'Conocer gente casualmente',
  activity_partner: 'Compañía para planes',
  expand_circle: 'Ampliar mi círculo',
  new_in_city: 'Adaptarme a una ciudad nueva',
  language_practice: 'Practicar un idioma',
  similar_life_stage: 'Gente en una etapa similar',
};

const ENERGY_LABELS = { calm: 'Planes tranquilos', mixed: 'De todo un poco', active: 'Planes activos' };
const WARM_UP_LABELS = {
  needs_time: 'Necesito tiempo para entrar en confianza',
  in_between: 'Depende de la persona',
  opens_quickly: 'Suelo hablar con facilidad',
};
const GROUP_LABELS = {
  one_on_one: 'Una persona a la vez',
  small_group: 'Grupos pequeños',
  flexible: 'Me adapto',
  many_people: 'Conocer a varias personas',
};
const PLAN_LABELS = { calm: 'Tranquilos', mixed: 'Mixtos', active: 'Activos' };
const SPONTANEITY_LABELS = {
  plans_ahead: 'Planear con anticipación',
  flexible: 'Me adapto',
  spontaneous: 'Planes espontáneos',
};
const ALCOHOL_LABELS = {
  no_preference: 'Me da igual',
  prefers_alcohol_free: 'Prefiero ambientes sin alcohol',
  fine_with_alcohol: 'Sin problema con el alcohol',
};
const FREQUENCY_LABELS = {
  daily: 'Casi todos los días',
  few_times_week: 'Varias veces por semana',
  weekly: 'Una vez por semana',
  occasional: 'De vez en cuando',
};
const STYLE_LABELS = {
  long_messages: 'Mensajes largos',
  short_messages: 'Mensajes cortos',
  voice_notes: 'Notas de voz',
  meet_soon: 'Vernos pronto en persona',
};
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
const BLOCK_LABELS = { morning: 'Mañana', afternoon: 'Tarde', evening: 'Noche' } as const;

export default function OnboardingScreen() {
  const params = useLocalSearchParams<{ step?: string }>();
  const step = (params.step ?? 'identity') as OnboardingStep;
  const userId = useUserId();
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const progress = stepProgress(step);

  // Step state. One object keeps the screen simple and lets a step read what a
  // previous one captured without a global store.
  const [form, setForm] = useState<Record<string, unknown>>({
    displayName: '',
    birthDate: '',
    areaLabel: '',
    bio: '',
    intentions: [] as FriendshipIntention[],
    interests: [] as string[],
    socialEnergy: 'mixed',
    warmUpSpeed: 'in_between',
    groupPreference: 'small_group',
    planPreference: 'mixed',
    spontaneity: 'flexible',
    alcoholPreference: 'no_preference',
    contactFrequency: 'few_times_week',
    communicationStyles: ['short_messages'],
    availability: [] as AvailabilitySlot[],
    maxDistanceKm: 25,
    minAge: 18,
    maxAge: 99,
    boundaries: [] as string[],
    friendshipExpectations: '',
    photoUri: '',
  });

  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const toggle = (key: string, value: string, max = 99) =>
    setForm((current) => {
      const list = (current[key] as string[]) ?? [];
      const next = list.includes(value)
        ? list.filter((item) => item !== value)
        : list.length >= max
          ? list
          : [...list, value];
      return { ...current, [key]: next };
    });

  const profile = useQuery({
    queryKey: ['my-public-profile', userId],
    queryFn: () => fetchPublicProfile(userId as string),
    enabled: Boolean(userId) && step === 'summary',
  });

  async function goNext(save: () => Promise<void>) {
    if (!userId) return;
    setError(undefined);
    setSaving(true);
    try {
      await save();
      const upcoming = nextStep(step);
      if (upcoming) {
        router.replace({ pathname: '/onboarding/[step]', params: { step: upcoming } });
      } else {
        router.replace('/(tabs)/discovery');
      }
    } catch (caught) {
      setError(humanError(caught));
    } finally {
      setSaving(false);
    }
  }

  function validateAnd(schema: { safeParse: (value: unknown) => { success: boolean; error?: { issues: Array<{ message: string }> } } }, value: unknown, save: () => Promise<void>) {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error?.issues[0]?.message ?? 'Revisa los datos.');
      return;
    }
    void goNext(save);
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Necesitamos permiso para acceder a tus fotos. Puedes cambiarlo en Ajustes.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) set('photoUri', result.assets[0].uri);
  }

  return (
    <Screen>
      <Caption>{`Paso ${progress.current} de ${progress.total}`}</Caption>
      <Heading>{STEP_TITLES[step]}</Heading>

      {step === 'identity' ? (
        <>
          <Field label="Nombre visible" value={form.displayName as string} onChangeText={(v) => set('displayName', v)} />
          <Field
            label="Fecha de nacimiento"
            placeholder="AAAA-MM-DD"
            value={form.birthDate as string}
            onChangeText={(v) => set('birthDate', v)}
            hint="Solo usamos tu edad. Nunca mostramos tu fecha exacta."
          />
          <Field label="Pronombres (opcional)" value={(form.pronouns as string) ?? ''} onChangeText={(v) => set('pronouns', v)} />
          <Field
            label="Zona o ciudad"
            value={form.areaLabel as string}
            onChangeText={(v) => set('areaLabel', v)}
            hint="Se muestra tu zona aproximada, nunca tu ubicación exacta."
          />
          <Button
            label="Continuar"
            loading={saving}
            onPress={() =>
              validateAnd(
                identityStepSchema,
                {
                  displayName: form.displayName,
                  birthDate: form.birthDate,
                  areaLabel: form.areaLabel,
                  languages: ['es'],
                  pronouns: form.pronouns ?? null,
                },
                () =>
                  saveIdentity(userId as string, {
                    displayName: form.displayName as string,
                    birthDate: form.birthDate as string,
                    areaLabel: form.areaLabel as string,
                    // Approximate centre of the declared area. The app never
                    // reads GPS in the MVP; see docs/security-model.md.
                    lat: 19.43,
                    lon: -99.13,
                    pronouns: (form.pronouns as string) || null,
                  }),
              )
            }
          />
        </>
      ) : null}

      {step === 'photos' ? (
        <>
          <Body muted>
            Una foto donde se te vea con naturalidad. Se revisa antes de mostrarse a otras
            personas.
          </Body>
          {form.photoUri ? (
            <Image
              source={{ uri: form.photoUri as string }}
              style={{ width: '100%', height: 320, borderRadius: 14 }}
              accessibilityLabel="Vista previa de tu foto"
            />
          ) : null}
          <Button label={form.photoUri ? 'Elegir otra foto' : 'Elegir foto'} variant="secondary" onPress={pickPhoto} />
          <Button
            label="Continuar"
            loading={saving}
            disabled={!form.photoUri}
            onPress={() => void goNext(() => savePhoto(userId as string, form.photoUri as string))}
          />
        </>
      ) : null}

      {step === 'bio' ? (
        <>
          <Field
            label="Sobre ti"
            value={form.bio as string}
            onChangeText={(v) => set('bio', v)}
            multiline
            numberOfLines={5}
            hint="Qué te gusta hacer, cómo es tu semana, qué buscas. Mínimo 40 caracteres."
          />
          <Button
            label="Continuar"
            loading={saving}
            onPress={() =>
              validateAnd(bioStepSchema, { bio: form.bio, conversationTopics: [], wantsToTry: [] }, () =>
                saveBio(userId as string, {
                  bio: form.bio as string,
                  conversationTopics: [],
                  wantsToTry: [],
                }),
              )
            }
          />
        </>
      ) : null}

      {step === 'intentions' ? (
        <>
          <Body muted>Elige hasta cuatro. Esto es lo que más peso tiene al recomendarte gente.</Body>
          <Row>
            {FRIENDSHIP_INTENTIONS.map((intention) => (
              <Chip
                key={intention}
                label={INTENTION_LABELS[intention]}
                selected={(form.intentions as string[]).includes(intention)}
                onPress={() => toggle('intentions', intention, 4)}
              />
            ))}
          </Row>
          <Button
            label="Continuar"
            loading={saving}
            onPress={() =>
              validateAnd(intentionsStepSchema, { intentions: form.intentions }, () =>
                saveIntentions(userId as string, form.intentions as FriendshipIntention[]),
              )
            }
          />
        </>
      ) : null}

      {step === 'interests' ? (
        <>
          <Body muted>Elige entre 3 y 15.</Body>
          <Row>
            {INTEREST_CATALOG.map((interest) => (
              <Chip
                key={interest.slug}
                label={interest.label}
                selected={(form.interests as string[]).includes(interest.slug)}
                onPress={() => toggle('interests', interest.slug, 15)}
              />
            ))}
          </Row>
          <Button
            label="Continuar"
            loading={saving}
            onPress={() =>
              validateAnd(interestsStepSchema, { interests: form.interests }, () =>
                saveInterests(userId as string, form.interests as string[]),
              )
            }
          />
        </>
      ) : null}

      {step === 'social' ? (
        <>
          <Caption>¿Qué tipo de planes disfrutas?</Caption>
          <Row>
            {SOCIAL_ENERGY.map((value) => (
              <Chip key={value} label={ENERGY_LABELS[value]} selected={form.socialEnergy === value} onPress={() => set('socialEnergy', value)} />
            ))}
          </Row>
          <Caption>¿Cómo entras en confianza?</Caption>
          <Row>
            {WARM_UP_SPEED.map((value) => (
              <Chip key={value} label={WARM_UP_LABELS[value]} selected={form.warmUpSpeed === value} onPress={() => set('warmUpSpeed', value)} />
            ))}
          </Row>
          <Caption>¿Con cuánta gente prefieres verte?</Caption>
          <Row>
            {GROUP_PREFERENCE.map((value) => (
              <Chip key={value} label={GROUP_LABELS[value]} selected={form.groupPreference === value} onPress={() => set('groupPreference', value)} />
            ))}
          </Row>
          <Caption>¿Cómo son tus planes ideales?</Caption>
          <Row>
            {PLAN_PREFERENCE.map((value) => (
              <Chip key={value} label={PLAN_LABELS[value]} selected={form.planPreference === value} onPress={() => set('planPreference', value)} />
            ))}
          </Row>
          <Caption>¿Planeas o improvisas?</Caption>
          <Row>
            {SPONTANEITY.map((value) => (
              <Chip key={value} label={SPONTANEITY_LABELS[value]} selected={form.spontaneity === value} onPress={() => set('spontaneity', value)} />
            ))}
          </Row>
          <Caption>Ambientes con alcohol (opcional)</Caption>
          <Row>
            {ALCOHOL_PREFERENCE.map((value) => (
              <Chip key={value} label={ALCOHOL_LABELS[value]} selected={form.alcoholPreference === value} onPress={() => set('alcoholPreference', value)} />
            ))}
          </Row>
          <Button
            label="Continuar"
            loading={saving}
            onPress={() =>
              void goNext(() =>
                saveSocial(
                  userId as string,
                  {
                    social_energy: form.socialEnergy as string,
                    warm_up_speed: form.warmUpSpeed as string,
                    group_preference: form.groupPreference as string,
                    plan_preference: form.planPreference as string,
                    spontaneity: form.spontaneity as string,
                    alcohol_preference: form.alcoholPreference as string,
                  },
                  'social',
                ),
              )
            }
          />
        </>
      ) : null}

      {step === 'communication' ? (
        <>
          <Caption>¿Con qué frecuencia te gusta hablar?</Caption>
          <Row>
            {CONTACT_FREQUENCY.map((value) => (
              <Chip key={value} label={FREQUENCY_LABELS[value]} selected={form.contactFrequency === value} onPress={() => set('contactFrequency', value)} />
            ))}
          </Row>
          <Caption>¿Cómo prefieres conversar?</Caption>
          <Row>
            {COMMUNICATION_STYLE.map((value) => (
              <Chip
                key={value}
                label={STYLE_LABELS[value]}
                selected={(form.communicationStyles as string[]).includes(value)}
                onPress={() => toggle('communicationStyles', value, 4)}
              />
            ))}
          </Row>
          <Button
            label="Continuar"
            loading={saving}
            disabled={(form.communicationStyles as string[]).length === 0}
            onPress={() =>
              void goNext(() =>
                saveCommunication(userId as string, {
                  contactFrequency: form.contactFrequency as string,
                  communicationStyles: form.communicationStyles as string[],
                }),
              )
            }
          />
        </>
      ) : null}

      {step === 'availability' ? (
        <>
          <Body muted>Marca los momentos en los que sueles tener tiempo libre.</Body>
          {WEEKDAYS.map((label, weekday) => (
            <View key={label} style={{ gap: spacing.xs }}>
              <Caption>{label}</Caption>
              <Row>
                {DAY_BLOCKS.map((block) => {
                  const slots = form.availability as AvailabilitySlot[];
                  const selected = slots.some((slot) => slot.weekday === weekday && slot.block === block);
                  return (
                    <Chip
                      key={block}
                      label={BLOCK_LABELS[block]}
                      selected={selected}
                      onPress={() =>
                        set(
                          'availability',
                          selected
                            ? slots.filter((slot) => !(slot.weekday === weekday && slot.block === block))
                            : [...slots, { weekday: weekday as Weekday, block }],
                        )
                      }
                    />
                  );
                })}
              </Row>
            </View>
          ))}
          <Button
            label="Continuar"
            loading={saving}
            onPress={() =>
              validateAnd(availabilityStepSchema, { availability: form.availability }, () =>
                saveAvailability(userId as string, form.availability as AvailabilitySlot[]),
              )
            }
          />
        </>
      ) : null}

      {step === 'distance' ? (
        <>
          <Caption>¿Hasta qué distancia te acomoda?</Caption>
          <Row>
            {[5, 10, 15, 25, 40, 60].map((km) => (
              <Chip key={km} label={`${km} km`} selected={form.maxDistanceKm === km} onPress={() => set('maxDistanceKm', km)} />
            ))}
          </Row>
          <Field
            label="Edad mínima"
            keyboardType="number-pad"
            value={String(form.minAge)}
            onChangeText={(v) => set('minAge', Number(v) || 18)}
          />
          <Field
            label="Edad máxima"
            keyboardType="number-pad"
            value={String(form.maxAge)}
            onChangeText={(v) => set('maxAge', Number(v) || 99)}
          />
          <Button
            label="Continuar"
            loading={saving}
            onPress={() =>
              validateAnd(
                distanceStepSchema,
                { maxDistanceKm: form.maxDistanceKm, minAge: form.minAge, maxAge: form.maxAge },
                () =>
                  saveDistance(userId as string, {
                    maxDistanceKm: form.maxDistanceKm as number,
                    minAge: form.minAge as number,
                    maxAge: form.maxAge as number,
                  }),
              )
            }
          />
        </>
      ) : null}

      {step === 'boundaries' ? (
        <>
          <Body muted>
            Esto se muestra en tu perfil. Sirve para que la otra persona sepa cómo tratarte desde
            el principio.
          </Body>
          <Row>
            {[
              'Nada de coqueteo, vengo por amistad.',
              'Prefiero conocer en lugares públicos.',
              'No comparto teléfono al inicio.',
              'Respondo con calma.',
              'Prefiero planes sin alcohol.',
            ].map((boundary) => (
              <Chip
                key={boundary}
                label={boundary}
                selected={(form.boundaries as string[]).includes(boundary)}
                onPress={() => toggle('boundaries', boundary, 8)}
              />
            ))}
          </Row>
          <Field
            label="¿Qué esperas de una amistad? (opcional)"
            multiline
            numberOfLines={3}
            value={form.friendshipExpectations as string}
            onChangeText={(v) => set('friendshipExpectations', v)}
          />
          <Button
            label="Continuar"
            loading={saving}
            onPress={() =>
              void goNext(() =>
                saveBoundaries(userId as string, {
                  boundaries: form.boundaries as string[],
                  friendshipExpectations: (form.friendshipExpectations as string) || null,
                }),
              )
            }
          />
        </>
      ) : null}

      {step === 'summary' ? (
        <>
          <Body muted>Así te verán las demás personas.</Body>
          {profile.data ? (
            <>
              <Heading>{`${profile.data.displayName}, ${profile.data.age}`}</Heading>
              <Caption>{profile.data.areaLabel}</Caption>
              <Body>{profile.data.bio}</Body>
              <Row>
                {profile.data.interests.map((slug) => (
                  <Chip key={slug} label={INTEREST_CATALOG.find((i) => i.slug === slug)?.label ?? slug} />
                ))}
              </Row>
              {profile.data.photos.some((photo) => photo.moderationStatus === 'pending') ? (
                <Caption>Tu foto está en revisión. Mientras tanto tu perfil no aparece en descubrimiento.</Caption>
              ) : null}
            </>
          ) : (
            <Caption>Preparando tu resumen…</Caption>
          )}
          <Button
            label="Empezar a conocer gente"
            loading={saving}
            onPress={() => void goNext(() => finishOnboarding(userId as string))}
          />
        </>
      ) : null}

      {error ? (
        <Body muted>{error}</Body>
      ) : null}
    </Screen>
  );
}
