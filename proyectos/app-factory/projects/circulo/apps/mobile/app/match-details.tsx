import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { safetyTips } from '@circulo/config';
import { MATCH_FEEDBACK, type MatchFeedback } from '@circulo/types';
import { Body, Button, Caption, Card, Chip, Divider, Heading, Row, Screen } from '@/components/ui';
import { blockUser, endMatch, submitMatchFeedback } from '@/lib/api';
import { humanError } from '@/lib/errors';
import { track } from '@/lib/analytics';

const FEEDBACK_LABELS: Record<MatchFeedback, string> = {
  we_talked: 'Ya conversamos',
  planning_to_meet: 'Planeamos conocernos',
  we_met: 'Nos conocimos',
  want_to_keep_in_touch: 'Quiero seguir en contacto',
  not_compatible: 'No hubo compatibilidad',
  inappropriate_behavior: 'Hubo comportamiento inapropiado',
};

export default function MatchDetails() {
  const { matchId, userId } = useLocalSearchParams<{ matchId: string; userId: string }>();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState<MatchFeedback | null>(null);

  const feedback = useMutation({
    mutationFn: (value: MatchFeedback) => submitMatchFeedback(matchId, value),
    onSuccess: (_data, value) => {
      void track('match_feedback_submitted', { feedback: value });
      setSaved(value);
    },
    onError: (caught) => setError(humanError(caught)),
  });

  const unmatch = useMutation({
    mutationFn: () => endMatch(matchId, 'unmatched'),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
      router.replace('/(tabs)/matches');
    },
    onError: (caught) => setError(humanError(caught)),
  });

  const block = useMutation({
    mutationFn: () => blockUser(userId),
    onSuccess: async () => {
      void track('block_created');
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
      router.replace('/(tabs)/matches');
    },
    onError: (caught) => setError(humanError(caught)),
  });

  return (
    <Screen>
      <Heading>Detalles</Heading>

      <Card>
        <Caption>¿Cómo va esta conexión? Solo tú ves esta respuesta.</Caption>
        <Row>
          {MATCH_FEEDBACK.map((value) => (
            <Chip
              key={value}
              label={FEEDBACK_LABELS[value]}
              selected={saved === value}
              onPress={() => feedback.mutate(value)}
            />
          ))}
        </Row>
      </Card>

      <Card>
        <Caption>Antes de un primer encuentro</Caption>
        {safetyTips.map((tip) => (
          <Body key={tip} muted>· {tip}</Body>
        ))}
      </Card>

      {error ? <Body muted>{error}</Body> : null}

      <Divider />
      <Button
        label="Reportar a esta persona"
        variant="secondary"
        onPress={() => router.push({ pathname: '/report/[userId]', params: { userId } })}
      />
      <Button label="Deshacer match" variant="secondary" loading={unmatch.isPending} onPress={() => unmatch.mutate()} />
      <Button label="Bloquear" variant="danger" loading={block.isPending} onPress={() => block.mutate()} />
    </Screen>
  );
}
