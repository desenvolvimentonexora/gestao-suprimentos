-- Continuação de 0014 (precisa ser migration separada: Postgres não permite
-- usar um valor de enum recém-adicionado na mesma transação que o criou).

alter table comparisons
  add column payment_condition_note text,
  add column released_by uuid,
  add column released_at timestamptz,
  add column financial_charge_requested boolean not null default false;

create table comparison_winners (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  comparison_id uuid not null references comparisons(id),
  request_item_id uuid not null references request_items(id),
  quotation_item_id uuid not null references quotation_items(id),
  created_at timestamptz not null default now(),
  unique (comparison_id, request_item_id)
);
create index comparison_winners_tenant_id_idx on comparison_winners(tenant_id);
create index comparison_winners_comparison_id_idx on comparison_winners(comparison_id);

alter table comparison_winners enable row level security;
create policy "comparison_winners_tenant_access" on comparison_winners
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

-- fn_decide_comparison (Fila de Aprovações): o critério de "tem vencedor"
-- passa a ser comparison_winners cobrindo todos os itens da requisição,
-- em vez de comparisons.winning_quotation_id (que fica sem uso). Aprovar
-- não muda mais o status da requisição — só a liberação final faz isso.
create or replace function fn_decide_comparison(
  p_comparison_id uuid,
  p_decision comparison_status,
  p_decided_by uuid,
  p_rejection_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_item_count integer;
  v_winner_count integer;
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
    select count(*) into v_item_count from request_items
      where request_id = v_request_id and deleted_at is null;
    select count(*) into v_winner_count from comparison_winners
      where comparison_id = p_comparison_id;

    if v_winner_count < v_item_count then
      raise exception 'Defina o vencedor de todos os itens antes de aprovar a comparação %.', p_comparison_id;
    end if;

    update comparisons
    set status = 'approved',
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

-- fn_release_comparison (Fila de Alterações): segunda etapa fixa. "Liberar"
-- avança a comparação para `released` e a requisição para `quoted`, pronta
-- para virar pedido (Fase 5). "Não liberar" se comporta como a rejeição da
-- Fila de Aprovações — devolve a comparação e a requisição, não havia
-- estado próprio especificado para esse caminho.
create function fn_release_comparison(
  p_comparison_id uuid,
  p_decision comparison_status,
  p_decided_by uuid,
  p_payment_condition_note text default null,
  p_rejection_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_status comparison_status;
begin
  if p_decision not in ('released', 'rejected') then
    raise exception 'Decisão inválida: %', p_decision;
  end if;

  select request_id, status into v_request_id, v_status
  from comparisons
  where id = p_comparison_id and deleted_at is null;

  if v_request_id is null then
    raise exception 'Comparação não encontrada: %', p_comparison_id;
  end if;

  if v_status != 'approved' then
    raise exception 'Comparação % precisa estar aprovada antes de passar pela Fila de Alterações.', p_comparison_id;
  end if;

  if p_decision = 'released' then
    update comparisons
    set status = 'released',
        released_by = p_decided_by,
        released_at = now(),
        payment_condition_note = coalesce(p_payment_condition_note, payment_condition_note),
        updated_at = now()
    where id = p_comparison_id;

    update requests
    set status = 'quoted',
        updated_at = now()
    where id = v_request_id;
  else
    update comparisons
    set status = 'rejected',
        rejection_reason = coalesce(p_rejection_reason, 'Não liberado na Fila de Alterações.'),
        updated_at = now()
    where id = p_comparison_id;

    update requests
    set status = 'negotiating',
        updated_at = now()
    where id = v_request_id;
  end if;
end;
$$;
