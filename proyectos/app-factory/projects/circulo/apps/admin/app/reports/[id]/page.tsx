'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Gate } from '@/components/Gate';
import { supabase } from '@/lib/supabase';

export default function ReportDetail() {
  return (
    <Gate>
      <Detail />
    </Gate>
  );
}

function Detail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('reports').select('*').eq('id', params.id).maybeSingle();
      setReport(data ?? null);

      if (data) {
        const { data: actions } = await supabase
          .from('moderation_actions')
          .select('id, action, note, created_at')
          .eq('target_user_id', data.reported_user_id)
          .order('created_at', { ascending: false });
        setHistory(actions ?? []);
      }
    }
    void load();
  }, [params.id]);

  async function run(action: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true);
    const { error: actionError } = await action();
    setBusy(false);
    if (actionError) {
      setError(actionError.message);
      return;
    }
    router.push('/reports');
  }

  if (!report) return <p className="muted">Cargando…</p>;

  const target = report.reported_user_id as string;

  return (
    <>
      <h1>Reporte</h1>
      <div className="card">
        <p><strong>Categoría:</strong> {String(report.category)}</p>
        <p><strong>Estado:</strong> {String(report.status)}</p>
        <p><strong>Detalle:</strong> {String(report.details ?? '—')}</p>
        <p className="muted">Usuario reportado: {target}</p>
      </div>

      <div className="card">
        <h2>Acciones</h2>
        <label htmlFor="note">Nota interna</label>
        <textarea id="note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
        <div className="row" style={{ marginTop: 12 }}>
          <button
            data-variant="primary"
            disabled={busy}
            onClick={() => void run(() => supabase.rpc('moderate_resolve_report', { p_report_id: params.id, p_status: 'actioned', p_note: note }))}
          >
            Marcar como atendido
          </button>
          <button
            disabled={busy}
            onClick={() => void run(() => supabase.rpc('moderate_resolve_report', { p_report_id: params.id, p_status: 'dismissed', p_note: note }))}
          >
            Descartar
          </button>
          <button
            data-variant="danger"
            disabled={busy}
            onClick={() => void run(() => supabase.rpc('moderate_set_account_status', { p_user_id: target, p_status: 'suspended', p_report_id: params.id, p_note: note }))}
          >
            Suspender cuenta
          </button>
          <button
            data-variant="danger"
            disabled={busy}
            onClick={() => void run(() => supabase.rpc('moderate_set_account_status', { p_user_id: target, p_status: 'banned', p_report_id: params.id, p_note: note }))}
          >
            Expulsar
          </button>
        </div>
        {error ? <p role="alert">{error}</p> : null}
      </div>

      <div className="card">
        <h2>Historial de moderación</h2>
        {history.length === 0 ? <p className="muted">Sin acciones previas.</p> : (
          <ul>
            {history.map((action) => (
              <li key={String(action.id)}>
                {new Date(String(action.created_at)).toLocaleString('es-MX')} — {String(action.action)}
                {action.note ? ` · ${String(action.note)}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
