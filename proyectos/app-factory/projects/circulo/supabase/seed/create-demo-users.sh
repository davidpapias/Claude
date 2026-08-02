#!/usr/bin/env bash
# Sets passwords for the demo accounts through the local Auth API.
# Local development only — it uses the service role key from your .env.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck disable=SC1091
[ -f "$ROOT/.env" ] && set -a && . "$ROOT/.env" && set +a

: "${SUPABASE_SERVICE_ROLE_KEY:?Define SUPABASE_SERVICE_ROLE_KEY en .env}"
URL="${EXPO_PUBLIC_SUPABASE_URL:-http://127.0.0.1:54321}"
PASSWORD="demo-circulo-2026"

for email in ana beto caro nuevo mod admin; do
  curl -sS -X POST "$URL/auth/v1/admin/users" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}@demo.circulo.app\",\"password\":\"${PASSWORD}\",\"email_confirm\":true}" \
    > /dev/null || echo "  (ya existía: ${email}@demo.circulo.app)"
  echo "listo: ${email}@demo.circulo.app"
done

echo
echo "Contraseña para todas las cuentas: ${PASSWORD}"
