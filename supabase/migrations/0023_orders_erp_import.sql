-- Correção de 0017: o pedido não é criado manualmente no nosso sistema —
-- o comprador emite no ERP e depois importa o Excel do pedido aqui. Uma
-- linha do Excel pode não casar 1:1 com o material/item original da
-- requisição (o ERP pode agrupar, desmembrar ou usar outro cadastro de
-- material), por isso request_item_id e material_id de order_items
-- deixam de ser obrigatórios. orders ganha imported_at para registrar
-- quando a importação aconteceu (distinto de created_at/updated_at).

alter table order_items alter column request_item_id drop not null;
alter table order_items alter column material_id drop not null;

alter table orders add column imported_at timestamptz not null default now();
