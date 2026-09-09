-- Fase 2 — Agenda de Fornecedores: colunas e tabelas de apoio para o layout
-- completo (card de fornecedor, pop-ups de certificados/prazo/avaliações,
-- favoritos por usuário) e uma tabela mínima de unidades (obra/loja/fábrica)
-- só o suficiente para alimentar o select de Obra no pop-up "Pedir Orçamento" —
-- o cadastro completo de Unidades é uma fase própria, não construído aqui.

alter table suppliers add column type text;

alter table supplier_materials add column lead_time_days integer;
comment on column supplier_materials.lead_time_days is
  'Prazo em dias para este par fornecedor+material. Hoje editado manualmente na tela; a previsão é vir do ERP futuramente.';

-- ---------------------------------------------------------------------------
-- units: mínima de propósito — nome só, para o select de Obra no pedido de
-- orçamento. Cadastro completo (Fase 2 "Unidades") fica para outra branch.
-- ---------------------------------------------------------------------------
create table units (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

create index units_tenant_id_idx on units(tenant_id);

alter table units enable row level security;

create policy "units_tenant_access" on units
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- supplier_certificates: metadados de PDFs guardados no bucket de Storage
-- "supplier-certificates" (privado — URL assinada, nunca público).
-- Caminho do objeto: "<tenant_id>/<supplier_id>/<arquivo>".
-- ---------------------------------------------------------------------------
create table supplier_certificates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  supplier_id uuid not null references suppliers(id),
  file_path text not null,
  file_name text not null,
  created_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

create index supplier_certificates_tenant_id_idx on supplier_certificates(tenant_id);
create index supplier_certificates_supplier_id_idx on supplier_certificates(supplier_id);

alter table supplier_certificates enable row level security;

create policy "supplier_certificates_tenant_access" on supplier_certificates
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

insert into storage.buckets (id, name, public)
values ('supplier-certificates', 'supplier-certificates', false)
on conflict (id) do nothing;

create policy "supplier_certificates_storage_select" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'supplier-certificates'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy "supplier_certificates_storage_insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'supplier-certificates'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy "supplier_certificates_storage_delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'supplier-certificates'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

-- ---------------------------------------------------------------------------
-- supplier_reviews: avaliações (estrelas + comentário) por fornecedor.
-- ---------------------------------------------------------------------------
create table supplier_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  supplier_id uuid not null references suppliers(id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

create index supplier_reviews_tenant_id_idx on supplier_reviews(tenant_id);
create index supplier_reviews_supplier_id_idx on supplier_reviews(supplier_id);

alter table supplier_reviews enable row level security;

create policy "supplier_reviews_tenant_access" on supplier_reviews
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- supplier_favorites: por usuário — cada comprador tem sua própria lista,
-- não é compartilhada pelo tenant.
-- ---------------------------------------------------------------------------
create table supplier_favorites (
  user_id uuid not null references users(id),
  supplier_id uuid not null references suppliers(id),
  tenant_id uuid not null references tenants(id),
  created_at timestamptz not null default now(),
  primary key (user_id, supplier_id)
);

create index supplier_favorites_tenant_id_idx on supplier_favorites(tenant_id);

alter table supplier_favorites enable row level security;

create policy "supplier_favorites_own_access" on supplier_favorites
  for all
  to authenticated
  using (tenant_id = current_tenant_id() and user_id = auth.uid())
  with check (tenant_id = current_tenant_id() and user_id = auth.uid());
