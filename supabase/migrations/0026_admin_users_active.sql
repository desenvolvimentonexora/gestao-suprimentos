-- Fase 5 — Administração: "desativar usuário" precisa de um flag próprio,
-- distinto de deleted_at — o usuário continua existindo (e aparecendo em
-- auditoria/histórico), só perde acesso.
alter table users add column is_active boolean not null default true;

-- current_tenant_id() (0001) só checava deleted_at — sem isso, desativar
-- um usuário não revogava de fato o acesso de uma sessão já aberta: toda
-- política de RLS que depende de current_tenant_id() continuaria
-- resolvendo normalmente para ele.
create or replace function current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from users where id = auth.uid() and deleted_at is null and is_active = true;
$$;
