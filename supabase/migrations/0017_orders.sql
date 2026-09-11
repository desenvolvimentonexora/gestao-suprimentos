-- Fase 5 — Pedidos básico: pedido gerado a partir de uma comparação já
-- liberada (comparisons.status='released'), com um pedido por comparação
-- (1:1 nesta fase) e itens copiados do vencedor por linha já decidido na
-- Equalização (comparison_winners).

create type order_status as enum ('issued', 'cancelled');

create table orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  comparison_id uuid not null references comparisons(id),
  request_id uuid not null references requests(id),
  unit_id uuid not null references units(id),
  order_number text not null,
  status order_status not null default 'issued',
  payment_condition_note text,
  expected_delivery_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);
create index orders_tenant_id_idx on orders(tenant_id);
create index orders_comparison_id_idx on orders(comparison_id);

-- Uma comparação só vira um pedido uma vez.
create unique index orders_comparison_unique on orders (comparison_id) where deleted_at is null;

alter table orders enable row level security;
create policy "orders_tenant_access" on orders
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create trigger orders_audit
  after insert or update or delete on orders
  for each row execute function fn_audit_log();

create table order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  order_id uuid not null references orders(id),
  request_item_id uuid not null references request_items(id),
  material_id uuid not null references materials(id),
  supplier_id uuid not null references suppliers(id),
  quantity numeric not null,
  unit_price numeric not null,
  created_at timestamptz not null default now()
);
create index order_items_tenant_id_idx on order_items(tenant_id);
create index order_items_order_id_idx on order_items(order_id);

alter table order_items enable row level security;
create policy "order_items_tenant_access" on order_items
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());
