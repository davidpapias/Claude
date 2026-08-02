import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useQueries } from '@tanstack/react-query';
import { Body, Caption, Card, EmptyState, ErrorState, Heading, Loading, Screen } from '@/components/ui';
import { fetchMatches, fetchPublicProfile } from '@/lib/api';
import { useUserId } from '@/lib/session';
import { humanError } from '@/lib/errors';
import { track } from '@/lib/analytics';

export default function Matches() {
  const userId = useUserId();

  const matches = useQuery({
    queryKey: ['matches', userId],
    queryFn: () => fetchMatches(userId as string),
    enabled: Boolean(userId),
  });

  const profiles = useQueries({
    queries: (matches.data ?? []).map((match) => ({
      queryKey: ['public-profile', match.otherUserId],
      queryFn: () => fetchPublicProfile(match.otherUserId),
    })),
  });

  if (matches.isPending) return <Screen scroll={false}><Loading /></Screen>;
  if (matches.isError) {
    return (
      <Screen scroll={false}>
        <ErrorState message={humanError(matches.error)} onRetry={() => void matches.refetch()} />
      </Screen>
    );
  }

  if ((matches.data ?? []).length === 0) {
    return (
      <Screen scroll={false}>
        <EmptyState
          title="Todavía no tienes conversaciones"
          body="Cuando dos personas muestran interés, aquí aparece la conversación. Nadie puede escribirte antes de eso."
          action={{ label: 'Conocer gente', onPress: () => router.push('/(tabs)/discovery') }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Heading>Conversaciones</Heading>
      {(matches.data ?? []).map((match, index) => {
        const profile = profiles[index]?.data;
        return (
          <Pressable
            key={match.matchId}
            accessibilityRole="button"
            accessibilityLabel={`Abrir conversación con ${profile?.displayName ?? 'esta persona'}`}
            onPress={() => {
              void track('conversation_opened');
              router.push({ pathname: '/chat/[id]', params: { id: match.conversationId, matchId: match.matchId, userId: match.otherUserId } });
            }}
          >
            <Card>
              <Body>{profile ? `${profile.displayName}, ${profile.age}` : 'Cargando…'}</Body>
              <Caption>
                {match.lastMessageAt
                  ? `Último mensaje: ${new Date(match.lastMessageAt).toLocaleDateString('es-MX')}`
                  : 'Aún no se han escrito. Puedes empezar tú.'}
              </Caption>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}
