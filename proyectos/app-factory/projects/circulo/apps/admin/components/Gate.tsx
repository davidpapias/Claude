'use client';

import { useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useStaff, type StaffRole } from '@/lib/useStaff';

/**
 * Staff login and role gate. The gate is a convenience: the real enforcement is
 * `is_staff()` in the database, which every moderation policy and RPC checks.
 */
export function Gate({ children, require = 'moderator' }: { children: ReactNode; require?: 'moderator' | 'admin' }) {
  const { role, loading, email } = useStaff();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (loading) return <p className="muted">Cargando…</p>;

  if (!role) {
    return (
      <form
        className="card"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          const { error: authError } = await supabase.auth.signInWithPassword(form);
          setBusy(false);
          setError(authError ? 'No pudimos iniciar sesión con esos datos.' : undefined);
        }}
      >
        <h1>Panel de moderación</h1>
        <p className="muted">Acceso solo para personal autorizado.</p>
        <label htmlFor="email">Correo</label>
        <input id="email" type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label htmlFor="password">Contraseña</label>
        <input id="password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error ? <p role="alert">{error}</p> : null}
        <p><button data-variant="primary" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button></p>
      </form>
    );
  }

  if (require === 'admin' && role !== 'admin') {
    return (
      <div className="card">
        <h1>Sin permisos suficientes</h1>
        <p className="muted">Esta sección es solo para administradores. Tu cuenta es {role}.</p>
      </div>
    );
  }

  return (
    <>
      <p className="muted">Sesión: {email} ({roleLabel(role)}) · <button onClick={() => void supabase.auth.signOut()}>Salir</button></p>
      {children}
    </>
  );
}

function roleLabel(role: StaffRole): string {
  return role === 'admin' ? 'administrador' : 'moderador';
}
