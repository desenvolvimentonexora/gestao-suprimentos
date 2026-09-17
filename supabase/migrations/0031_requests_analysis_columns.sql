-- Continuação de 0030: colunas e dados que usam os novos valores de
-- request_status.
--
-- SOLs novas nascem em 'pending_review' (aguardando análise) em vez de
-- 'draft'. As já existentes (dev/demo) já passaram por cima da análise no
-- fluxo antigo, então o backfill leva 'draft'/'open' direto pra
-- 'released_to_dispatch' — preserva o comportamento atual no Disparo sem
-- exigir reanálise. 'draft'/'open' ficam como valores de enum aposentados
-- (Postgres não permite remover valor de enum com segurança).

alter table request_items
  add column pendente boolean not null default false,
  add column motivo_pendencia text;

update requests set status = 'released_to_dispatch' where status in ('draft', 'open');

alter table requests alter column status set default 'pending_review';

-- Trilha de auditoria genérica (fn_audit_log, já existe desde 0001): hoje só
-- comparisons e orders têm esse trigger. Análise de Solicitações é um gate
-- crítico do mesmo tipo (regra 5 do CLAUDE.md), então entra no mesmo grupo.
create trigger requests_audit
  after insert or update or delete on requests
  for each row execute function fn_audit_log();

create trigger request_items_audit
  after insert or update or delete on request_items
  for each row execute function fn_audit_log();
