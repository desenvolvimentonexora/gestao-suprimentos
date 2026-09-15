-- Fase 5 — Administração: logo do cliente. Bucket público porque a tela
-- de login (pré-autenticação) precisa exibir a marca — mesmo motivo de
-- settings_public_read (0001).
insert into storage.buckets (id, name, public)
values ('tenant-branding', 'tenant-branding', true)
on conflict (id) do nothing;

create policy "tenant_branding_storage_select" on storage.objects
  for select
  to public
  using (bucket_id = 'tenant-branding');

create policy "tenant_branding_storage_insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'tenant-branding'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy "tenant_branding_storage_update" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'tenant-branding'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );
