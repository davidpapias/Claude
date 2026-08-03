import { useState } from 'react';
import { Body, Button, Field, Heading, Screen } from '@/components/ui';
import { resetPasswordSchema } from '@circulo/validation';
import { supabase } from '@/lib/supabase';
import { humanError } from '@/lib/errors';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const parsed = resetPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }

    setSubmitting(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(parsed.data.email);
    setSubmitting(false);

    // Always show the same confirmation: revealing whether an account exists
    // would let anyone enumerate users.
    if (authError && !/rate/i.test(authError.message)) setError(undefined);
    if (authError && /rate/i.test(authError.message)) {
      setError(humanError(authError));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Screen>
        <Heading>Revisa tu correo</Heading>
        <Body muted>
          Si existe una cuenta con ese correo, te enviamos un enlace para crear una contraseña
          nueva.
        </Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <Heading>Recuperar contraseña</Heading>
      <Field
        label="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        error={error}
      />
      <Button label="Enviar enlace" onPress={onSubmit} loading={submitting} />
    </Screen>
  );
}
