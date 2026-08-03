import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { REPORT_CATEGORIES, type ReportCategory } from '@circulo/types';
import { Body, Button, Caption, Chip, Field, Heading, Row, Screen } from '@/components/ui';
import { blockUser, reportUser } from '@/lib/api';
import { humanError } from '@/lib/errors';
import { track } from '@/lib/analytics';

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  harassment: 'Acoso',
  unsolicited_sexual_content: 'Contenido sexual no solicitado',
  persistent_romantic_intent: 'Intención romántica insistente',
  hate_speech: 'Discurso de odio',
  threats: 'Amenazas',
  impersonation: 'Suplantación',
  fake_profile: 'Perfil falso',
  spam: 'Spam',
  money_request: 'Solicitud de dinero',
  unsafe_behavior: 'Comportamiento inseguro',
  minor: 'Es menor de edad',
  other: 'Otro',
};

export default function ReportScreen() {
  const { userId, block, conversationId } = useLocalSearchParams<{
    userId: string;
    block?: string;
    conversationId?: string;
  }>();
  const [category, setCategory] = useState<ReportCategory>('harassment');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(block === '1');
  const [error, setError] = useState<string>();

  const submit = useMutation({
    mutationFn: async () => {
      await reportUser({
        reportedUserId: userId,
        category,
        details: details || null,
        conversationId: conversationId ?? null,
      });
      if (alsoBlock) {
        await blockUser(userId);
        void track('block_created');
      }
    },
    onSuccess: () => {
      void track('report_created', { category });
      router.replace('/settings/report-sent');
    },
    onError: (caught) => setError(humanError(caught)),
  });

  return (
    <Screen>
      <Heading>Reportar</Heading>
      <Body muted>
        Un moderador revisa cada reporte. Mientras se revisa, podemos ocultar el perfil. No le
        avisamos a la otra persona que fuiste tú.
      </Body>

      <Caption>¿Qué ocurrió?</Caption>
      <Row>
        {REPORT_CATEGORIES.map((value) => (
          <Chip
            key={value}
            label={CATEGORY_LABELS[value]}
            selected={category === value}
            onPress={() => setCategory(value)}
          />
        ))}
      </Row>

      <Field
        label="Detalles (opcional)"
        value={details}
        onChangeText={setDetails}
        multiline
        numberOfLines={4}
        hint="Lo que nos cuentes ayuda a revisar el caso más rápido."
      />

      <Chip
        label={alsoBlock ? '✓ Bloquear también a esta persona' : 'Bloquear también a esta persona'}
        selected={alsoBlock}
        onPress={() => setAlsoBlock((value) => !value)}
      />

      {error ? <Body muted>{error}</Body> : null}

      <Button label="Enviar reporte" loading={submit.isPending} onPress={() => submit.mutate()} />
      <Button label="Cancelar" variant="quiet" onPress={() => router.back()} />
    </Screen>
  );
}
