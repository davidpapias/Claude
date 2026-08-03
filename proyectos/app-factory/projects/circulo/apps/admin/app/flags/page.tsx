'use client';

import { useEffect, useState } from 'react';
import { Gate } from '@/components/Gate';
import { supabase } from '@/lib/supabase';

interface Flag { key: string; enabled: boolean; description: string | null }

export default function Flags() {
  return (
    <Gate require="admin">
      <FeatureFlags />
    </Gate>
  );
}

function FeatureFlags() {
  const [flags, setFlags] = useState<Flag[] | null>(null);
  const [error, setError] = useState<string>();

  async function load() {
    const { data, error: queryError } = await supabase.from('feature_flags').select('key, enabled, description').order('key');
    if (queryError) setError(queryError.message);
    setFlags(data ?? []);
  }

  useEffect(() => { void load(); }, []);

  async function toggle(flag: Flag) {
    const { error: updateError } = await supabase.from('feature_flags').update({ enabled: !flag.enabled }).eq('key', flag.key);
    if (updateError) { setError(updateError.message); return; }
    await load();
  }

  return (
    <>
      <h1>Banderas de funcionalidades</h1>
      {error ? <p role="alert">{error}</p> : null}
      {!flags ? <p className="muted">Cargando…</p> : (
        <table>
          <caption className="muted">Solo administradores pueden cambiarlas</caption>
          <thead><tr><th>Clave</th><th>Descripción</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {flags.map((flag) => (
              <tr key={flag.key}>
                <td><code>{flag.key}</code></td>
                <td>{flag.description}</td>
                <td>{flag.enabled ? 'activa' : 'inactiva'}</td>
                <td><button onClick={() => void toggle(flag)}>{flag.enabled ? 'Desactivar' : 'Activar'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
