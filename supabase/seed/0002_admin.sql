-- Perfil e papel do usuário admin de demonstração.
-- Pré-requisito: criar o usuário no Supabase Dashboard → Authentication → Users
-- (Add user → defina e-mail e senha, "Auto Confirm User" marcado).
-- Substitua ADMIN_USER_ID pelo UUID desse usuário antes de rodar.
-- Se o e-mail escolhido no Dashboard for diferente, ajuste ADMIN_EMAIL também.

insert into users (id, tenant_id, full_name, email)
values (
  '06e50a49-b730-4bce-ba2b-66728694eb27',
  '00000000-0000-0000-0000-000000000001',
  'Admin Construtora Beta',
  'admin@construtora-beta.nexora.com'
)
on conflict (id) do nothing;

insert into user_roles (user_id, role_id, tenant_id)
values (
  '06e50a49-b730-4bce-ba2b-66728694eb27',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001'
)
on conflict (user_id, role_id) do nothing;
