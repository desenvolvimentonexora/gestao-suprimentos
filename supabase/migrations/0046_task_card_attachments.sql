-- ---------------------------------------------------------------------------
-- task_card_attachments: arquivos/imagens anexados a um card do quadro de
-- tarefas. Mesmo padrão de supplier_certificates (0004_suppliers_extras.sql):
-- bucket de Storage privado (URL assinada, nunca público), caminho do objeto
-- "<tenant_id>/<task_card_id>/<arquivo>", soft delete na tabela e remoção
-- real do objeto no Storage quando excluído (um anexo não faz sentido órfão).
-- ---------------------------------------------------------------------------
create table task_card_attachments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  task_card_id uuid not null references task_cards(id),
  file_path text not null,
  file_name text not null,
  created_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

create index task_card_attachments_tenant_id_idx on task_card_attachments(tenant_id);
create index task_card_attachments_task_card_id_idx on task_card_attachments(task_card_id);

alter table task_card_attachments enable row level security;

create policy "task_card_attachments_tenant_access" on task_card_attachments
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

insert into storage.buckets (id, name, public)
values ('task-card-attachments', 'task-card-attachments', false)
on conflict (id) do nothing;

create policy "task_card_attachments_storage_select" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'task-card-attachments'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy "task_card_attachments_storage_insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'task-card-attachments'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy "task_card_attachments_storage_delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'task-card-attachments'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );
