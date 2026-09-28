-- fn_mark_request_negotiating (0034) só existia pra ser chamada logo depois
-- do envio de e-mail no disparo automático, levando a SOL direto pra
-- negotiating sem esperar nenhuma cotação. Isso não é mais o fluxo: o
-- disparo agora só envia e-mail e registra o evento (insert simples em
-- request_reviews, sem RPC — não há mais guarda de status pra proteger
-- nesse ponto). Removida por não ter mais nenhum chamador.
drop function if exists fn_mark_request_negotiating(uuid, uuid);

-- fn_send_request_to_negotiation: nova porta de entrada pra "negotiating",
-- acionada manualmente pelo comprador (botão que só aparece com 3+
-- cotações recebidas) via review-request (service_role) — mesmo padrão de
-- guarda de status das outras funções desse arquivo, pra nunca mover uma
-- SOL que não esteja mais em "Liberada pro Disparo".
create function fn_send_request_to_negotiation(
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

  -- negotiating_started_at é preenchido pelo trigger fn_set_negotiating_started_at (0013).
  update requests
  set status = 'negotiating',
      updated_at = now()
  where id = p_request_id;

  insert into request_reviews (tenant_id, request_id, type, reviewer_id, created_by)
  values (v_tenant_id, p_request_id, 'sent_to_negotiation', p_reviewer_id, p_reviewer_id);
end;
$$;
