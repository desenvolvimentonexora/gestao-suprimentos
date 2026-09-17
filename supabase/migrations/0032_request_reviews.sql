-- Análise de Solicitações: histórico legível das decisões do analista
-- (esclarecimento pedido, prorrogação pedida, liberado pro Disparo).
--
-- Por que uma tabela dedicada em vez de só audit_log: audit_log grava diffs
-- de coluna (old_data/new_data), útil como trilha bruta, mas não dá pra
-- montar uma linha do tempo legível na tela sem parsear JSON. request_reviews
-- guarda o evento de negócio já estruturado. As duas coexistem: o trigger de
-- fn_audit_log (0031) continua cobrindo a auditoria genérica de requests e
-- request_items; request_reviews é o registro read-facing dessas três ações
-- específicas.
--
-- Sem updated_at/deleted_at: é um log de eventos imutável, mesmo padrão de
-- audit_log (que também não tem essas colunas). Escrita só pelas funções
-- abaixo (security definer, chamadas com service_role pela Edge Function
-- review-request) — a policy de RLS cobre apenas leitura.

create type request_review_type as enum (
  'clarification_requested',
  'extension_requested',
  'released_to_dispatch'
);

create table request_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  request_id uuid not null references requests(id),
  type request_review_type not null,
  reviewer_id uuid references users(id),
  message text,
  requested_needed_by date,
  item_snapshots jsonb,
  created_at timestamptz not null default now(),
  created_by uuid
);
create index request_reviews_tenant_id_idx on request_reviews(tenant_id);
create index request_reviews_request_id_idx on request_reviews(request_id);

alter table request_reviews enable row level security;
create policy "request_reviews_select_own_tenant" on request_reviews
  for select
  to authenticated
  using (tenant_id = current_tenant_id());

-- fn_request_clarification: exige que pelo menos um item já esteja marcado
-- como pendente (o toggle por item é escrita direta do front, não passa por
-- aqui — não é regra crítica). A função monta o retrato dos itens
-- sinalizados a partir do estado atual de request_items, pra não depender de
-- uma lista paralela vinda do cliente.
create function fn_request_clarification(
  p_request_id uuid,
  p_reviewer_id uuid,
  p_message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_pending_count integer;
  v_snapshots jsonb;
begin
  select tenant_id into v_tenant_id
  from requests
  where id = p_request_id and deleted_at is null;

  if v_tenant_id is null then
    raise exception 'Requisição não encontrada: %', p_request_id;
  end if;

  select count(*) into v_pending_count
  from request_items
  where request_id = p_request_id and deleted_at is null and pendente = true;

  if v_pending_count = 0 then
    raise exception 'Sinalize ao menos um item pendente antes de solicitar esclarecimento.';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'requestItemId', ri.id,
      'materialName', m.name,
      'motivo', ri.motivo_pendencia
    )
  )
  into v_snapshots
  from request_items ri
  join materials m on m.id = ri.material_id
  where ri.request_id = p_request_id and ri.deleted_at is null and ri.pendente = true;

  update requests
  set status = 'clarification_requested',
      updated_at = now()
  where id = p_request_id;

  insert into request_reviews (tenant_id, request_id, type, reviewer_id, message, item_snapshots, created_by)
  values (v_tenant_id, p_request_id, 'clarification_requested', p_reviewer_id, p_message, v_snapshots, p_reviewer_id);
end;
$$;

-- fn_request_extension: só registra o pedido (nova data + motivo) e muda o
-- status. Não mexe em requests.needed_by aqui — a data só é confirmada numa
-- etapa futura (fora do escopo desta tarefa), então o valor original
-- continua visível até lá.
create function fn_request_extension(
  p_request_id uuid,
  p_reviewer_id uuid,
  p_new_needed_by date,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  select tenant_id into v_tenant_id
  from requests
  where id = p_request_id and deleted_at is null;

  if v_tenant_id is null then
    raise exception 'Requisição não encontrada: %', p_request_id;
  end if;

  if p_new_needed_by is null then
    raise exception 'Informe a nova data de entrega proposta.';
  end if;

  update requests
  set status = 'extension_requested',
      updated_at = now()
  where id = p_request_id;

  insert into request_reviews
    (tenant_id, request_id, type, reviewer_id, message, requested_needed_by, created_by)
  values
    (v_tenant_id, p_request_id, 'extension_requested', p_reviewer_id, p_reason, p_new_needed_by, p_reviewer_id);
end;
$$;

-- fn_release_request_to_dispatch: a regra crítica mora aqui (regra 5 do
-- CLAUDE.md) — o botão fica desabilitado no front por UX, mas quem garante
-- de verdade que não existe pendência aberta é o banco.
create function fn_release_request_to_dispatch(
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
  v_pending_count integer;
begin
  select tenant_id into v_tenant_id
  from requests
  where id = p_request_id and deleted_at is null;

  if v_tenant_id is null then
    raise exception 'Requisição não encontrada: %', p_request_id;
  end if;

  select count(*) into v_pending_count
  from request_items
  where request_id = p_request_id and deleted_at is null and pendente = true;

  if v_pending_count > 0 then
    raise exception 'Ainda há % item(ns) sinalizado(s) sem solução. Resolva a pendência ou peça esclarecimento antes de liberar.', v_pending_count;
  end if;

  update requests
  set status = 'released_to_dispatch',
      updated_at = now()
  where id = p_request_id;

  insert into request_reviews (tenant_id, request_id, type, reviewer_id, created_by)
  values (v_tenant_id, p_request_id, 'released_to_dispatch', p_reviewer_id, p_reviewer_id);
end;
$$;
