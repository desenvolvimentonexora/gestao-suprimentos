-- Disparo automático de solicitações (spec em
-- docs/superpowers/specs/2026-09-17-disparo-automatico-design.md).
--
-- dispatch_blocked_reason: preenchido quando uma tentativa de despacho
-- automático não conseguiu concluir (falta fornecedor pra algum insumo, ou
-- o envio de e-mail falhou) — null quando não há bloqueio. Reflete só a
-- tentativa mais recente.
alter table requests add column dispatch_blocked_reason text;

-- request_dispatch_recipients: auditoria de quem foi de fato contatado por
-- uma SOL despachada automaticamente. Tabela de log, sem soft delete —
-- mesmo raciocínio de supplier_materials. Escrita só pela Edge Function
-- review-request (service_role); a policy de RLS cobre apenas leitura.
create table request_dispatch_recipients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  request_id uuid not null references requests(id),
  supplier_id uuid not null references suppliers(id),
  material_id uuid not null references materials(id),
  email text not null,
  sent_at timestamptz not null default now()
);

create index request_dispatch_recipients_tenant_id_idx on request_dispatch_recipients(tenant_id);
create index request_dispatch_recipients_request_id_idx on request_dispatch_recipients(request_id);

alter table request_dispatch_recipients enable row level security;
create policy "request_dispatch_recipients_select_own_tenant" on request_dispatch_recipients
  for select
  to authenticated
  using (tenant_id = current_tenant_id());

-- fn_mark_request_negotiating: única forma de levar uma SOL de
-- released_to_dispatch pra negotiating pelo caminho do despacho automático
-- (regra 5 do CLAUDE.md — a regra crítica mora no banco). O guard de status
-- evita corrida entre duas tentativas simultâneas (ex.: alguém clica
-- "tentar novamente" duas vezes rápido).
create function fn_mark_request_negotiating(
  p_request_id uuid,
  p_reviewer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_current_status request_status;
begin
  select tenant_id, status into v_tenant_id, v_current_status
  from requests
  where id = p_request_id and deleted_at is null;

  if v_tenant_id is null then
    raise exception 'Requisição não encontrada: %', p_request_id;
  end if;

  if v_current_status <> 'released_to_dispatch' then
    raise exception 'A requisição não está liberada pro Disparo (status atual: %).', v_current_status;
  end if;

  update requests
  set status = 'negotiating',
      dispatch_blocked_reason = null,
      updated_at = now()
  where id = p_request_id;

  insert into request_reviews (tenant_id, request_id, type, reviewer_id, created_by)
  values (v_tenant_id, p_request_id, 'dispatched_to_suppliers', p_reviewer_id, p_reviewer_id);
end;
$$;
