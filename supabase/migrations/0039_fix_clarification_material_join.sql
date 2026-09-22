-- A migration 0038 repontou request_items.material_id (renomeada pra
-- material_variant_id) de materials pra material_variants. fn_request_clarification
-- (0032) fazia join direto com materials pelo id antigo — corrige o join pra
-- passar por material_variants. Corpo idêntico ao original, só a fonte do
-- materialName muda.
create or replace function fn_request_clarification(
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
  join material_variants mv on mv.id = ri.material_variant_id
  join materials m on m.id = mv.material_id
  where ri.request_id = p_request_id and ri.deleted_at is null and ri.pendente = true;

  update requests
  set status = 'clarification_requested',
      updated_at = now()
  where id = p_request_id;

  insert into request_reviews (tenant_id, request_id, type, reviewer_id, message, item_snapshots, created_by)
  values (v_tenant_id, p_request_id, 'clarification_requested', p_reviewer_id, p_message, v_snapshots, p_reviewer_id);
end;
$$;
