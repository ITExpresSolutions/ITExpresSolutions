-- ITExpresSolutions - correo automático al asignar/reasignar un ticket a un técnico
-- Aplicado en Supabase el 2026-08-27.

create table if not exists public.assignment_email_config (
  id integer primary key check (id=1),
  secret text not null,
  created_at timestamptz not null default now()
);

alter table public.assignment_email_config enable row level security;

insert into public.assignment_email_config(id,secret)
values (1, encode(gen_random_bytes(32),'hex'))
on conflict (id) do nothing;

create or replace function public.notify_technician_assignment_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  secret_value text;
  endpoint text := 'https://wfdxbgohwejawmkpninz.supabase.co/functions/v1/send-assignment-email';
begin
  if new.tecnico_id is not null and (tg_op = 'INSERT' or old.tecnico_id is distinct from new.tecnico_id) then
    select secret into secret_value from public.assignment_email_config where id=1;
    if secret_value is not null then
      perform net.http_post(
        url := endpoint,
        headers := jsonb_build_object('Content-Type','application/json','x-assignment-secret',secret_value),
        body := jsonb_build_object('ticket_id',new.id::text)
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_email_technician_assignment on public.trabajos;
create trigger trg_email_technician_assignment
after insert or update of tecnico_id on public.trabajos
for each row execute function public.notify_technician_assignment_email();
