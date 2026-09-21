-- Cobrador de Entregas — Etapa 1 (calendário de acompanhamento de entregas
-- dos pedidos da Fase 5). Não duplica o pedido: estende `orders`/
-- `order_items` com o que falta pra rastrear entrega, que hoje não existe
-- em lugar nenhum do sistema.
--
-- delivered_at / delivery_receipt_confirmed_at: dois momentos distintos —
-- "chegou" (delivered_at) pode acontecer antes do comprovante/AR ser
-- confirmado (delivery_receipt_confirmed_at). Enquanto só o primeiro está
-- preenchido, o status derivado é "chegou · AR pendente".
alter table orders add column delivered_at timestamptz;
alter table orders add column delivery_receipt_confirmed_at timestamptz;
alter table orders add column delivery_notes text;

-- Entrega parcial: cada item pode chegar em momento diferente do resto do
-- pedido. Rastreado pelo id da linha (order_item), nunca por nome de
-- material — materiais com o mesmo nome podem ser variantes diferentes,
-- distinguidas só pelo código (ver materials.code).
alter table order_items add column delivered_at timestamptz;

-- Histórico de reagendamento de entrega (usado a partir da Etapa 2, que
-- terá a ação de reagendar — a tabela já entra nesta migration porque é
-- schema, e schema não se edita depois de aplicado).
create table order_delivery_reschedules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  order_id uuid not null references orders(id),
  previous_date date not null,
  new_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);
create index order_delivery_reschedules_tenant_id_idx on order_delivery_reschedules(tenant_id);
create index order_delivery_reschedules_order_id_idx on order_delivery_reschedules(order_id);

alter table order_delivery_reschedules enable row level security;
create policy "order_delivery_reschedules_tenant_access" on order_delivery_reschedules
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create trigger order_delivery_reschedules_audit
  after insert or update or delete on order_delivery_reschedules
  for each row execute function fn_audit_log();
