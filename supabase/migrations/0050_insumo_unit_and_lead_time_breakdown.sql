-- Catálogo de insumos ganha "unidade" — código, descrição e unidade viram
-- as 3 colunas fixas do insumo na tela de Materiais do fornecedor (pedido
-- do cliente).
--
-- Prazo de entrega deixa de ser um único valor (supplier_materials.
-- lead_time_days) e vira 3 etapas por par fornecedor+insumo — Compra,
-- Picking, Entrega — cujo total é a soma, calculada na tela, não guardada
-- em coluna própria. A coluna antiga lead_time_days fica obsoleta: não
-- apagamos agora (ninguém testou ainda se sobrou algo dependendo dela),
-- só paramos de ler/escrever nela no código — remove numa migration futura.

alter table material_variants add column unit_of_measure text;

alter table supplier_materials add column lead_time_purchase_days integer;
alter table supplier_materials add column lead_time_picking_days integer;
alter table supplier_materials add column lead_time_delivery_days integer;
