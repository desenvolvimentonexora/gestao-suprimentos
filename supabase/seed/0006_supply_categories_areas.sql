-- Seed — expande supply_categories com as demais áreas de negócio da empresa.
-- Até aqui só existiam Arquitetura, Engenharia e Serralheria (cadastradas à
-- mão durante o desenvolvimento). A lateral de categorias da Agenda de
-- Fornecedores deve listar todas as áreas, então adicionamos o restante,
-- alinhado ao conteúdo de apps/web/src/modules/registry.ts (sectorRegistry).

insert into supply_categories (tenant_id, name, slug, icon)
values
  ('00000000-0000-0000-0000-000000000001', 'Suprimentos', 'suprimentos', 'package'),
  ('00000000-0000-0000-0000-000000000001', 'Recursos Humanos', 'recursos-humanos', 'users'),
  ('00000000-0000-0000-0000-000000000001', 'Marketing', 'marketing', 'megaphone'),
  ('00000000-0000-0000-0000-000000000001', 'Financeiro', 'financeiro', 'banknote'),
  ('00000000-0000-0000-0000-000000000001', 'Tecnologia da Informação', 'tecnologia-da-informacao', 'monitor'),
  ('00000000-0000-0000-0000-000000000001', 'Comercial', 'comercial', 'building-2')
on conflict (tenant_id, slug) do nothing;
