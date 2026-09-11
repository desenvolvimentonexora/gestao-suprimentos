-- Correção de 0010: fn_decide_comparison não deveria receber
-- p_winning_quotation_id do chamador — a cotação vencedora já é definida
-- na tela de comparação, antes do envio para aprovação. Recebê-la de novo
-- na decisão permitiria a Edge Function trocar o vencedor sem passar pela
-- tela de comparação. Ao aprovar, a função agora só confirma que a
-- comparação já tem uma cotação vencedora definida.

drop function fn_decide_comparison(uuid, comparison_status, uuid, uuid, text);

create function fn_decide_comparison(
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

  if p_decision = 'approved' and v_winning_quotation_id is null then
    raise exception 'Comparação % não tem cotação vencedora definida.', p_comparison_id;
  end if;

  if p_decision = 'approved' then
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
