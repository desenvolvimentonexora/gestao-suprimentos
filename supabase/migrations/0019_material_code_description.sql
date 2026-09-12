-- Agenda de Fornecedores: código (SKU interno, vindo do ERP do cliente) e
-- descrição do insumo. Código é opcional (planilhas antigas sem essa coluna
-- continuam funcionando) mas único por tenant quando informado — Postgres já
-- trata múltiplos NULL como não-conflitantes num unique constraint comum,
-- então não precisa de índice parcial.

alter table materials
  add column code text,
  add column description text,
  add constraint materials_tenant_code_unique unique (tenant_id, code);
