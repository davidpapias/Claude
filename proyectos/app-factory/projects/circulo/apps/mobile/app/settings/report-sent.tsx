import { router } from 'expo-router';
import { Body, Button, Heading, Screen } from '@/components/ui';

export default function ReportSent() {
  return (
    <Screen>
      <Heading>Gracias por avisarnos</Heading>
      <Body muted>
        Un moderador va a revisar el reporte. Si el caso es grave, ocultamos el perfil mientras
        tanto. No le decimos a nadie quién reportó.
      </Body>
      <Button label="Volver" onPress={() => router.replace('/(tabs)/discovery')} />
    </Screen>
  );
}
