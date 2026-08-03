import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Body, Button, Caption, Chip, Field, Heading, Screen } from '@/components/ui';
import { spacing } from '@circulo/config';
import { signUpSchema } from '@circulo/validation';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';
import { humanError } from '@/lib/errors';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);

  async function onSubmit() {
    void track('sign_up_started');
    const parsed = signUpSchema.safeParse({ email, password, ageConfirmed, termsAccepted });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }

    setErrors({});
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setSubmitting(false);

    if (error) {
      setErrors({ form: humanError(error) });
      return;
    }

    void track('sign_up_completed');

    // Email confirmation is required: signUp does not return a session until
    // the user clicks the link in their inbox. Onboarding needs a session
    // (every RPC call requires auth.uid()), so it cannot start yet.
    if (!data.session) {
      setConfirmationPending(true);
      return;
    }

    router.replace({ pathname: '/onboarding/[step]', params: { step: 'identity' } });
  }

  if (confirmationPending) {
    return (
      <Screen>
        <Heading>Revisa tu correo</Heading>
        <Body>
          Te enviamos un enlace de confirmación a {email}. Ábrelo y luego vuelve para iniciar
          sesión.
        </Body>
        <Button label="Ya confirmé, iniciar sesión" onPress={() => router.replace('/sign-in')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Heading>Crear cuenta</Heading>
      <Field
        label="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        error={errors.email}
      />
      <Field
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        hint="Al menos 10 caracteres."
        error={errors.password}
      />
      <View style={{ gap: spacing.sm }}>
        <Chip
          label={ageConfirmed ? '✓ Tengo 18 años o más' : 'Tengo 18 años o más'}
          selected={ageConfirmed}
          onPress={() => setAgeConfirmed((value) => !value)}
        />
        {errors.ageConfirmed ? <Caption>{errors.ageConfirmed}</Caption> : null}
        <Chip
          label={termsAccepted ? '✓ Acepto los términos y el aviso de privacidad' : 'Acepto los términos y el aviso de privacidad'}
          selected={termsAccepted}
          onPress={() => setTermsAccepted((value) => !value)}
        />
        {errors.termsAccepted ? <Caption>{errors.termsAccepted}</Caption> : null}
      </View>
      {errors.form ? <Body muted>{errors.form}</Body> : null}
      <Button label="Continuar" onPress={onSubmit} loading={submitting} />
    </Screen>
  );
}
