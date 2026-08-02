import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { interestLabels } from '@circulo/config';
import { Body, Button, Caption, Chip, Heading, Loading, Row, Screen, Divider } from '@/components/ui';
import { fetchPublicProfile } from '@/lib/api';
import { useUserId } from '@/lib/session';

export default function MyProfile() {
  const userId = useUserId();
  const profile = useQuery({
    queryKey: ['my-public-profile', userId],
    queryFn: () => fetchPublicProfile(userId as string),
    enabled: Boolean(userId),
  });

  if (profile.isPending) return <Screen scroll={false}><Loading /></Screen>;

  return (
    <Screen>
      <Heading>{profile.data ? `${profile.data.displayName}, ${profile.data.age}` : 'Mi perfil'}</Heading>
      <Caption>{profile.data?.areaLabel}</Caption>
      <Body>{profile.data?.bio}</Body>

      <Row>
        {(profile.data?.interests ?? []).map((slug) => (
          <Chip key={slug} label={interestLabels[slug] ?? slug} />
        ))}
      </Row>

      {profile.data?.photos.some((photo) => photo.moderationStatus === 'pending') ? (
        <Caption>Tienes una foto en revisión.</Caption>
      ) : null}

      <Divider />
      <Button label="Editar perfil" variant="secondary" onPress={() => router.push('/settings/edit-profile')} />
      <Button label="Preferencias" variant="secondary" onPress={() => router.push('/settings/preferences')} />
      <Button label="Privacidad" variant="secondary" onPress={() => router.push('/settings/privacy')} />
      <Button label="Seguridad" variant="secondary" onPress={() => router.push('/settings/safety')} />
      <Button label="Personas bloqueadas" variant="secondary" onPress={() => router.push('/settings/blocks')} />
      <Button label="Notificaciones" variant="secondary" onPress={() => router.push('/notifications')} />
      <Button label="Ayuda" variant="secondary" onPress={() => router.push('/settings/help')} />
      <Button label="Ajustes de cuenta" variant="secondary" onPress={() => router.push('/settings')} />
    </Screen>
  );
}
