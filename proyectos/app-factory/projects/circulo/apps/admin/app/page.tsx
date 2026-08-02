'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gate } from '@/components/Gate';
import { supabase } from '@/lib/supabase';

export default function Overview() {
  return (
    <Gate>
      <Summary />
    </Gate>
  );
}

function Summary() {
  const [counts, setCounts] = useState<{ open: number; suspended: number; flags: number } | null>(null);

  useEffect(() => {
    async function load() {
      const [open, suspended, flags] = await Promise.all([
        supabase.from('reports').select('id', { count: 'exact', head: true }).in('status', ['open', 'under_review']),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'suspended'),
        supabase.from('account_flags').select('id', { count: 'exact', head: true }).is('cleared_at', null),
      ]);
      setCounts({ open: open.count ?? 0, suspended: suspended.count ?? 0, flags: flags.count ?? 0 });
    }
    void load();
  }, []);

  return (
    <>
      <h1>Resumen operativo</h1>
      {!counts ? (
        <p className="muted">Cargando…</p>
      ) : (
        <div className="row">
          <div className="card"><h2>{counts.open}</h2><p className="muted">Reportes por revisar</p><Link href="/reports">Ver cola</Link></div>
          <div className="card"><h2>{counts.suspended}</h2><p className="muted">Cuentas suspendidas</p><Link href="/users">Ver usuarios</Link></div>
          <div className="card"><h2>{counts.flags}</h2><p className="muted">Marcas activas</p></div>
        </div>
      )}
    </>
  );
}
