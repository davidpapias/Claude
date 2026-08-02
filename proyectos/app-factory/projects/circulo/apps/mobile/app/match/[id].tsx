import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable } from 'react-native';
import { interestLabels } from '@circulo/config';
import { buildConversationStarters } from '@circulo/matching';
import { Body, Button, Caption, Card, Heading, Loading, Screen, Title } from '@/components/ui';
import { fetchDiscoveryCandidates, fetchMatches, fetchMyMatchingProfile, fetchPublicProfile } from '@/lib/api';
import { useUserId } from '@/lib/session';

/**
 * Match screen. Warm, not romantic: it names what the two people have in common
 * and hands them something concrete to say.
 */
export default function MatchScreen() {
  const { id, userId: otherUserId } = useLocalSearchParams<{ id: string; userId?: string }>();
  const userId = useUserId();

  const other = useQuery({
    queryKey: ['public-profile', otherUserId],
    queryFn: () => fetchPublicProfile(otherUserId as string),
    enabled: Boolean(otherUserId),
  });

  const viewer = useQuery({
    queryKey: ['my-matching-profile', userId],
    queryFn: () => fetchMyMatchingProfile(userId as string),
    enabled: Boolean(userId),
  });

  const matches = useQuery({
    queryKey: ['matches', userId],
    queryFn: () => fetchMatches(userId as string),
    enabled: Boolean(userId),
  });

  const candidates = useQuery({
    queryKey: ['discovery-candidates', userId],
    queryFn: () => fetchDiscoveryCandidates(60),
    enabled: Boolean(userId),
  });

  if (other.isPending || viewer.isPending) return <Screen scroll={false}><Loading /></Screen>;

  const otherMatching = candidates.data?.find((candidate) => candidate.userId === otherUserId);
  const starters =
    viewer.data && otherMatching
      ? buildConversationStarters(viewer.data, otherMatching, { interestLabels })
      : [
          '¿Qué te ha gustado de tu zona últimamente?',
          '¿Cómo suele ser tu fin de semana ideal?',
        ];

  const conversationId = matches.data?.find((match) => match.matchId === id)?.conversationId;

  return (
    <Screen>
      <Title>Parece que ambos quieren conocerse</Title>
      <Body muted>
        {other.data
          ? `${other.data.displayName} también mostró interés. Pueden empezar a conversar cuando quieran.`
          : 'La otra persona también mostró interés.'}
      </Body>

      <Card>
        <Caption>Para romper el hielo</Caption>
        {starters.map((starter) => (
          <Pressable
            key={starter}
            accessibilityRole="button"
            accessibilityLabel={`Empezar con: ${starter}`}
            onPress={() =>
              router.replace({
                pathname: '/chat/[id]',
                params: { id: conversationId ?? '', matchId: id, userId: otherUserId ?? '' },
              })
            }
          >
            <Body>· {starter}</Body>
          </Pressable>
        ))}
      </Card>

      <Button
        label="Abrir conversación"
        disabled={!conversationId}
        onPress={() =>
          router.replace({
            pathname: '/chat/[id]',
            params: { id: conversationId ?? '', matchId: id, userId: otherUserId ?? '' },
          })
        }
      />
      <Button label="Seguir conociendo gente" variant="secondary" onPress={() => router.replace('/(tabs)/discovery')} />
      <Caption>Sin prisa: pueden escribirse cuando les acomode.</Caption>
    </Screen>
  );
}
