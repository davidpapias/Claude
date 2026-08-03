import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { genericConversationStarters, spacing } from '@circulo/config';
import { messageSchema } from '@circulo/validation';
import {
  Body,
  Button,
  Caption,
  Card,
  ErrorState,
  Field,
  Loading,
  Row,
  Screen,
  useTheme,
} from '@/components/ui';
import { fetchMessages, fetchPublicProfile, sendMessage, type Message } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useUserId } from '@/lib/session';
import { humanError, isOfflineError } from '@/lib/errors';
import { track } from '@/lib/analytics';

export default function Chat() {
  const { id, matchId, userId: otherUserId } = useLocalSearchParams<{
    id: string;
    matchId?: string;
    userId?: string;
  }>();
  const userId = useUserId();
  const queryClient = useQueryClient();
  const { c } = useTheme();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string>();
  const listRef = useRef<FlatList<Message>>(null);

  const messages = useQuery({
    queryKey: ['messages', id],
    queryFn: () => fetchMessages(id),
    enabled: Boolean(id),
  });

  const other = useQuery({
    queryKey: ['public-profile', otherUserId],
    queryFn: () => fetchPublicProfile(otherUserId as string),
    enabled: Boolean(otherUserId),
  });

  // Realtime: new messages arrive without polling. RLS still applies, so a
  // subscription cannot deliver a conversation the user is not a member of.
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`conversation:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['messages', id] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  const send = useMutation({
    mutationFn: async (body: string) => {
      const parsed = messageSchema.safeParse({ conversationId: id, body });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Mensaje inválido');
      await sendMessage(id, parsed.data.body);
    },
    onSuccess: async () => {
      const isFirst = (messages.data ?? []).length === 0;
      if (isFirst) void track('first_message_sent');
      setDraft('');
      setError(undefined);
      await queryClient.invalidateQueries({ queryKey: ['messages', id] });
    },
    onError: (caught) => {
      setError(
        isOfflineError(caught)
          ? 'Sin conexión. Tu mensaje no se envió; vuelve a intentarlo cuando tengas internet.'
          : humanError(caught),
      );
    },
  });

  if (messages.isPending) return <Screen scroll={false}><Loading /></Screen>;
  if (messages.isError) {
    return (
      <Screen scroll={false}>
        <ErrorState message={humanError(messages.error)} onRetry={() => void messages.refetch()} />
      </Screen>
    );
  }

  const data = messages.data ?? [];
  const starters = genericConversationStarters;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <Screen scroll={false} style={{ flex: 1 }}>
        <Row>
          <Button
            label={other.data?.displayName ?? 'Conversación'}
            variant="quiet"
            onPress={() =>
              router.push({ pathname: '/profile/[id]', params: { id: otherUserId ?? '' } })
            }
          />
          <Button
            label="Detalles"
            variant="quiet"
            onPress={() =>
              router.push({
                pathname: '/match-details',
                params: { matchId: matchId ?? '', userId: otherUserId ?? '', conversationId: id },
              })
            }
          />
        </Row>

        {data.length === 0 ? (
          <Card>
            <Caption>Para empezar sin pensarlo demasiado</Caption>
            {starters.map((starter) => (
              <Pressable
                key={starter}
                accessibilityRole="button"
                accessibilityLabel={`Usar: ${starter}`}
                onPress={() => setDraft(starter)}
              >
                <Body muted>· {starter}</Body>
              </Pressable>
            ))}
          </Card>
        ) : null}

        <FlatList
          ref={listRef}
          data={data}
          style={{ flex: 1 }}
          keyExtractor={(message) => message.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const mine = item.senderId === userId;
            return (
              <View
                accessibilityLabel={`${mine ? 'Tú' : other.data?.displayName ?? 'La otra persona'}: ${item.body ?? 'foto'}`}
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  backgroundColor: mine ? c.primary : c.surfaceMuted,
                  borderRadius: 14,
                  padding: spacing.md,
                  marginVertical: spacing.xs,
                  maxWidth: '85%',
                }}
              >
                <Body>{item.body ?? '📷 Foto'}</Body>
              </View>
            );
          }}
        />

        {error ? <Body muted>{error}</Body> : null}

        <Field
          label="Mensaje"
          value={draft}
          onChangeText={setDraft}
          multiline
          placeholder="Escribe algo…"
        />
        <Button
          label="Enviar"
          loading={send.isPending}
          disabled={draft.trim().length === 0}
          onPress={() => send.mutate(draft)}
        />
        <Caption>Sin confirmaciones de lectura. Nadie ve tu ubicación en tiempo real.</Caption>
      </Screen>
    </KeyboardAvoidingView>
  );
}
