-- Fase 3 — Análise de Solicitações: papel de analista. Concede também ao
-- usuário admin de demonstração, mesmo padrão de 0004_approver_role.sql,
-- para permitir testar o fluxo sem precisar de um segundo usuário no
-- ambiente de dev.

insert into permissions (key, description)
values ('requests.analyze', 'Analisar SOLs, sinalizar pendência, pedir esclarecimento/prorrogação e liberar pro Disparo')
on conflict (key) do nothing;

insert into roles (id, tenant_id, name)
values ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'analyst')
on conflict (tenant_id, name) do nothing;

insert into role_permissions (role_id, permission_id)
select '00000000-0000-0000-0000-000000000005', id
from permissions
where key = 'requests.analyze'
on conflict do nothing;

insert into user_roles (user_id, role_id, tenant_id)
values (
  '06e50a49-b730-4bce-ba2b-66728694eb27',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001'
)
on conflict (user_id, role_id) do nothing;
