-- Correção de 0011: ao aprovar uma comparação, fn_decide_comparison só
-- atualizava a própria comparação — a requisição ficava presa em
-- 'negotiating' para sempre, reaparecendo na lista de requisições
-- comparáveis mesmo já decidida. Ao aprovar, a requisição também avança
-- para 'quoted' (completando o ciclo draft → open → negotiating → quoted
-- do enum request_status, que até aqui nunca tinha um caminho real de
-- chegar a 'quoted').

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

    update requests
    set status = 'quoted',
        updated_at = now()
    where id = v_request_id;
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
