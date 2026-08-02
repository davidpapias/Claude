import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Body, Caption, Card, EmptyState, Loading, Screen, Heading } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useUserId } from '@/lib/session';

const KIND_LABELS: Record<string, string> = {
  new_match: 'Nueva conexión',
  new_message: 'Mensaje nuevo',
  conversation_reminder: 'Recordatorio de conversación',
  security: 'Seguridad',
  account: 'Tu cuenta',
};

export default function Notifications() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const notifications = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, kind, payload, read_at, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);

      const unread = (data ?? []).filter((row) => !row.read_at).map((row) => row.id);
      if (unread.length > 0) {
        await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', unread);
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
      return data ?? [];
    },
    enabled: Boolean(userId),
  });

  if (notifications.isPending) return <Screen scroll={false}><Loading /></Screen>;

  if ((notifications.data ?? []).length === 0) {
    return (
      <Screen scroll={false}>
        <EmptyState title="Sin novedades" body="Aquí verás tus conexiones y mensajes nuevos." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Heading>Notificaciones</Heading>
      {(notifications.data ?? []).map((notification) => (
        <Card key={notification.id}>
          <Body>{KIND_LABELS[notification.kind] ?? notification.kind}</Body>
          <Caption>{new Date(notification.created_at).toLocaleString('es-MX')}</Caption>
        </Card>
      ))}
    </Screen>
  );
}
