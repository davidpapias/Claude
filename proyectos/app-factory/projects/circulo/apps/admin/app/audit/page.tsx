'use client';

import { useEffect, useState } from 'react';
import { Gate } from '@/components/Gate';
import { supabase } from '@/lib/supabase';

export default function Audit() {
  return (
    <Gate require="admin">
      <AuditLog />
    </Gate>
  );
}

function AuditLog() {
  const [rows, setRows] = useState<Array<Record<string, unknown>> | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('audit_logs')
        .select('id, action, entity_type, entity_id, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      setRows(data ?? []);
    }
    void load();
  }, []);

  return (
    <>
      <h1>Registro de auditoría</h1>
      <p className="muted">Solo administradores. El registro es de solo escritura: nadie puede editarlo ni borrarlo.</p>
      {!rows ? <p className="muted">Cargando…</p> : (
        <table>
          <caption className="muted">Últimas 100 acciones</caption>
          <thead><tr><th>Fecha</th><th>Acción</th><th>Entidad</th><th>Metadatos</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)}>
                <td>{new Date(String(row.created_at)).toLocaleString('es-MX')}</td>
                <td>{String(row.action)}</td>
                <td>{String(row.entity_type)}</td>
                <td><code>{JSON.stringify(row.metadata)}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
