import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Body, Button, Caption, Chip, Field, Heading, Loading, Row, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useUserId } from '@/lib/session';
import { distanceStepSchema } from '@circulo/validation';
import { humanError } from '@/lib/errors';

export default function Preferences() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<{ maxDistanceKm: number; minAge: number; maxAge: number } | null>(null);

  const preferences = useQuery({
    queryKey: ['preferences', userId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('profile_preferences')
        .select('max_distance_km, min_age, max_age, hide_from_discovery')
        .eq('user_id', userId as string)
        .maybeSingle();
      if (queryError) throw new Error(queryError.message);
      if (data && !form) {
        setForm({ maxDistanceKm: data.max_distance_km, minAge: data.min_age, maxAge: data.max_age });
      }
      return data;
    },
    enabled: Boolean(userId),
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = distanceStepSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Revisa los datos');
      const { error: updateError } = await supabase
        .from('profile_preferences')
        .update({
          max_distance_km: parsed.data.maxDistanceKm,
          min_age: parsed.data.minAge,
          max_age: parsed.data.maxAge,
        })
        .eq('user_id', userId as string);
      if (updateError) throw new Error(updateError.message);
    },
    onSuccess: async () => {
      setSaved(true);
      setError(undefined);
      await queryClient.invalidateQueries({ queryKey: ['discovery-candidates'] });
    },
    onError: (caught) => setError(humanError(caught)),
  });

  if (preferences.isPending || !form) return <Screen scroll={false}><Loading /></Screen>;

  return (
    <Screen>
      <Heading>Preferencias</Heading>
      <Caption>Distancia máxima</Caption>
      <Row>
        {[5, 10, 15, 25, 40, 60].map((km) => (
          <Chip
            key={km}
            label={`${km} km`}
            selected={form.maxDistanceKm === km}
            onPress={() => setForm({ ...form, maxDistanceKm: km })}
          />
        ))}
      </Row>
      <Field label="Edad mínima" keyboardType="number-pad" value={String(form.minAge)} onChangeText={(v) => setForm({ ...form, minAge: Number(v) || 18 })} />
      <Field label="Edad máxima" keyboardType="number-pad" value={String(form.maxAge)} onChangeText={(v) => setForm({ ...form, maxAge: Number(v) || 99 })} />
      {error ? <Body muted>{error}</Body> : null}
      {saved ? <Caption>Guardado.</Caption> : null}
      <Button label="Guardar" loading={save.isPending} onPress={() => save.mutate()} />
    </Screen>
  );
}
