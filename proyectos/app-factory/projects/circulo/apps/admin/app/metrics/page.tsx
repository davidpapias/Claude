'use client';

import { useEffect, useState } from 'react';
import { Gate } from '@/components/Gate';
import { supabase } from '@/lib/supabase';

interface Metrics {
  profiles: number;
  complete: number;
  matches: number;
  conversationsWithMessage: number;
  reports: number;
  blocks: number;
}

export default function MetricsPage() {
  return (
    <Gate>
      <Metrics />
    </Gate>
  );
}

function Metrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    async function load() {
      const [profiles, complete, matches, conversations, reports, blocks] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('profile_complete', true),
        supabase.from('matches').select('id', { count: 'exact', head: true }),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).not('last_message_at', 'is', null),
        supabase.from('reports').select('id', { count: 'exact', head: true }),
        supabase.from('blocks').select('id', { count: 'exact', head: true }),
      ]);

      setMetrics({
        profiles: profiles.count ?? 0,
        complete: complete.count ?? 0,
        matches: matches.count ?? 0,
        conversationsWithMessage: conversations.count ?? 0,
        reports: reports.count ?? 0,
        blocks: blocks.count ?? 0,
      });
    }
    void load();
  }, []);

  if (!metrics) return <p className="muted">Cargando…</p>;

  const percentage = (value: number, total: number) => (total === 0 ? '—' : `${Math.round((value / total) * 100)}%`);

  return (
    <>
      <h1>Métricas</h1>
      <p className="muted">
        La métrica norte es la cantidad de conexiones mutuas que producen conversaciones sanas y
        continuidad voluntaria. El tiempo dentro de la app no se usa como métrica de éxito.
      </p>
      <div className="row">
        <div className="card"><h2>{metrics.profiles}</h2><p className="muted">Perfiles</p></div>
        <div className="card"><h2>{percentage(metrics.complete, metrics.profiles)}</h2><p className="muted">Onboarding completado</p></div>
        <div className="card"><h2>{metrics.matches}</h2><p className="muted">Matches</p></div>
        <div className="card"><h2>{percentage(metrics.conversationsWithMessage, metrics.matches)}</h2><p className="muted">Matches con mensaje</p></div>
        <div className="card"><h2>{metrics.reports}</h2><p className="muted">Reportes</p></div>
        <div className="card"><h2>{metrics.blocks}</h2><p className="muted">Bloqueos</p></div>
      </div>
      <p className="muted">
        Las tasas por mil conversaciones y la retención semanal se calculan en `docs/analytics.md`
        con consultas SQL; el panel del MVP muestra los conteos base.
      </p>
    </>
  );
}
