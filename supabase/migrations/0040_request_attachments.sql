-- ---------------------------------------------------------------------------
-- request_attachments: PDF da Solicitação (SOL) ligado a cada requisição.
-- "source" distingue o PDF original (subido pelo comprador ou, no futuro,
-- vindo de uma API do ERP) do PDF gerado por nós quando a SOL nasceu de
-- importação por planilha e nunca teve um PDF original. Mesmo padrão de
-- quotation_attachments (0010_comparisons.sql): sem soft delete próprio —
-- um anexo não tem sentido fora da requisição que ele documenta.
-- ---------------------------------------------------------------------------
create table request_attachments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  request_id uuid not null references requests(id),
  file_name text not null,
  storage_path text not null,
  source text not null check (source in ('uploaded', 'generated')),
  uploaded_by uuid,
  uploaded_at timestamptz not null default now()
);
create index request_attachments_tenant_id_idx on request_attachments(tenant_id);
create index request_attachments_request_id_idx on request_attachments(request_id);

alter table request_attachments enable row level security;
create policy "request_attachments_tenant_access" on request_attachments
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

insert into storage.buckets (id, name, public)
values ('request-attachments', 'request-attachments', false)
on conflict (id) do nothing;

create policy "request_attachments_storage_select" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'request-attachments'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy "request_attachments_storage_insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'request-attachments'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy "request_attachments_storage_delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'request-attachments'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );
