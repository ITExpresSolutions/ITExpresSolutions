-- ITExpresSolutions - Bot de tickets sin IA
-- Ejecutar UNA VEZ en Supabase > SQL Editor.
-- Permite que un visitante anónimo cree un ticket desde el bot.

create or replace function public.crear_ticket_web(
  p_pais text,
  p_ciudad text,
  p_servicio text,
  p_equipo text,
  p_problema text,
  p_nombre text,
  p_contacto text,
  p_prioridad text default 'normal'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_prioridad text;
  v_titulo text;
  v_descripcion text;
begin
  if length(trim(coalesce(p_nombre,''))) < 2 then
    raise exception 'El nombre es obligatorio.';
  end if;

  if length(trim(coalesce(p_contacto,''))) < 5 then
    raise exception 'El teléfono, WhatsApp o correo es obligatorio.';
  end if;

  if length(trim(coalesce(p_problema,''))) < 5 then
    raise exception 'Describe brevemente el problema o solicitud.';
  end if;

  if lower(trim(coalesce(p_pais,''))) not in ('méxico','mexico','costa rica') then
    raise exception 'País no válido.';
  end if;

  v_prioridad := case lower(trim(coalesce(p_prioridad,'normal')))
    when 'urgente' then 'urgente'
    when 'alta' then 'alta'
    else 'normal'
  end;

  v_titulo := 'Solicitud web - ' || left(trim(coalesce(p_servicio,'Soporte técnico')), 80);

  v_descripcion :=
    'País: ' || left(trim(coalesce(p_pais,'')), 80) || E'\n' ||
    'Ciudad: ' || left(trim(coalesce(p_ciudad,'')), 120) || E'\n' ||
    'Servicio: ' || left(trim(coalesce(p_servicio,'')), 120) || E'\n' ||
    'Equipo: ' || left(trim(coalesce(p_equipo,'')), 120) || E'\n' ||
    'Problema: ' || left(trim(coalesce(p_problema,'')), 2000);

  insert into public.trabajos (
    titulo, descripcion, cliente_nombre, cliente_telefono,
    ciudad, tipo_servicio, prioridad, estado, tecnico_id
  ) values (
    v_titulo, v_descripcion, left(trim(p_nombre),120), left(trim(p_contacto),160),
    left(trim(p_ciudad),120), left(trim(coalesce(p_servicio,'Soporte técnico')),120),
    v_prioridad, 'pendiente', null
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.crear_ticket_web(text,text,text,text,text,text,text,text) from public;
grant execute on function public.crear_ticket_web(text,text,text,text,text,text,text,text) to anon, authenticated;
