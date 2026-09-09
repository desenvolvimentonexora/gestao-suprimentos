-- Extensão usada para o backfill de ícones de material (comparação de nome
-- sem diferenciar acentuação) e para buscas futuras que precisem do mesmo.
create extension if not exists unaccent with schema extensions;
