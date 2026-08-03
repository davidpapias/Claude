import { useState } from 'react';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Body, Button, Field, Heading, Screen } from '@/components/ui';
import { deleteMyAccount } from '@/lib/api';
import { useSessionStore } from '@/lib/session';
import { humanError } from '@/lib/errors';
import { track } from '@/lib/analytics';

export default function DeleteAccount() {
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string>();
  const signOut = useSessionStore((state) => state.signOut);

  const remove = useMutation({
    mutationFn: async () => {
      await deleteMyAccount();
      void track('account_deleted');
      await signOut();
    },
    onSuccess: () => router.replace('/welcome'),
    onError: (caught) => setError(humanError(caught)),
  });

  return (
    <Screen>
      <Heading>Eliminar mi cuenta</Heading>
      <Body muted>
        Tu perfil deja de ser visible, tus conversaciones se cierran y tus datos personales se
        anonimizan. Esta acción no se puede deshacer.
      </Body>
      <Field
        label="Escribe ELIMINAR para confirmar"
        value={confirmation}
        onChangeText={setConfirmation}
        autoCapitalize="characters"
      />
      {error ? <Body muted>{error}</Body> : null}
      <Button
        label="Eliminar definitivamente"
        variant="danger"
        disabled={confirmation.trim().toUpperCase() !== 'ELIMINAR'}
        loading={remove.isPending}
        onPress={() => remove.mutate()}
      />
      <Button label="Cancelar" variant="quiet" onPress={() => router.back()} />
    </Screen>
  );
}
