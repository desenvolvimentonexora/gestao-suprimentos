-- Quadro de tarefas (Kanban) global, acessado pelo botão na barra superior.
-- Compartilhado por tenant (não é pessoal por usuário): qualquer usuário
-- autenticado do cliente cria, move e edita os mesmos cards. Sem coluna de
-- posição/ordem manual — dentro de cada coluna os cards ficam ordenados por
-- created_at, já que só é pedido mover entre colunas, não reordenar dentro
-- da mesma. Mesmo padrão de supply_categories/materials (0003_suppliers.sql):
-- sem fn_audit_log, tabela de apoio sem auditoria formal.

create table task_cards (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  title text not null,
  description text,
  status text not null default 'a_fazer' check (status in ('a_fazer', 'fazendo', 'feito')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

create index task_cards_tenant_id_idx on task_cards(tenant_id);

alter table task_cards enable row level security;

create policy "task_cards_tenant_access" on task_cards
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());
