-- ITExpresSolutions - funciones para panel técnico
-- Compatible con las tablas existentes del proyecto.
-- IMPORTANTE: knowledge_base, company_documents y company_news ya existían
-- y usan la columna "publicado" (no "published").

create table if not exists public.technician_presence (
  technician_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'offline' check (status in ('online','offline')),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_presence_status on public.technician_presence(status);
create index if not exists idx_kb_publicado on public.knowledge_base(publicado, updated_at desc);
create index if not exists idx_docs_publicado on public.company_documents(publicado, updated_at desc);
create index if not exists idx_news_publicado on public.company_news(publicado, publicado_at desc);

alter table public.technician_presence enable row level security;
alter table public.knowledge_base enable row level security;
alter table public.company_documents enable row level security;
alter table public.company_news enable row level security;

drop policy if exists "technician sees own presence" on public.technician_presence;
drop policy if exists "authenticated sees online technicians" on public.technician_presence;
drop policy if exists "technician updates own presence" on public.technician_presence;
drop policy if exists "technician updates own presence row" on public.technician_presence;
drop policy if exists "admin manages presence" on public.technician_presence;

create policy "technician sees own presence" on public.technician_presence
for select to authenticated
using (technician_id = auth.uid() or public.es_admin());

create policy "authenticated sees online technicians" on public.technician_presence
for select to authenticated
using (status = 'online' or technician_id = auth.uid() or public.es_admin());

create policy "technician updates own presence" on public.technician_presence
for insert to authenticated
with check (technician_id = auth.uid());

create policy "technician updates own presence row" on public.technician_presence
for update to authenticated
using (technician_id = auth.uid() or public.es_admin())
with check (technician_id = auth.uid() or public.es_admin());

create policy "admin manages presence" on public.technician_presence
for delete to authenticated
using (public.es_admin());

drop policy if exists "authenticated reads published knowledge" on public.knowledge_base;
drop policy if exists "admin manages knowledge" on public.knowledge_base;
create policy "authenticated reads published knowledge" on public.knowledge_base
for select to authenticated
using (publicado = true or public.es_admin());
create policy "admin manages knowledge" on public.knowledge_base
for all to authenticated
using (public.es_admin()) with check (public.es_admin());

drop policy if exists "authenticated reads published documents" on public.company_documents;
drop policy if exists "admin manages documents" on public.company_documents;
create policy "authenticated reads published documents" on public.company_documents
for select to authenticated
using (publicado = true or public.es_admin());
create policy "admin manages documents" on public.company_documents
for all to authenticated
using (public.es_admin()) with check (public.es_admin());

drop policy if exists "authenticated reads published news" on public.company_news;
drop policy if exists "admin manages news" on public.company_news;
create policy "authenticated reads published news" on public.company_news
for select to authenticated
using (publicado = true or public.es_admin());
create policy "admin manages news" on public.company_news
for all to authenticated
using (public.es_admin()) with check (public.es_admin());

-- El historial por fecha usa public.trabajos y filtra tecnico_id + creado_at/fecha_programada.
-- No se modifica la tabla de tickets existente.