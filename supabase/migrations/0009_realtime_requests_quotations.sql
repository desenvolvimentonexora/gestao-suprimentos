-- Fase 3 — habilita Realtime (Postgres changes) nas tabelas que a tela
-- "Em Negociação" assina: mudança de status de requests e novas quotations.

alter publication supabase_realtime add table requests;
alter publication supabase_realtime add table quotations;
