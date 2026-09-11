-- Fase 4 — papel de aprovador. Concede também ao usuário admin de
-- demonstração, para permitir testar o fluxo de aprovação sem precisar
-- de um segundo usuário no ambiente de dev.

insert into permissions (key, description)
values ('comparisons.approve', 'Aprovar ou rejeitar comparações de orçamentos')
on conflict (key) do nothing;

insert into roles (id, tenant_id, name)
values ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'approver')
on conflict (tenant_id, name) do nothing;

insert into role_permissions (role_id, permission_id)
select '00000000-0000-0000-0000-000000000004', id
from permissions
where key = 'comparisons.approve'
on conflict do nothing;

insert into user_roles (user_id, role_id, tenant_id)
values (
  '06e50a49-b730-4bce-ba2b-66728694eb27',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001'
)
on conflict (user_id, role_id) do nothing;
