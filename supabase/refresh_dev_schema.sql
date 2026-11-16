-- Rebuild the `dev` schema as a fresh copy of production (`public`).
--
-- Local `npm run dev` reads and writes `dev` (see NEXT_PUBLIC_SUPABASE_DB_SCHEMA
-- in .env.development), so testing never touches real data. Re-run this in the
-- Supabase SQL editor any time to reset dev to production: it DROPS everything
-- in `dev` first. It never writes to `public`.
--
-- Copied: every table in `public` except "(deprecated) ..." ones, with their
-- data, indexes, identity sequences, foreign keys, RLS policies, triggers,
-- grants, and every `public` function. References to those objects inside
-- functions, policies and triggers are re-pointed at `dev`. Shared with
-- production on purpose: auth users, enum types, and storage (photo) buckets.
--
-- One-time setup: Dashboard → Project Settings → Data API → Exposed schemas → add `dev`.

drop schema if exists dev cascade;
create schema dev;
grant usage on schema dev to anon, authenticated, service_role;

do $clone$
declare
  tables text[];
  names_re text;
  t text;
  r record;
  g record;
  def text;
  sig text;
begin
  -- Deparse everything fully qualified (public.x) so it can be re-pointed safely.
  perform set_config('search_path', 'pg_catalog', true);
  -- SQL functions call each other; don't validate bodies until all exist.
  perform set_config('check_function_bodies', 'off', true);

  select array_agg(c.relname::text order by c.relname) into tables
  from pg_class c
  where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
    and c.relname not like '(deprecated)%';

  -- Regex matching public.<cloned table or function>
  select 'public\.(' || string_agg(n, '|') || ')\y' into names_re
  from (
    select unnest(tables) as n
    union
    select p.proname::text from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
  ) s;

  -- 1. Tables (columns, defaults, checks, indexes, new identity sequences) + data
  foreach t in array tables loop
    execute format('create table dev.%I (like public.%I including all)', t, t);
    execute format('insert into dev.%I overriding system value select * from public.%I', t, t);
  end loop;

  -- 2. Identity sequences continue after the copied ids
  for r in
    select c.table_name, c.column_name from information_schema.columns c
    where c.table_schema = 'dev' and c.is_identity = 'YES'
  loop
    execute format(
      'select setval(pg_get_serial_sequence(%L, %L), coalesce(max(%I), 0) + 1, false) from dev.%I',
      'dev.' || quote_ident(r.table_name), r.column_name, r.column_name, r.table_name);
  end loop;

  -- 3. Foreign keys, pointed at dev tables (auth.users stays shared)
  for r in
    select c.conname, c.conrelid::regclass as rel, pg_get_constraintdef(c.oid) as condef,
           (select relname from pg_class where oid = c.conrelid) as tbl
    from pg_constraint c
    where c.contype = 'f' and c.connamespace = 'public'::regnamespace
  loop
    continue when not r.tbl = any(tables);
    execute format('alter table dev.%I add constraint %I %s',
      r.tbl, r.conname, regexp_replace(r.condef, names_re, 'dev.\1', 'g'));
  end loop;

  -- 4. Functions, re-pointed at dev, with the same EXECUTE grants
  for r in
    select p.oid, p.proname, p.proacl, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
  loop
    def := regexp_replace(pg_get_functiondef(r.oid), names_re, 'dev.\1', 'g');
    execute def;
    sig := format('dev.%I(%s)', r.proname, r.args);
    -- Unqualified names inside bodies resolve to dev first.
    execute format('alter function %s set search_path = dev, public, extensions', sig);
    if r.proacl is not null then
      execute format('revoke all on function %s from public', sig);
      for g in
        select distinct case when a.grantee = 0 then 'public' else quote_ident(pg_get_userbyid(a.grantee)) end as role
        from aclexplode(r.proacl) a where a.privilege_type = 'EXECUTE'
      loop
        execute format('grant execute on function %s to %s', sig, g.role);
      end loop;
    end if;
  end loop;

  -- 5. Table grants and RLS flags, same as production
  for r in
    select c.relname::text as tbl, c.relacl, c.relrowsecurity, c.relforcerowsecurity
    from pg_class c
    where c.relnamespace = 'public'::regnamespace and c.relname = any(tables)
  loop
    for g in
      select case when a.grantee = 0 then 'public' else quote_ident(pg_get_userbyid(a.grantee)) end as role,
             a.privilege_type
      from aclexplode(r.relacl) a
    loop
      execute format('grant %s on dev.%I to %s', g.privilege_type, r.tbl, g.role);
    end loop;
    if r.relrowsecurity then execute format('alter table dev.%I enable row level security', r.tbl); end if;
    if r.relforcerowsecurity then execute format('alter table dev.%I force row level security', r.tbl); end if;
  end loop;
  grant usage, select on all sequences in schema dev to anon, authenticated, service_role;

  -- 6. RLS policies, re-pointed at dev
  for r in
    select p.polname, c.relname::text as tbl, p.polpermissive, p.polcmd,
           pg_get_expr(p.polqual, p.polrelid) as qual,
           pg_get_expr(p.polwithcheck, p.polrelid) as chk,
           (select string_agg(case when x = 0 then 'public' else quote_ident(pg_get_userbyid(x)) end, ', ')
              from unnest(p.polroles) x) as roles
    from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relnamespace = 'public'::regnamespace and c.relname = any(tables)
  loop
    execute format('create policy %I on dev.%I as %s for %s to %s%s%s',
      r.polname, r.tbl,
      case when r.polpermissive then 'permissive' else 'restrictive' end,
      case r.polcmd when 'r' then 'select' when 'a' then 'insert' when 'w' then 'update'
                    when 'd' then 'delete' else 'all' end,
      r.roles,
      case when r.qual is null then '' else ' using (' || regexp_replace(r.qual, names_re, 'dev.\1', 'g') || ')' end,
      case when r.chk is null then '' else ' with check (' || regexp_replace(r.chk, names_re, 'dev.\1', 'g') || ')' end);
  end loop;

  -- 7. Triggers, re-pointed at dev tables and functions
  for r in
    select pg_get_triggerdef(tg.oid) as tdef
    from pg_trigger tg join pg_class c on c.oid = tg.tgrelid
    where not tg.tgisinternal and c.relnamespace = 'public'::regnamespace and c.relname = any(tables)
  loop
    execute regexp_replace(r.tdef, names_re, 'dev.\1', 'g');
  end loop;
end
$clone$;

-- Let the API see the new tables right away.
notify pgrst, 'reload schema';
