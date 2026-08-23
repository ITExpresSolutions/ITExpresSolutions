-- ============================================================
-- ITExpresSolutions - FIX RLS / ADMIN
-- Proyecto: wfdxbgohwejawmkpninz
-- Ejecutar UNA VEZ en Supabase > SQL Editor
-- ============================================================

-- 1) Función segura para comprobar si el usuario autenticado es admin.
-- SECURITY DEFINER evita la recursión de RLS sobre public_profiles.
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.public_profiles p
    where p.id = auth.uid()
      and p.rol = 'admin'
      and p.activo = true
  );
$$;

revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to authenticated;

-- 2) Asegurar RLS.
alter table public.public_profiles enable row level security;
alter table public.trabajos enable row level security;

-- 3) Recrear políticas de public_profiles sin recursión.
drop policy if exists "admin puede crear perfiles" on public.public_profiles;
drop policy if exists "admin puede modificar perfiles" on public.public_profiles;
drop policy if exists "usuarios pueden ver su perfil" on public.public_profiles;

create policy "admin puede crear perfiles"
on public.public_profiles
for insert
to authenticated
with check (public.es_admin());

create policy "admin puede modificar perfiles"
on public.public_profiles
for update
using (public.es_admin())
with check (public.es_admin());

create policy "usuarios pueden ver su perfil"
on public.public_profiles
for select
to authenticated
using ((id = auth.uid()) or public.es_admin());

-- 4) Recrear políticas de trabajos.
drop policy if exists "admin puede crear trabajos" on public.trabajos;
drop policy if exists "admin puede eliminar trabajos" on public.trabajos;
drop policy if exists "admin puede modificar trabajos" on public.trabajos;
drop policy if exists "admin puede ver todos los trabajos" on public.trabajos;

create policy "admin puede crear trabajos"
on public.trabajos
for insert
to authenticated
with check (public.es_admin());

create policy "admin puede eliminar trabajos"
on public.trabajos
for delete
to authenticated
using (public.es_admin());

create policy "admin puede modificar trabajos"
on public.trabajos
for update
to authenticated
using (public.es_admin() or tecnico_id = auth.uid())
with check (public.es_admin() or tecnico_id = auth.uid());

create policy "admin puede ver todos los trabajos"
on public.trabajos
for select
to authenticated
using (public.es_admin() or tecnico_id = auth.uid());

-- 5) Comprobación final.
select
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('public_profiles','trabajos')
order by tablename;

select
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('public_profiles','trabajos')
order by tablename, policyname;

-- Después de ejecutar esto, vuelve al sitio y prueba:
-- juanbarron@live.com
-- y la contraseña que ya tienes configurada en Supabase Auth.
