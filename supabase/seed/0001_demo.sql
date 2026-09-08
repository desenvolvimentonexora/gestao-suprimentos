-- Seed de demonstração — Fase 0.
-- Tenant fictício "Construtora Beta" no segmento construção, com tema, vocabulário
-- e papel admin. O usuário admin (auth.users) é criado à parte por
-- scripts/seed-admin.mjs, que precisa da service_role key (nunca commitada).

insert into tenants (id, name, subdomain, supabase_url, supabase_anon_key, licensed_modules)
values (
  '00000000-0000-0000-0000-000000000001',
  'Construtora Beta',
  'construtora-beta',
  'https://hvtcmpzfqcvbyiehkgbk.supabase.co',
  'sb_publishable_j7_rMeHIv5eS1PREVxXdkA_jADKF6FP',
  array['requests', 'quotations', 'approvals', 'units', 'suppliers']
)
on conflict (id) do nothing;

insert into organizations (id, tenant_id, name)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Construtora Beta Ltda.'
)
on conflict (id) do nothing;

insert into settings (tenant_id, theme, vocabulary, currency)
values (
  '00000000-0000-0000-0000-000000000001',
  jsonb_build_object('primary', '#1F3A5F', 'accent', '#B8860B'),
  jsonb_build_object('unit', 'Obra', 'request', 'Solicitação', 'quotation', 'Cotação'),
  'BRL'
)
on conflict (tenant_id) do nothing;

insert into roles (id, tenant_id, name)
values ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'admin')
on conflict (tenant_id, name) do nothing;

insert into permissions (key, description)
values ('admin.full_access', 'Acesso total à administração do cliente')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_id)
select '00000000-0000-0000-0000-000000000003', id
from permissions
where key = 'admin.full_access'
on conflict do nothing;
