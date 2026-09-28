-- ---------------------------------------------------------------------------
-- quotation_unmatched_items: itens que a IA extraiu de uma cotação (recebida
-- por e-mail automático ou PDF manual) mas não conseguiu casar com nenhum
-- item da SOL com confiança suficiente. Antes, esses itens eram descartados
-- silenciosamente — a cotação era salva sem eles e ninguém era avisado.
-- Guardar aqui deixa explícito que falta revisão manual (reaproveitando a
-- mesma tela de vínculo item-a-item já usada na importação manual de PDF),
-- em vez de a IA "adivinhar" ou simplesmente perder o dado.
-- Sem soft delete próprio (mesmo padrão de quotation_attachments/
-- request_attachments): "resolved_at" marca quando um humano vinculou o
-- item a um item real da SOL.
-- ---------------------------------------------------------------------------
create table quotation_unmatched_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  quotation_id uuid not null references quotations(id),
  description text not null,
  quantity numeric,
  unit_price numeric not null,
  lead_time_days integer,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index quotation_unmatched_items_tenant_id_idx on quotation_unmatched_items(tenant_id);
create index quotation_unmatched_items_quotation_id_idx on quotation_unmatched_items(quotation_id);

alter table quotation_unmatched_items enable row level security;
create policy "quotation_unmatched_items_tenant_access" on quotation_unmatched_items
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());
