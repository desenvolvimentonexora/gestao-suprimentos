-- Adiciona a marca (nome, tagline, logo) às configurações do tenant.
-- Campo separado de "theme": tema é cor, marca é identidade (nome exibido,
-- frase de apresentação do login, logo) — ambos vêm da config, nunca fixos.

alter table settings
  add column brand jsonb not null default '{}';
