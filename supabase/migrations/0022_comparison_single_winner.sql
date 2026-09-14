-- Reversão: a comparação volta a ter UM vencedor geral por menor Total
-- (frete incluso), não um vencedor por item. `comparisons.winning_quotation_id`
-- (existe desde 0010, sem uso desde 0015) volta a ser a fonte da verdade.
--
-- `comparison_winners` continua existindo e passa a ser preenchida pelo
-- app a partir do vencedor geral (uma linha por item coberto pela cotação
-- vencedora) — só para o rascunho de pedido da Fase 5 (que já lê dessa
-- tabela) continuar funcionando sem nenhuma alteração, já que essa parte
-- está pausada até confirmação.

alter table quotations
  add column freight_amount numeric,
  add column payment_terms text,
  add column delivery_days integer;

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
  v_winning_quotation_id uuid;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decisão inválida: %', p_decision;
  end if;

  select request_id, winning_quotation_id into v_request_id, v_winning_quotation_id
  from comparisons
  where id = p_comparison_id and deleted_at is null;

  if v_request_id is null then
    raise exception 'Comparação não encontrada: %', p_comparison_id;
  end if;

  if p_decision = 'approved' then
    if v_winning_quotation_id is null then
      raise exception 'Defina o vencedor da comparação % antes de aprovar.', p_comparison_id;
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
