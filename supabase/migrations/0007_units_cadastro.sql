-- Fase 2 — Unidades: expande a tabela `units` (criada como stub mínimo em
-- 0004_suppliers_extras.sql, só com id/tenant_id/name) com o cadastro
-- completo (endereço, tipo, status, datas, responsáveis).

alter table units
  add column cnpj text,
  add column zip_code text,
  add column street text,
  add column number text,
  add column neighborhood text,
  add column city text,
  add column state text,
  add column type text not null default 'obra',
  add column status text not null default 'active',
  add column start_date date,
  add column end_date date,
  add column engineer_name text,
  add column engineer_phone text,
  add column engineer_email text,
  add column admin_name text,
  add column admin_phone text,
  add column admin_email text;

alter table units
  add constraint units_type_check check (type in ('obra', 'escritorio', 'deposito'));

alter table units
  add constraint units_status_check check (status in ('active', 'completed', 'inactive'));

-- RLS já habilitada e coberta pela policy `units_tenant_access` de 0004.
