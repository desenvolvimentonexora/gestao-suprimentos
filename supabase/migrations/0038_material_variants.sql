-- Agenda de Fornecedores: separa "material" (insumo genérico, ex.: "Aço") de
-- "variante" (o código/descrição específico, ex.: "Aço CA-50 vergalhão 10mm",
-- código 3050). Antes, cada combinação de nome+código virava uma linha
-- própria em `materials` (migrations 0019/0029) — o que fazia a lista de
-- materiais mostrar "Aço" duas vezes. Agora `materials` guarda só o insumo
-- genérico (nome, categoria, ícone) e `material_variants` guarda código e
-- descrição; fornecedores passam a se vincular à variante específica, não
-- ao material genérico.
--
-- material_id nas tabelas request_items, order_items e
-- request_dispatch_recipients também é repontado para material_variants —
-- decisão de produto de manter requisições/pedidos amarrados à variante
-- exata cotada/comprada, não só ao insumo genérico.

create table material_variants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  material_id uuid not null references materials(id),
  code text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  unique (tenant_id, code)
);

create index material_variants_tenant_id_idx on material_variants(tenant_id);
create index material_variants_material_id_idx on material_variants(material_id);

alter table material_variants enable row level security;

create policy "material_variants_tenant_access" on material_variants
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

-- Uma variante por linha hoje existente em `materials`, reaproveitando o
-- mesmo id (assim supplier_materials/request_items/order_items/
-- request_dispatch_recipients continuam apontando pro registro certo só
-- trocando qual tabela esse id resolve). O material_id da variante aponta
-- pro sobrevivente do grupo (tenant_id, name) — quando duas linhas
-- compartilhavam nome (caso "Aço"), a de menor id vira o material genérico.
insert into material_variants (id, tenant_id, material_id, code, description, created_at, updated_at, created_by, deleted_at)
select
  m.id,
  m.tenant_id,
  canon.canonical_id,
  m.code,
  m.description,
  m.created_at,
  m.updated_at,
  m.created_by,
  m.deleted_at
from materials m
join (
  select tenant_id, name, min(id::text)::uuid as canonical_id
  from materials
  group by tenant_id, name
) canon on canon.tenant_id = m.tenant_id and canon.name = m.name;

-- Repontar as 4 tabelas que hoje referenciam materials(id) diretamente para
-- material_variants(id). O valor da coluna não muda (reaproveitamos o id
-- acima) — só o alvo da FK e o nome da coluna.
alter table supplier_materials drop constraint supplier_materials_pkey;
alter table supplier_materials drop constraint supplier_materials_material_id_fkey;
alter table supplier_materials rename column material_id to material_variant_id;
alter table supplier_materials add constraint supplier_materials_pkey primary key (supplier_id, material_variant_id);
alter table supplier_materials add constraint supplier_materials_material_variant_id_fkey
  foreign key (material_variant_id) references material_variants(id);

alter table request_items drop constraint request_items_material_id_fkey;
alter table request_items rename column material_id to material_variant_id;
alter table request_items add constraint request_items_material_variant_id_fkey
  foreign key (material_variant_id) references material_variants(id);

alter table order_items drop constraint order_items_material_id_fkey;
alter table order_items rename column material_id to material_variant_id;
alter table order_items add constraint order_items_material_variant_id_fkey
  foreign key (material_variant_id) references material_variants(id);

alter table request_dispatch_recipients drop constraint request_dispatch_recipients_material_id_fkey;
alter table request_dispatch_recipients rename column material_id to material_variant_id;
alter table request_dispatch_recipients add constraint request_dispatch_recipients_material_variant_id_fkey
  foreign key (material_variant_id) references material_variants(id);

-- Agora que nada mais referencia os ids das linhas "duplicadas" em
-- `materials` (a variante correspondente já existe em material_variants),
-- remove essas linhas — só o sobrevivente de cada grupo (tenant_id, name)
-- continua em `materials`.
delete from materials m
using (
  select tenant_id, name, min(id::text)::uuid as canonical_id
  from materials
  group by tenant_id, name
) canon
where m.tenant_id = canon.tenant_id
  and m.name = canon.name
  and m.id <> canon.canonical_id;

-- code/description saíram para material_variants; materials volta a ser só
-- nome + categoria + ícone (permitindo, de novo, nome único por tenant).
alter table materials drop constraint materials_tenant_code_unique;
alter table materials drop column code;
alter table materials drop column description;
alter table materials add constraint materials_tenant_id_name_key unique (tenant_id, name);
