import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { INTEREST_CATALOG } from '@circulo/config';
import { bioStepSchema, interestsStepSchema } from '@circulo/validation';
import { Body, Button, Caption, Chip, Field, Heading, Loading, Row, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useUserId } from '@/lib/session';
import { fetchPublicProfile } from '@/lib/api';
import { saveInterests } from '@/lib/onboarding';
import { humanError } from '@/lib/errors';

export default function EditProfile() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const [bio, setBio] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[] | null>(null);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  const profile = useQuery({
    queryKey: ['my-public-profile', userId],
    queryFn: async () => {
      const data = await fetchPublicProfile(userId as string);
      if (data) {
        if (bio === null) setBio(data.bio);
        if (interests === null) setInterests(data.interests);
      }
      return data;
    },
    enabled: Boolean(userId),
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsedBio = bioStepSchema.safeParse({ bio, conversationTopics: [], wantsToTry: [] });
      if (!parsedBio.success) throw new Error(parsedBio.error.issues[0]?.message ?? 'Revisa tu descripción');

      const parsedInterests = interestsStepSchema.safeParse({ interests });
      if (!parsedInterests.success) throw new Error(parsedInterests.error.issues[0]?.message ?? 'Revisa tus intereses');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ bio: parsedBio.data.bio })
        .eq('id', userId as string);
      if (updateError) throw new Error(updateError.message);

      await saveInterests(userId as string, parsedInterests.data.interests);
    },
    onSuccess: async () => {
      setSaved(true);
      setError(undefined);
      await queryClient.invalidateQueries({ queryKey: ['my-public-profile'] });
    },
    onError: (caught) => setError(humanError(caught)),
  });

  if (profile.isPending || bio === null || interests === null) {
    return <Screen scroll={false}><Loading /></Screen>;
  }

  return (
    <Screen>
      <Heading>Editar perfil</Heading>
      <Field label="Sobre ti" value={bio} onChangeText={setBio} multiline numberOfLines={5} />
      <Caption>Intereses</Caption>
      <Row>
        {INTEREST_CATALOG.map((interest) => (
          <Chip
            key={interest.slug}
            label={interest.label}
            selected={interests.includes(interest.slug)}
            onPress={() =>
              setInterests(
                interests.includes(interest.slug)
                  ? interests.filter((slug) => slug !== interest.slug)
                  : [...interests, interest.slug],
              )
            }
          />
        ))}
      </Row>
      {error ? <Body muted>{error}</Body> : null}
      {saved ? <Caption>Guardado.</Caption> : null}
      <Button label="Guardar" loading={save.isPending} onPress={() => save.mutate()} />
    </Screen>
  );
}
