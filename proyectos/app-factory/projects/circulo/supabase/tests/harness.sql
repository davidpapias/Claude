-- Minimal stand-in for the pieces of Supabase the schema depends on, so the
-- migrations and the RLS tests can run against a plain PostgreSQL 16 instance.
-- It is only used by `pnpm db:test`; the real project uses Supabase's own auth
-- schema, which provides the same `auth.users` table and `auth.uid()` function.

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end
$$;

grant usage on schema auth to anon, authenticated, service_role;

-- Test helper: fails loudly instead of returning a wrong answer quietly.
create or replace function assert_true(p_condition boolean, p_message text)
returns void
language plpgsql
as $$
begin
  if p_condition is distinct from true then
    raise exception 'ASSERTION FAILED: %', p_message;
  end if;
  raise notice '  ok — %', p_message;
end;
$$;

create or replace function login_as(p_user uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, false);
  perform set_config('role', 'authenticated', false);
end;
$$;

create or replace function login_as_service()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', '', false);
  perform set_config('role', 'postgres', false);
end;
$$;
