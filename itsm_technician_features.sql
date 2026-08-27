-- ITExpresSolutions - funciones para panel técnico
-- Ejecutar en Supabase SQL Editor después de revisar las tablas existentes.
-- No reemplaza tablas de tickets existentes.

create table if not exists public.technician_presence (
  technician_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'offline' check (status in ('online','offline')),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  tags text[] default '{}',
  content text not null,
  published boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  description text,
  url text,
  content text,
  published boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  content text,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_presence_status on public.technician_presence(status);
create index if not exists idx_kb_published on public.knowledge_base(published, updated_at desc);
create index if not exists idx_docs_published on public.company_documents(published, updated_at desc);
create index if not exists idx_news_published on public.company_news(published, published_at desc);

alter table public.technician_presence enable row level security;
alter table public.knowledge_base enable row level security;
alter table public.company_documents enable row level security;
alter table public.company_news enable row level security;

drop policy if exists "technician sees own presence" on public.technician_presence;
drop policy if exists "authenticated sees online technicians" on public.technician_presence;
drop policy if exists "technician updates own presence" on public.technician_presence;
drop policy if exists "admin manages presence" on public.technician_presence;
create policy "technician sees own presence" on public.technician_presence for select to authenticated using (technician_id = auth.uid() or public.es_admin());
create policy "authenticated sees online technicians" on public.technician_presence for select to authenticated using (status = 'online' or technician_id = auth.uid() or public.es_admin());
create policy "technician updates own presence" on public.technician_presence for insert to authenticated with check (technician_id = auth.uid());
create policy "technician updates own presence row" on public.technician_presence for update to authenticated using (technician_id = auth.uid() or public.es_admin()) with check (technician_id = auth.uid() or public.es_admin());
create policy "admin manages presence" on public.technician_presence for delete to authenticated using (public.es_admin());

drop policy if exists "authenticated reads published knowledge" on public.knowledge_base;
drop policy if exists "admin manages knowledge" on public.knowledge_base;
create policy "authenticated reads published knowledge" on public.knowledge_base for select to authenticated using (published = true or public.es_admin());
create policy "admin manages knowledge" on public.knowledge_base for all to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "authenticated reads published documents" on public.company_documents;
drop policy if exists "admin manages documents" on public.company_documents;
create policy "authenticated reads published documents" on public.company_documents for select to authenticated using (published = true or public.es_admin());
create policy "admin manages documents" on public.company_documents for all to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "authenticated reads published news" on public.company_news;
drop policy if exists "admin manages news" on public.company_news;
create policy "authenticated reads published news" on public.company_news for select to authenticated using (published = true or public.es_admin());
create policy "admin manages news" on public.company_news for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Para el historial por fecha, el panel consulta public.trabajos y filtra tecnico_id + fechas.
-- Si tu tabla de tickets tiene otro nombre, conservar la consulta del portal actual y adaptar
-- únicamente el origen de datos, para no romper el sistema existente.
