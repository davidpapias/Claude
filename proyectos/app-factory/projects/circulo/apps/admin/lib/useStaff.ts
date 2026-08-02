'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export type StaffRole = 'moderator' | 'admin' | null;

export function useStaff(): { role: StaffRole; loading: boolean; email: string | null } {
  const [role, setRole] = useState<StaffRole>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) {
        if (active) { setRole(null); setLoading(false); }
        return;
      }

      const { data } = await supabase
        .from('staff_members')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (active) {
        setEmail(session.user.email ?? null);
        setRole((data?.role as StaffRole) ?? null);
        setLoading(false);
      }
    }

    void load();
    const { data } = supabase.auth.onAuthStateChange(() => void load());
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { role, loading, email };
}
