import { router } from 'expo-router';
import { safetyTips } from '@circulo/config';
import { Body, Button, Caption, Card, Heading, Screen } from '@/components/ui';

export default function Safety() {
  return (
    <Screen>
      <Heading>Seguridad</Heading>
      <Card>
        <Caption>Antes de un primer encuentro</Caption>
        {safetyTips.map((tip) => (
          <Body key={tip} muted>· {tip}</Body>
        ))}
      </Card>
      <Card>
        <Caption>Qué puedes hacer siempre</Caption>
        <Body muted>· Bloquear a alguien: deja de verte y no puede escribirte.</Body>
        <Body muted>· Reportar: un moderador revisa el caso.</Body>
        <Body muted>· Deshacer un match: termina la conversación.</Body>
        <Body muted>· Ocultarte de descubrimiento desde Privacidad.</Body>
      </Card>
      <Body muted>
        Nunca cobramos por funciones de seguridad y nunca te pediremos datos bancarios.
      </Body>
      <Button label="Ver personas bloqueadas" variant="secondary" onPress={() => router.push('/settings/blocks')} />
    </Screen>
  );
}
