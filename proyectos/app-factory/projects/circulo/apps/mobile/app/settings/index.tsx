import { router } from 'expo-router';
import { useState } from 'react';
import { Body, Button, Caption, Divider, Heading, Screen } from '@/components/ui';
import { useSessionStore } from '@/lib/session';
import { exportMyData } from '@/lib/api';
import { humanError } from '@/lib/errors';

export default function Settings() {
  const signOut = useSessionStore((state) => state.signOut);
  const [status, setStatus] = useState<string>();

  async function onExport() {
    try {
      const data = await exportMyData();
      // The MVP shows the export inline; a file export needs a share sheet and
      // is tracked in docs/mvp-scope.md as out of scope for V1.
      setStatus(`Tu información se generó correctamente (${JSON.stringify(data).length} caracteres).`);
    } catch (error) {
      setStatus(humanError(error));
    }
  }

  return (
    <Screen>
      <Heading>Ajustes de cuenta</Heading>
      <Button label="Preferencias de descubrimiento" variant="secondary" onPress={() => router.push('/settings/preferences')} />
      <Button label="Privacidad" variant="secondary" onPress={() => router.push('/settings/privacy')} />
      <Button label="Seguridad" variant="secondary" onPress={() => router.push('/settings/safety')} />
      <Button label="Descargar mi información" variant="secondary" onPress={onExport} />
      {status ? <Caption>{status}</Caption> : null}

      <Divider />
      <Button label="Cerrar sesión" variant="secondary" onPress={() => void signOut().then(() => router.replace('/welcome'))} />
      <Button label="Eliminar mi cuenta" variant="danger" onPress={() => router.push('/settings/delete-account')} />
      <Body muted>Círculo es una app de amistad. No es una app de citas ni una red social.</Body>
    </Screen>
  );
}
