'use client';

import { useEffect, useState } from 'react';
import { Gate } from '@/components/Gate';
import { supabase } from '@/lib/supabase';

interface Row {
  id: string;
  display_name: string;
  account_status: string;
  profile_complete: boolean;
  created_at: string;
}

export default function Users() {
  return (
    <Gate>
      <UserList />
    </Gate>
  );
}

function UserList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [status, setStatus] = useState('all');
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  async function load() {
    const query = supabase
      .from('profiles')
      .select('id, display_name, account_status, profile_complete, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    const { data, error: queryError } = status === 'all' ? await query : await query.eq('account_status', status);
    if (queryError) setError(queryError.message);
    setRows(data ?? []);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function setAccountStatus(userId: string, next: string) {
    setBusy(userId);
    const { error: rpcError } = await supabase.rpc('moderate_set_account_status', {
      p_user_id: userId,
      p_status: next,
      p_note: 'Cambio desde el panel de usuarios.',
    });
    setBusy(undefined);
    if (rpcError) { setError(rpcError.message); return; }
    await load();
  }

  return (
    <>
      <h1>Usuarios</h1>
      <div className="row">
        {['all', 'active', 'suspended', 'banned', 'deleted'].map((value) => (
          <button key={value} onClick={() => setStatus(value)} data-variant={status === value ? 'primary' : undefined}>{value}</button>
        ))}
      </div>
      {error ? <p role="alert">{error}</p> : null}
      {!rows ? <p className="muted">Cargando…</p> : (
        <table>
          <caption className="muted">Cuentas registradas</caption>
          <thead><tr><th>Nombre</th><th>Estado</th><th>Perfil</th><th>Alta</th><th>Acciones</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.display_name}</td>
                <td>{row.account_status}</td>
                <td>{row.profile_complete ? 'completo' : 'incompleto'}</td>
                <td>{new Date(row.created_at).toLocaleDateString('es-MX')}</td>
                <td className="row">
                  {row.account_status === 'active' ? (
                    <button data-variant="danger" disabled={busy === row.id} onClick={() => void setAccountStatus(row.id, 'suspended')}>Suspender</button>
                  ) : row.account_status === 'suspended' ? (
                    <button disabled={busy === row.id} onClick={() => void setAccountStatus(row.id, 'active')}>Reactivar</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
