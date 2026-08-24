-- ITExpresSolutions - NOTIFICACIONES DE TRABAJOS
-- Ejecutar una vez en Supabase > SQL Editor.

create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null default 'trabajo_asignado',
  titulo text not null,
  mensaje text not null,
  trabajo_id uuid null references public.trabajos(id) on delete cascade,
  leida boolean not null default false,
  creado_at timestamptz not null default now()
);

create index if not exists notificaciones_usuario_fecha_idx
  on public.notificaciones(usuario_id, creado_at desc);

alter table public.notificaciones enable row level security;

drop policy if exists "usuarios ven sus notificaciones" on public.notificaciones;
drop policy if exists "usuarios marcan sus notificaciones" on public.notificaciones;

create policy "usuarios ven sus notificaciones"
on public.notificaciones
for select
to authenticated
using (usuario_id = auth.uid());

create policy "usuarios marcan sus notificaciones"
on public.notificaciones
for update
to authenticated
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

-- Crear una notificación cuando se crea un trabajo ya asignado
-- o cuando un trabajo cambia de técnico.
create or replace function public.notificar_trabajo_asignado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tecnico_id is not null
     and (tg_op = 'INSERT' or old.tecnico_id is distinct from new.tecnico_id) then
    insert into public.notificaciones(usuario_id, tipo, titulo, mensaje, trabajo_id)
    values (
      new.tecnico_id,
      'trabajo_asignado',
      'Nuevo trabajo asignado',
      'Se te asignó: ' || coalesce(new.titulo, 'Nuevo trabajo') ||
      case when new.fecha_programada is not null
        then ' • Programado: ' || to_char(new.fecha_programada at time zone 'America/Mexico_City', 'DD/MM/YYYY HH24:MI')
        else '' end,
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notificar_trabajo_asignado on public.trabajos;
create trigger trg_notificar_trabajo_asignado
after insert or update of tecnico_id on public.trabajos
for each row execute function public.notificar_trabajo_asignado();

-- Activar Realtime para que el técnico reciba el aviso mientras tiene el portal abierto.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notificaciones'
  ) then
    alter publication supabase_realtime add table public.notificaciones;
  end if;
end $$;

-- Verificación
select count(*) as notificaciones from public.notificaciones;
select tablename, rowsecurity from pg_tables
where schemaname='public' and tablename='notificaciones';
