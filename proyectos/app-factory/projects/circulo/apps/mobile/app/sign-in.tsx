import { useState } from 'react';
import { router } from 'expo-router';
import { Body, Button, Field, Heading, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { signInSchema } from '@circulo/validation';
import { humanError } from '@/lib/errors';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }

    setErrors({});
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);

    if (error) {
      setErrors({ form: humanError(error) });
      return;
    }
    router.replace('/');
  }

  return (
    <Screen>
      <Heading>Iniciar sesión</Heading>
      <Field
        label="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        error={errors.email}
      />
      <Field
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="password"
        error={errors.password}
      />
      {errors.form ? <Body muted>{errors.form}</Body> : null}
      <Button label="Entrar" onPress={onSubmit} loading={submitting} />
      <Button
        label="Olvidé mi contraseña"
        variant="quiet"
        onPress={() => router.push('/reset-password')}
      />
    </Screen>
  );
}
