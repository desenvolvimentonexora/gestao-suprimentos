-- Fase 2 — Agenda de Fornecedores: categorias de insumo, materiais, fornecedores,
-- contatos, CNPJs e o vínculo fornecedor↔material.
--
-- "supply_categories" é a categoria de um insumo/material (elétrica, hidráulica...).
-- Não confundir com os setores de negócio da Home (Suprimentos, Engenharia...),
-- que são conteúdo estático em apps/web/src/modules/registry.ts, não uma tabela.
--
-- Diferente da migration 0001, aqui as políticas de RLS já liberam escrita
-- (insert/update/delete) para o próprio tenant, não só leitura — a tela
-- Agenda de Fornecedores precisa cadastrar/editar fornecedores direto do
-- front, não só via Edge Function.

create table supply_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  unique (tenant_id, slug)
);

create index supply_categories_tenant_id_idx on supply_categories(tenant_id);

alter table supply_categories enable row level security;

create policy "supply_categories_tenant_access" on supply_categories
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- materials: catálogo de insumos ("Insumos que fornece" na planilha do cliente).
-- ---------------------------------------------------------------------------
create table materials (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  category_id uuid not null references supply_categories(id),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  unique (tenant_id, name)
);

create index materials_tenant_id_idx on materials(tenant_id);
create index materials_category_id_idx on materials(category_id);

alter table materials enable row level security;

create policy "materials_tenant_access" on materials
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- suppliers
-- ---------------------------------------------------------------------------
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  city text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

create index suppliers_tenant_id_idx on suppliers(tenant_id);
create index suppliers_tenant_name_idx on suppliers(tenant_id, name);

alter table suppliers enable row level security;

create policy "suppliers_tenant_access" on suppliers
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- supplier_contacts
-- Restrição única em (supplier_id, email) sem filtro de deleted_at: é o que
-- o script de importação usa como alvo do upsert (onConflict "supplier_id,
-- email"); um índice parcial não serviria de árbitro para esse ON CONFLICT.
-- ---------------------------------------------------------------------------
create table supplier_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  supplier_id uuid not null references suppliers(id),
  name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  unique (supplier_id, email)
);

create index supplier_contacts_tenant_id_idx on supplier_contacts(tenant_id);
create index supplier_contacts_supplier_id_idx on supplier_contacts(supplier_id);

alter table supplier_contacts enable row level security;

create policy "supplier_contacts_tenant_access" on supplier_contacts
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- supplier_documents: um fornecedor pode ter mais de um CNPJ.
-- Mesmo raciocínio de unique sem filtro de deleted_at (onConflict do script).
-- ---------------------------------------------------------------------------
create table supplier_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  supplier_id uuid not null references suppliers(id),
  cnpj text not null,
  created_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  unique (supplier_id, cnpj)
);

create index supplier_documents_tenant_id_idx on supplier_documents(tenant_id);
create index supplier_documents_supplier_id_idx on supplier_documents(supplier_id);

alter table supplier_documents enable row level security;

create policy "supplier_documents_tenant_access" on supplier_documents
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- supplier_materials: vínculo fornecedor ↔ material fornecido.
-- Tabela de ligação pura, sem soft delete — mesmo padrão de role_permissions
-- e user_roles na migration 0001.
-- ---------------------------------------------------------------------------
create table supplier_materials (
  supplier_id uuid not null references suppliers(id),
  material_id uuid not null references materials(id),
  tenant_id uuid not null references tenants(id),
  created_at timestamptz not null default now(),
  primary key (supplier_id, material_id)
);

create index supplier_materials_tenant_id_idx on supplier_materials(tenant_id);
create index supplier_materials_material_id_idx on supplier_materials(material_id);

alter table supplier_materials enable row level security;

create policy "supplier_materials_tenant_access" on supplier_materials
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());
