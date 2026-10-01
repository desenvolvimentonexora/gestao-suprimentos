-- ---------------------------------------------------------------------------
-- task_card_activities: histórico de movimentação de um card do quadro de
-- funcionalidades ("Movido para Em andamento por X", "Movido para Concluído
-- por X"). Sem soft delete — é um log de eventos, não um registro editável.
-- ---------------------------------------------------------------------------
create table task_card_activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  task_card_id uuid not null references task_cards(id),
  event_type text not null check (event_type in ('moved_em_andamento', 'moved_concluido')),
  created_at timestamptz not null default now(),
  created_by uuid
);

create index task_card_activities_tenant_id_idx on task_card_activities(tenant_id);
create index task_card_activities_task_card_id_idx on task_card_activities(task_card_id);

alter table task_card_activities enable row level security;

create policy "task_card_activities_tenant_access" on task_card_activities
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());
