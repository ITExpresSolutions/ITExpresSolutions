-- ITExpresSolutions - Bot de tickets sin IA
-- Ejecutar UNA VEZ en Supabase > SQL Editor.

create or replace function public.crear_ticket_web(
  p_pais text,
  p_ciudad text,
  p_servicio text,
  p_equipo text,
  p_problema text,
  p_nombre text,
  p_contacto text,
  p_email text,
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
  v_email text;
begin
  if length(trim(coalesce(p_nombre,''))) < 2 then
    raise exception 'El nombre es obligatorio.';
  end if;
  if length(trim(coalesce(p_contacto,''))) < 5 then
    raise exception 'El teléfono o WhatsApp es obligatorio.';
  end if;

  v_email := lower(trim(coalesce(p_email,'')));
  if v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' then
    raise exception 'El correo electrónico no es válido.';
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
    titulo, descripcion, cliente_nombre, cliente_telefono, cliente_email,
    ciudad, tipo_servicio, prioridad, estado, tecnico_id
  ) values (
    v_titulo, v_descripcion, left(trim(p_nombre),120), left(trim(p_contacto),160),
    left(v_email,160), left(trim(p_ciudad),120),
    left(trim(coalesce(p_servicio,'Soporte técnico')),120),
    v_prioridad, 'pendiente', null
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.crear_ticket_web(text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.crear_ticket_web(text,text,text,text,text,text,text,text,text) to anon, authenticated;

-- Consulta pública limitada: exige referencia + teléfono/WhatsApp o correo usado al abrir el ticket.
create or replace function public.consultar_ticket_web(
  p_referencia text,
  p_contacto text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
  v_contacto text;
  v_result jsonb;
begin
  v_ref := lower(trim(coalesce(p_referencia,'')));
  v_contacto := lower(trim(coalesce(p_contacto,'')));
  if length(v_ref) < 8 then
    raise exception 'La referencia del ticket no es válida.';
  end if;
  if length(v_contacto) < 5 then
    raise exception 'El teléfono, WhatsApp o correo es obligatorio.';
  end if;

  select jsonb_build_object(
    'referencia', upper(left(t.id::text,8)),
    'estado', t.estado,
    'prioridad', t.prioridad,
    'titulo', t.titulo,
    'ciudad', t.ciudad,
    'tipo_servicio', t.tipo_servicio
  )
  into v_result
  from public.trabajos t
  where (lower(t.id::text) = v_ref or lower(left(t.id::text,8)) = v_ref)
    and (
      lower(trim(coalesce(t.cliente_telefono,''))) = v_contacto
      or lower(trim(coalesce(t.cliente_email,''))) = v_contacto
    )
  limit 1;

  if v_result is null then
    raise exception 'No se encontró un ticket con esa referencia y contacto.';
  end if;

  return v_result;
end;
$$;

revoke all on function public.consultar_ticket_web(text,text) from public;
grant execute on function public.consultar_ticket_web(text,text) to anon, authenticated;

-- ============================================================
-- NOTIFICACIÓN AUTOMÁTICA POR EMAIL
-- Requiere pg_net y la Edge Function send-ticket-email.
-- ============================================================
create or replace function public.notify_new_ticket_email()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://wfdxbgohwejawmkpninz.supabase.co/functions/v1/send-ticket-email',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object(
      'ticket_id', new.id,
      'ticket', to_jsonb(new)
    )
  );
  return new;
exception when others then
  raise warning 'No se pudo encolar el correo del ticket %: %', new.id, SQLERRM;
  return new;
end;
$$;

drop trigger if exists trg_notify_new_ticket_email on public.trabajos;
create trigger trg_notify_new_ticket_email
after insert on public.trabajos
for each row execute function public.notify_new_ticket_email();
