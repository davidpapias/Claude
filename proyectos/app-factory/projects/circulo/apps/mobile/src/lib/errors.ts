/** Turns a Supabase/Postgres error into something a person can act on. */
export function humanError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (/rate limit/i.test(message)) {
    return 'Vas muy rápido. Espera un momento e inténtalo otra vez.';
  }
  if (/not allowed|42501/i.test(message)) {
    return 'Esta acción ya no está disponible.';
  }
  if (/match no longer active/i.test(message)) {
    return 'Esta conversación ya no está activa.';
  }
  if (/Invalid login credentials/i.test(message)) {
    return 'Correo o contraseña incorrectos.';
  }
  if (/User already registered/i.test(message)) {
    return 'Ya existe una cuenta con este correo.';
  }
  if (/Network request failed|fetch failed/i.test(message)) {
    return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.';
  }
  return 'Algo no salió bien. Inténtalo de nuevo.';
}

export function isOfflineError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /Network request failed|fetch failed|Failed to fetch/i.test(message);
}
