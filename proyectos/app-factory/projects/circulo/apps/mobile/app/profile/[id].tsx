import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'react-native';
import { interestLabels } from '@circulo/config';
import { Body, Button, Caption, Chip, EmptyState, Heading, Loading, Row, Screen, Divider } from '@/components/ui';
import { fetchPublicProfile } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const BLOCK_LABELS = { morning: 'mañana', afternoon: 'tarde', evening: 'noche' } as const;
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export default function ProfileDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const profile = useQuery({
    queryKey: ['public-profile', id],
    queryFn: () => fetchPublicProfile(id),
    enabled: Boolean(id),
  });

  const photo = useQuery({
    queryKey: ['photo-url', profile.data?.photos[0]?.storagePath],
    queryFn: async () => {
      const path = profile.data?.photos[0]?.storagePath;
      if (!path) return null;
      const { data } = await supabase.storage.from('profile-photos').createSignedUrl(path, 600);
      return data?.signedUrl ?? null;
    },
    enabled: Boolean(profile.data?.photos[0]?.storagePath),
  });

  if (profile.isPending) return <Screen scroll={false}><Loading /></Screen>;

  if (!profile.data) {
    return (
      <Screen scroll={false}>
        <EmptyState
          title="Perfil no disponible"
          body="Esta persona ya no está disponible o la conexión se interrumpió."
          action={{ label: 'Volver', onPress: () => router.back() }}
        />
      </Screen>
    );
  }

  const p = profile.data;

  return (
    <Screen>
      {photo.data ? (
        <Image
          source={{ uri: photo.data }}
          style={{ width: '100%', height: 360, borderRadius: 14 }}
          accessibilityLabel={`Foto de ${p.displayName}`}
        />
      ) : null}

      <Heading>{`${p.displayName}, ${p.age}`}</Heading>
      <Caption>{p.areaLabel}{p.pronouns ? ` · ${p.pronouns}` : ''}</Caption>
      <Body>{p.bio}</Body>

      <Caption>Intereses</Caption>
      <Row>{p.interests.map((slug) => <Chip key={slug} label={interestLabels[slug] ?? slug} />)}</Row>

      <Caption>Suele estar libre</Caption>
      <Row>
        {p.availability.slice(0, 8).map((slot) => (
          <Chip key={`${slot.weekday}-${slot.block}`} label={`${WEEKDAYS[slot.weekday]} ${BLOCK_LABELS[slot.block]}`} />
        ))}
      </Row>

      {p.boundaries.length > 0 ? (
        <>
          <Caption>Sus límites</Caption>
          {p.boundaries.map((boundary) => <Body key={boundary} muted>· {boundary}</Body>)}
        </>
      ) : null}

      <Divider />
      <Button
        label="Reportar"
        variant="secondary"
        onPress={() => router.push({ pathname: '/report/[userId]', params: { userId: p.userId } })}
      />
      <Button
        label="Bloquear"
        variant="danger"
        onPress={() => router.push({ pathname: '/report/[userId]', params: { userId: p.userId, block: '1' } })}
      />
    </Screen>
  );
}
