import { router } from 'expo-router';
import { Body, Button, Heading, Screen } from '@/components/ui';
import { useSessionStore } from '@/lib/session';

export default function Suspended() {
  const signOut = useSessionStore((state) => state.signOut);
  return (
    <Screen>
      <Heading>Tu cuenta está suspendida</Heading>
      <Body muted>
        Un moderador está revisando un reporte relacionado con tu cuenta. Mientras tanto, no puedes
        conocer gente nueva ni enviar mensajes.
      </Body>
      <Body muted>Si crees que es un error, escríbenos a hola@circulo.app</Body>
      <Button label="Cerrar sesión" variant="secondary" onPress={() => void signOut().then(() => router.replace('/welcome'))} />
    </Screen>
  );
}
