-- Uma linha do Excel do pedido pode não casar com nenhum material do
-- catálogo (material_id fica null desde 0023). Sem o nome como veio na
-- planilha, essa linha ficaria ilegível na tela — daí guardar sempre o
-- texto bruto, além da tentativa de casamento por id.

alter table order_items add column material_name_raw text not null default '';
