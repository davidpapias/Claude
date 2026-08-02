'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gate } from '@/components/Gate';
import { supabase } from '@/lib/supabase';

interface ReportRow {
  id: string;
  reported_user_id: string;
  category: string;
  status: string;
  created_at: string;
  details: string | null;
}

export default function Reports() {
  return (
    <Gate>
      <ReportQueue />
    </Gate>
  );
}

function ReportQueue() {
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [status, setStatus] = useState('open');
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function load() {
      const query = supabase
        .from('reports')
        .select('id, reported_user_id, category, status, created_at, details')
        .order('created_at', { ascending: false })
        .limit(50);

      const { data, error: queryError } = status === 'all' ? await query : await query.eq('status', status);
      if (queryError) setError(queryError.message);
      setRows(data ?? []);
    }
    void load();
  }, [status]);

  return (
    <>
      <h1>Reportes</h1>
      <div className="row">
        {['open', 'under_review', 'actioned', 'dismissed', 'all'].map((value) => (
          <button key={value} onClick={() => setStatus(value)} data-variant={status === value ? 'primary' : undefined}>
            {value}
          </button>
        ))}
      </div>

      {error ? <p role="alert">{error}</p> : null}
      {!rows ? <p className="muted">Cargando…</p> : rows.length === 0 ? (
        <p className="muted">No hay reportes en este estado.</p>
      ) : (
        <table>
          <caption className="muted">Reportes más recientes</caption>
          <thead>
            <tr><th>Fecha</th><th>Categoría</th><th>Estado</th><th>Detalle</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((report) => (
              <tr key={report.id}>
                <td>{new Date(report.created_at).toLocaleString('es-MX')}</td>
                <td>{report.category}</td>
                <td>{report.status}</td>
                <td>{report.details ?? '—'}</td>
                <td><Link href={`/reports/${report.id}`}>Revisar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
