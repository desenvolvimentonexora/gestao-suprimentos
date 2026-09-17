-- Disparo automático de solicitações: novo tipo de evento em
-- request_reviews para quando o próprio sistema despacha a SOL pros
-- fornecedores. Só o valor de enum aqui — Postgres não deixa usar um valor
-- recém-criado na mesma transação que o cria (mesmo motivo documentado em
-- 0030/0031). O resto (coluna, tabela, função) fica em 0034.

alter type request_review_type add value 'dispatched_to_suppliers';
