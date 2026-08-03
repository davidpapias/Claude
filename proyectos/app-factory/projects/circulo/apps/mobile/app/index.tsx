import { useEffect } from 'react';
import { Redirect, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, Loading, ErrorState } from '@/components/ui';
import { useSessionStore, useUserId } from '@/lib/session';
import { fetchMyState } from '@/lib/api';
import { humanError } from '@/lib/errors';

/**
 * Splash and routing decision: signed out → welcome, onboarding pending →
 * onboarding, suspended → a screen that explains it, otherwise → discovery.
 */
export default function Index() {
  const initializing = useSessionStore((state) => state.initializing);
  const userId = useUserId();

  const state = useQuery({
    queryKey: ['my-state', userId],
    queryFn: () => fetchMyState(userId as string),
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (state.data?.accountStatus === 'suspended') router.replace('/settings/suspended');
  }, [state.data?.accountStatus]);

  if (initializing) return <Screen scroll={false}><Loading label="Abriendo Círculo" /></Screen>;
  if (!userId) return <Redirect href="/welcome" />;
  if (state.isPending) return <Screen scroll={false}><Loading /></Screen>;
  if (state.isError) {
    return (
      <Screen scroll={false}>
        <ErrorState message={humanError(state.error)} onRetry={() => void state.refetch()} />
      </Screen>
    );
  }

  if (!state.data || !state.data.profileComplete) {
    return <Redirect href={{ pathname: '/onboarding/[step]', params: { step: state.data?.onboardingStep ?? 'identity' } }} />;
  }

  return <Redirect href="/(tabs)/discovery" />;
}
