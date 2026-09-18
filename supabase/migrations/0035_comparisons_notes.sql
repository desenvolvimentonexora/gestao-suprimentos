-- Fidelidade visual da Equalização — bloco "OBSERVAÇÕES" da própria
-- comparação (equalização), separado de requests.notes (Análise/Disparo)
-- e de suppliers.notes (outra entidade).
alter table comparisons add column notes text;
