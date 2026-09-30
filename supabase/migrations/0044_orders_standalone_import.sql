-- Pedido de compra pode agora ser importado do Excel do ERP mesmo quando a
-- SOL correspondente nunca passou pela Equalização deste app (histórico do
-- ERP, ou pedido lançado direto). comparison_id/request_id deixam de ser
-- obrigatórios em orders — mesmo padrão já adotado em 0023 para
-- request_item_id/material_id em order_items. Quando o pedido nasce de uma
-- comparação liberada aqui dentro (fluxo normal), os dois continuam
-- preenchidos.

alter table orders alter column comparison_id drop not null;
alter table orders alter column request_id drop not null;
