import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Body, Button, Card, EmptyState, Heading, Loading, Screen } from '@/components/ui';
import { fetchBlocks, unblockUser } from '@/lib/api';
import { useUserId } from '@/lib/session';

export default function Blocks() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const blocks = useQuery({ queryKey: ['blocks', userId], queryFn: fetchBlocks, enabled: Boolean(userId) });

  const unblock = useMutation({
    mutationFn: (id: string) => unblockUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blocks'] }),
  });

  if (blocks.isPending) return <Screen scroll={false}><Loading /></Screen>;

  if ((blocks.data ?? []).length === 0) {
    return (
      <Screen scroll={false}>
        <EmptyState title="No has bloqueado a nadie" body="Si bloqueas a alguien, aparecerá aquí y podrás desbloquearlo." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Heading>Personas bloqueadas</Heading>
      {(blocks.data ?? []).map((block) => (
        <Card key={block.id}>
          <Body>Bloqueado el {new Date(block.createdAt).toLocaleDateString('es-MX')}</Body>
          <Button label="Desbloquear" variant="secondary" onPress={() => unblock.mutate(block.blockedId)} />
        </Card>
      ))}
    </Screen>
  );
}
