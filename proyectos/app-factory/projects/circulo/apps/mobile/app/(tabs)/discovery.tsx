import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { interestLabels, spacing } from '@circulo/config';
import { distanceKm, recommend, type ExposureSignals } from '@circulo/matching';
import type { Recommendation } from '@circulo/types';
import {
  Body,
  Button,
  Caption,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Heading,
  Loading,
  Row,
  Screen,
} from '@/components/ui';
import { useUserId } from '@/lib/session';
import { deterministicUuid } from '@/lib/uuid';
import { humanError } from '@/lib/errors';
import { track } from '@/lib/analytics';
import {
  fetchDiscoveryCandidates,
  fetchMyMatchingProfile,
  fetchPublicProfile,
  recordDecision,
  saveRecommendationBatch,
  type CandidateProfile,
} from '@/lib/api';
import { Image } from 'react-native';
import { supabase } from '@/lib/supabase';

/**
 * Discovery: one card at a time, each with the concrete reasons it was
 * recommended. Hard filters already ran on the server; the ranking, the score
 * and the explanations come from @circulo/matching over the candidates it
 * returned.
 */
export default function Discovery() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [actionError, setActionError] = useState<string>();

  // One seed per session per user keeps the order stable while swiping.
  const seed = useMemo(() => `${userId ?? 'anon'}:${new Date().toISOString().slice(0, 13)}`, [userId]);

  const viewer = useQuery({
    queryKey: ['my-matching-profile', userId],
    queryFn: () => fetchMyMatchingProfile(userId as string),
    enabled: Boolean(userId),
  });

  const candidates = useQuery({
    queryKey: ['discovery-candidates', userId],
    queryFn: () => fetchDiscoveryCandidates(60),
    enabled: Boolean(userId),
  });

  const batch = useMemo(() => {
    if (!viewer.data || !candidates.data) return null;

    const exposure: Record<string, ExposureSignals> = {};
    for (const candidate of candidates.data as CandidateProfile[]) {
      exposure[candidate.userId] = {
        recentImpressions: candidate.recentImpressions ?? 0,
        createdAt: candidate.createdAt,
        spamFlagged: candidate.spamFlagged,
      };
    }

    return recommend(viewer.data, candidates.data, {
      seed,
      limit: 20,
      exposure,
      interestLabels,
    });
  }, [viewer.data, candidates.data, seed]);

  const current: Recommendation | undefined = batch?.recommendations[index];
  const currentProfile = candidates.data?.find((candidate) => candidate.userId === current?.userId);

  // The card's visible content comes from the public-profile RPC, which is the
  // only place that decides what one user may see about another.
  const shown = useQuery({
    queryKey: ['public-profile', current?.userId],
    queryFn: () => fetchPublicProfile(current?.userId as string),
    enabled: Boolean(current?.userId),
  });

  const photo = useQuery({
    queryKey: ['photo-url', shown.data?.photos[0]?.storagePath],
    queryFn: async () => {
      const path = shown.data?.photos[0]?.storagePath;
      if (!path) return null;
      // Private bucket: photos are only ever served through a short-lived URL.
      const { data } = await supabase.storage.from('profile-photos').createSignedUrl(path, 600);
      return data?.signedUrl ?? null;
    },
    enabled: Boolean(shown.data?.photos[0]?.storagePath),
  });

  const decide = useMutation({
    mutationFn: async ({ decision }: { decision: 'interested' | 'pass' }) => {
      if (!current) return null;
      // Stable key per card: a double tap or a retry cannot create two rows.
      const idempotencyKey = deterministicUuid(`${seed}:${current.userId}`);
      return recordDecision(current.userId, decision, idempotencyKey);
    },
    onSuccess: async (result, variables) => {
      void track(variables.decision === 'interested' ? 'discovery_like' : 'discovery_pass');
      setActionError(undefined);
      setIndex((value) => value + 1);

      if (result?.matched && result.matchId) {
        void track('match_created');
        await queryClient.invalidateQueries({ queryKey: ['matches'] });
        router.push({ pathname: '/match/[id]', params: { id: result.matchId, userId: current?.userId ?? '' } });
      }
    },
    onError: (error) => setActionError(humanError(error)),
  });

  // Record the impression and the explanation trail once per batch.
  useMemo(() => {
    if (!batch || batch.recommendations.length === 0) return;
    void saveRecommendationBatch(batch.seed, batch.recommendations).catch(() => {
      // Losing the analytics trail must not block discovery.
    });
    void track('discovery_profile_viewed', { count: batch.recommendations.length });
  }, [batch]);

  if (viewer.isPending || candidates.isPending) {
    return <Screen scroll={false}><Loading label="Buscando personas compatibles" /></Screen>;
  }

  if (viewer.isError || candidates.isError) {
    return (
      <Screen scroll={false}>
        <ErrorState
          message={humanError(viewer.error ?? candidates.error)}
          onRetry={() => {
            void viewer.refetch();
            void candidates.refetch();
          }}
        />
      </Screen>
    );
  }

  if (!current || !currentProfile) {
    return (
      <Screen scroll={false}>
        <EmptyState
          title="Por hoy no hay más personas"
          body="Vuelve más tarde o amplía tu distancia y tus horarios para ver más gente compatible."
          action={{ label: 'Ajustar preferencias', onPress: () => router.push('/settings/preferences') }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        {photo.data ? (
          <Image
            source={{ uri: photo.data }}
            style={{ width: '100%', height: 320, borderRadius: 14 }}
            accessibilityLabel={`Foto de ${shown.data?.displayName ?? 'la persona'}`}
          />
        ) : null}

        <Heading>{shown.data ? `${shown.data.displayName}, ${shown.data.age}` : 'Cargando perfil'}</Heading>
        <Caption>{`${currentProfile.location.areaLabel} · a ${Math.round(
          distanceKm(viewer.data?.location ?? currentProfile.location, currentProfile.location),
        )} km aprox.`}</Caption>

        {shown.data ? <Body>{shown.data.bio}</Body> : null}

        <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
          <Caption>Por qué te lo recomendamos</Caption>
          {current.explanations.map((explanation) => (
            <Body key={explanation.code}>· {explanation.text}</Body>
          ))}
        </View>

        <Row>
          {currentProfile.interests.slice(0, 6).map((slug) => (
            <Chip key={slug} label={interestLabels[slug] ?? slug} />
          ))}
        </Row>

        <Button
          label="Ver perfil completo"
          variant="quiet"
          onPress={() => router.push({ pathname: '/profile/[id]', params: { id: currentProfile.userId } })}
        />
      </Card>

      {actionError ? <Body muted>{actionError}</Body> : null}

      <View style={{ gap: spacing.sm }}>
        <Button
          label="Me interesa conocerle"
          loading={decide.isPending}
          onPress={() => decide.mutate({ decision: 'interested' })}
          accessibilityHint="Solo lo sabrá si esa persona también muestra interés."
        />
        <Button
          label="Pasar"
          variant="secondary"
          disabled={decide.isPending}
          onPress={() => decide.mutate({ decision: 'pass' })}
        />
      </View>

      <Caption>
        Nadie sabe que pasaste sobre su perfil. El interés solo se revela cuando es mutuo.
      </Caption>
    </Screen>
  );
}

