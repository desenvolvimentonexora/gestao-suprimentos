-- Fase 3 — Análise de Solicitações: triagem obrigatória antes do Disparo.
-- Só os novos valores de enum aqui — Postgres não deixa usar um valor
-- recém-criado na mesma transação que o cria (mesmo motivo documentado em
-- 0014/0015_comparison_release_columns.sql). As colunas e o backfill que
-- usam esses valores ficam na migration seguinte (0031).

alter type request_status add value 'pending_review';
alter type request_status add value 'clarification_requested';
alter type request_status add value 'extension_requested';
alter type request_status add value 'released_to_dispatch';
