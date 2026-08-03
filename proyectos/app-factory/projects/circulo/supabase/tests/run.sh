#!/usr/bin/env bash
# Applies the migrations to a throwaway PostgreSQL database and runs the
# security assertions. Requires a running PostgreSQL 16 and psql.
#
#   PGHOST=... PGPORT=... PGUSER=postgres ./supabase/tests/run.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DB="${CIRCULO_TEST_DB:-circulo_test}"

psql -v ON_ERROR_STOP=1 -q -c "drop database if exists ${DB};" postgres
psql -v ON_ERROR_STOP=1 -q -c "create database ${DB};" postgres

psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$ROOT/supabase/tests/harness.sql" > /dev/null

for migration in "$ROOT"/supabase/migrations/000[1-7]*.sql; do
  echo "applying $(basename "$migration")"
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$migration" > /dev/null
done
# 0008_storage.sql needs Supabase's storage schema and is applied by `supabase db reset`.

psql -v ON_ERROR_STOP=1 -d "$DB" -f "$ROOT/supabase/tests/rls.test.sql" 2>&1 \
  | grep -E 'ok —|ASSERTION|ERROR|All database'
