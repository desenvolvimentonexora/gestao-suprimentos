-- Fase 0 — Fundação: tenants, organizations, users, roles, permissions,
-- user_roles, settings, audit_log e a função de trigger de auditoria.
-- Toda tabela criada aqui tem RLS habilitada antes de qualquer política de acesso.

-- ---------------------------------------------------------------------------
-- tenants: raiz do sistema multi-cliente. Descoberta por subdomínio (core/tenant).
-- Legível publicamente (mesmo sem sessão) porque a tela de login precisa da
-- marca e das credenciais do projeto Supabase do cliente antes de autenticar.
-- ---------------------------------------------------------------------------
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subdomain text not null unique,
  supabase_url text not null,
  supabase_anon_key text not null,
  licensed_modules text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table tenants enable row level security;

create policy "tenants_public_read" on tenants
  for select
  to anon, authenticated
  using (deleted_at is null);

-- ---------------------------------------------------------------------------
-- organizations: a empresa do cliente dentro de um tenant.
-- ---------------------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

create index organizations_tenant_id_idx on organizations(tenant_id);

alter table organizations enable row level security;

-- ---------------------------------------------------------------------------
-- users: perfil da aplicação ligado 1:1 a auth.users.
-- current_tenant_id() é usada pelas políticas de RLS abaixo; é SECURITY DEFINER
-- para poder ler a própria tabela users sem cair em recursão de RLS.
-- ---------------------------------------------------------------------------
create table users (
  id uuid primary key references auth.users(id),
  tenant_id uuid not null references tenants(id),
  organization_id uuid references organizations(id),
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

create index users_tenant_id_idx on users(tenant_id);
create index users_organization_id_idx on users(organization_id);

create function current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from users where id = auth.uid() and deleted_at is null;
$$;

alter table users enable row level security;

create policy "users_select_own_tenant" on users
  for select
  to authenticated
  using (tenant_id = current_tenant_id() and deleted_at is null);

create policy "organizations_select_own_tenant" on organizations
  for select
  to authenticated
  using (tenant_id = current_tenant_id() and deleted_at is null);

-- ---------------------------------------------------------------------------
-- roles: papéis configuráveis por tenant (ex.: comprador, aprovador, admin).
-- ---------------------------------------------------------------------------
create table roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  unique (tenant_id, name)
);

create index roles_tenant_id_idx on roles(tenant_id);

alter table roles enable row level security;

create policy "roles_select_own_tenant" on roles
  for select
  to authenticated
  using (tenant_id = current_tenant_id() and deleted_at is null);

-- ---------------------------------------------------------------------------
-- permissions: catálogo global do sistema (não é por tenant), ex.: "requests.create".
-- ---------------------------------------------------------------------------
create table permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table permissions enable row level security;

create policy "permissions_select_authenticated" on permissions
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- role_permissions: liga papéis às permissões do catálogo.
-- ---------------------------------------------------------------------------
create table role_permissions (
  role_id uuid not null references roles(id),
  permission_id uuid not null references permissions(id),
  primary key (role_id, permission_id)
);

create index role_permissions_permission_id_idx on role_permissions(permission_id);

alter table role_permissions enable row level security;

create policy "role_permissions_select_own_tenant" on role_permissions
  for select
  to authenticated
  using (
    role_id in (
      select id from roles where tenant_id = current_tenant_id() and deleted_at is null
    )
  );

-- ---------------------------------------------------------------------------
-- user_roles: liga usuários aos papéis.
-- ---------------------------------------------------------------------------
create table user_roles (
  user_id uuid not null references users(id),
  role_id uuid not null references roles(id),
  tenant_id uuid not null references tenants(id),
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create index user_roles_tenant_id_idx on user_roles(tenant_id);
create index user_roles_user_id_idx on user_roles(user_id);

alter table user_roles enable row level security;

create policy "user_roles_select_own_tenant" on user_roles
  for select
  to authenticated
  using (tenant_id = current_tenant_id());

-- ---------------------------------------------------------------------------
-- settings: configuração de tema, vocabulário e moeda por tenant (core/config).
-- Legível publicamente pelo mesmo motivo de tenants: a tela de login precisa
-- da marca do cliente antes da autenticação.
-- ---------------------------------------------------------------------------
create table settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) unique,
  theme jsonb not null default '{}',
  vocabulary jsonb not null default '{}',
  currency text not null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

alter table settings enable row level security;

create policy "settings_public_read" on settings
  for select
  to anon, authenticated
  using (deleted_at is null);

-- ---------------------------------------------------------------------------
-- audit_log: registro somente-leitura para o cliente; a escrita acontece via
-- trigger (fn_audit_log), que roda como o dono da função e ignora RLS.
-- ---------------------------------------------------------------------------
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  changed_by uuid,
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);

create index audit_log_tenant_id_idx on audit_log(tenant_id);
create index audit_log_table_record_idx on audit_log(table_name, record_id);

alter table audit_log enable row level security;

create policy "audit_log_select_own_tenant" on audit_log
  for select
  to authenticated
  using (tenant_id = current_tenant_id());

create function fn_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (tenant_id, table_name, record_id, action, changed_by, old_data, new_data)
  values (
    case when TG_OP = 'DELETE' then old.tenant_id else new.tenant_id end,
    TG_TABLE_NAME,
    case when TG_OP = 'DELETE' then old.id else new.id end,
    TG_OP,
    auth.uid(),
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return case when TG_OP = 'DELETE' then old else new end;
end;
$$;

create trigger organizations_audit
  after insert or update or delete on organizations
  for each row execute function fn_audit_log();

create trigger users_audit
  after insert or update or delete on users
  for each row execute function fn_audit_log();

create trigger roles_audit
  after insert or update or delete on roles
  for each row execute function fn_audit_log();

create trigger settings_audit
  after insert or update or delete on settings
  for each row execute function fn_audit_log();
