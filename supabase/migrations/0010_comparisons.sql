-- Fase 4 — Comparação e Aprovações: tabela `comparisons` com a trava de
-- "uma comparação ativa por requisição" que ficou de propósito fora da
-- Fase 3, linhas comparativas (casamento item da requisição ↔ item da
-- cotação, com metadados de extração por IA) e anexos de PDF de cotação.

create type comparison_status as enum ('draft', 'pending_approval', 'approved', 'rejected');

create table comparisons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  request_id uuid not null references requests(id),
  status comparison_status not null default 'draft',
  winning_quotation_id uuid references quotations(id),
  approved_by uuid,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);
create index comparisons_tenant_id_idx on comparisons(tenant_id);
create index comparisons_request_id_idx on comparisons(request_id);

-- Uma requisição só pode ter UMA comparação ativa (rascunho ou aguardando
-- aprovação) por vez. Comparações aprovadas ou rejeitadas não contam para
-- essa trava — depois de decidida, uma nova comparação pode ser aberta
-- (ex.: após rejeição, o usuário corrige e reenvia).
create unique index comparisons_one_active_per_request
  on comparisons (request_id)
  where deleted_at is null and status in ('draft', 'pending_approval');

alter table comparisons enable row level security;
create policy "comparisons_tenant_access" on comparisons
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create trigger comparisons_audit
  after insert or update or delete on comparisons
  for each row execute function fn_audit_log();

create table comparison_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  comparison_id uuid not null references comparisons(id),
  request_item_id uuid not null references request_items(id),
  quotation_item_id uuid not null references quotation_items(id),
  extracted_by_ai boolean not null default false,
  ai_confidence numeric,
  created_at timestamptz not null default now()
);
create index comparison_lines_tenant_id_idx on comparison_lines(tenant_id);
create index comparison_lines_comparison_id_idx on comparison_lines(comparison_id);

alter table comparison_lines enable row level security;
create policy "comparison_lines_tenant_access" on comparison_lines
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create table quotation_attachments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  quotation_id uuid not null references quotations(id),
  file_name text not null,
  storage_path text not null,
  uploaded_by uuid,
  uploaded_at timestamptz not null default now()
);
create index quotation_attachments_tenant_id_idx on quotation_attachments(tenant_id);
create index quotation_attachments_quotation_id_idx on quotation_attachments(quotation_id);

alter table quotation_attachments enable row level security;
create policy "quotation_attachments_tenant_access" on quotation_attachments
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

insert into storage.buckets (id, name, public)
values ('quotation-attachments', 'quotation-attachments', false)
on conflict (id) do nothing;

create policy "quotation_attachments_storage_select" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'quotation-attachments'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy "quotation_attachments_storage_insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'quotation-attachments'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy "quotation_attachments_storage_delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'quotation-attachments'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

-- ---------------------------------------------------------------------------
-- fn_decide_comparison: aprova ou rejeita uma comparação atomicamente.
-- Chamada pela Edge Function `decide-comparison` com o client de
-- service_role (a checagem de permissão do usuário acontece na Edge
-- Function, antes de chamar esta função). Na rejeição, a requisição volta
-- para `negotiating` na mesma transação.
-- ---------------------------------------------------------------------------
create function fn_decide_comparison(
  p_comparison_id uuid,
  p_decision comparison_status,
  p_decided_by uuid,
  p_winning_quotation_id uuid default null,
  p_rejection_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decisão inválida: %', p_decision;
  end if;

  select request_id into v_request_id
  from comparisons
  where id = p_comparison_id and deleted_at is null;

  if v_request_id is null then
    raise exception 'Comparação não encontrada: %', p_comparison_id;
  end if;

  if p_decision = 'approved' then
    update comparisons
    set status = 'approved',
        winning_quotation_id = p_winning_quotation_id,
        approved_by = p_decided_by,
        approved_at = now(),
        updated_at = now()
    where id = p_comparison_id;
  else
    update comparisons
    set status = 'rejected',
        rejection_reason = p_rejection_reason,
        updated_at = now()
    where id = p_comparison_id;

    update requests
    set status = 'negotiating',
        updated_at = now()
    where id = v_request_id;
  end if;
end;
$$;
