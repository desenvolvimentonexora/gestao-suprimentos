-- Fila de Alterações: segundo estágio fixo de aprovação (aprovador único,
-- só que em duas telas), fiel ao sistema antigo. `approved` deixa de ser
-- terminal; a requisição só vira `quoted` quando a comparação é `released`.
--
-- Vencedor por item: `comparison_winners` substitui `comparisons.winning_quotation_id`
-- como fonte de verdade (a coluna antiga fica sem uso, não é removida —
-- migrations são aditivas). Permite "melhor preço combinado" somando o
-- vencedor de cada linha, mesmo que sejam fornecedores diferentes.

alter type comparison_status add value 'pending_release';
alter type comparison_status add value 'released';
