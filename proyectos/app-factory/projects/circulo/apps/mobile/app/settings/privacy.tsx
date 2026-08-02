import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Body, Button, Caption, Chip, Heading, Loading, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useUserId } from '@/lib/session';
import { humanError } from '@/lib/errors';

export default function Privacy() {
  const userId = useUserId();
  const [error, setError] = useState<string>();
  const [hidden, setHidden] = useState<boolean | null>(null);

  const preferences = useQuery({
    queryKey: ['preferences', userId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('profile_preferences')
        .select('hide_from_discovery')
        .eq('user_id', userId as string)
        .maybeSingle();
      if (queryError) throw new Error(queryError.message);
      if (data && hidden === null) setHidden(data.hide_from_discovery);
      return data;
    },
    enabled: Boolean(userId),
  });

  const toggle = useMutation({
    mutationFn: async (value: boolean) => {
      const { error: updateError } = await supabase
        .from('profile_preferences')
        .update({ hide_from_discovery: value })
        .eq('user_id', userId as string);
      if (updateError) throw new Error(updateError.message);
      setHidden(value);
    },
    onError: (caught) => setError(humanError(caught)),
  });

  if (preferences.isPending) return <Screen scroll={false}><Loading /></Screen>;

  return (
    <Screen>
      <Heading>Privacidad</Heading>
      <Body muted>
        Tu ubicación exacta nunca se comparte. Otras personas solo ven la zona que escribiste y una
        distancia aproximada.
      </Body>
      <Caption>Visibilidad</Caption>
      <Chip
        label={hidden ? 'Estoy oculto en descubrimiento' : 'Aparezco en descubrimiento'}
        selected={!hidden}
        onPress={() => toggle.mutate(!hidden)}
      />
      <Body muted>
        Mientras estés oculto, nadie nuevo puede verte. Tus conversaciones actuales siguen
        funcionando.
      </Body>
      <Caption>Qué guardamos</Caption>
      <Body muted>· Tu perfil y preferencias.</Body>
      <Body muted>· Tus decisiones de descubrimiento, para no repetir perfiles.</Body>
      <Body muted>· Tus mensajes, para que puedas leerlos.</Body>
      <Body muted>· Eventos de uso sin contenido privado.</Body>
      {error ? <Body muted>{error}</Body> : null}
    </Screen>
  );
}
