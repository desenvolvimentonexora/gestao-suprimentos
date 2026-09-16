-- Fase 5 — Administração: lista de módulos ativos por tenant (consumida
-- pelo hub Suprimentos e pela Home para decidir o que mostrar). Módulos
-- que ainda não têm tela construída não entram nessa lista — não é uma
-- opção real de desativar algo que não existe.
alter table settings add column modules jsonb not null default '[]';
