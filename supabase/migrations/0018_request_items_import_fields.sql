-- Fase 3 — Ajuste de design (adendo, expansão inline do card de Disparo):
-- colunas de apoio que vêm prontas do ERP do cliente na importação da
-- planilha (situação e data de autorização por item), sem lógica de
-- negócio em cima delas — apenas exibidas na tabela de itens expandida.

alter table request_items
  add column status_code text,
  add column authorized_at date;
