import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface SessionState {
  session: Session | null;
  initializing: boolean;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  initializing: true,
  setSession: (session) => set({ session, initializing: false }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },
}));

/** Called once from the root layout. */
export function bootstrapSession(): () => void {
  void supabase.auth.getSession().then(({ data }) => {
    useSessionStore.getState().setSession(data.session);
  });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useSessionStore.getState().setSession(session);
  });

  return () => data.subscription.unsubscribe();
}

export function useUserId(): string | null {
  return useSessionStore((state) => state.session?.user.id ?? null);
}
