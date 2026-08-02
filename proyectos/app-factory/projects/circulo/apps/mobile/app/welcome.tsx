import { router } from 'expo-router';
import { Body, Button, Caption, Screen, Title } from '@/components/ui';
import { View } from 'react-native';
import { spacing } from '@circulo/config';

export default function Welcome() {
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.md }}>
        <Title>Círculo</Title>
        <Body>
          Conoce personas con las que podrías construir una amistad: no solo con tus mismos
          gustos, también con ritmos y horarios compatibles.
        </Body>
        <Caption>Solo para mayores de 18 años. Aquí nadie busca pareja.</Caption>
      </View>
      <View style={{ gap: spacing.sm }}>
        <Button label="Crear cuenta" onPress={() => router.push('/sign-up')} />
        <Button label="Ya tengo cuenta" variant="secondary" onPress={() => router.push('/sign-in')} />
      </View>
    </Screen>
  );
}
