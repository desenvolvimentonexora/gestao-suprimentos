-- Fase 3 — Requisições e Cotações: requisições com itens (vinculadas a uma
-- unidade), cotações manuais por fornecedor, e mapeamentos de importação de
-- planilha reutilizáveis por tenant.

create type request_status as enum ('draft', 'open', 'negotiating', 'quoted', 'cancelled');
create type quotation_status as enum ('pending', 'received', 'discarded');

create table requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  unit_id uuid not null references units(id),
  status request_status not null default 'draft',
  needed_by date,
  requester_id uuid references users(id),
  external_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);
create index requests_tenant_id_idx on requests(tenant_id);
create index requests_status_idx on requests(status);

alter table requests enable row level security;
create policy "requests_tenant_access" on requests
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create table request_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  request_id uuid not null references requests(id),
  material_id uuid not null references materials(id),
  quantity numeric not null,
  unit_of_measure text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index request_items_tenant_id_idx on request_items(tenant_id);
create index request_items_request_id_idx on request_items(request_id);

alter table request_items enable row level security;
create policy "request_items_tenant_access" on request_items
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create table quotations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  request_id uuid not null references requests(id),
  supplier_id uuid not null references suppliers(id),
  status quotation_status not null default 'pending',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);
create index quotations_tenant_id_idx on quotations(tenant_id);
create index quotations_request_id_idx on quotations(request_id);
comment on table quotations is
  'Sem índice único de "comparação ativa" nesta fase — essa regra pertence ao conceito de Comparação/Equalização (Fase 4). Aqui uma requisição pode ter várias cotações em paralelo.';

alter table quotations enable row level security;
create policy "quotations_tenant_access" on quotations
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create table quotation_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  quotation_id uuid not null references quotations(id),
  request_item_id uuid not null references request_items(id),
  unit_price numeric,
  lead_time_days integer,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index quotation_items_tenant_id_idx on quotation_items(tenant_id);
create index quotation_items_quotation_id_idx on quotation_items(quotation_id);

alter table quotation_items enable row level security;
create policy "quotation_items_tenant_access" on quotation_items
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create table import_mappings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  import_type text not null,
  column_mapping jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, import_type)
);
create index import_mappings_tenant_id_idx on import_mappings(tenant_id);

alter table import_mappings enable row level security;
create policy "import_mappings_tenant_access" on import_mappings
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());
