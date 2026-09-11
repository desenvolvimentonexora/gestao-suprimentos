-- Campo de observação livre, usado no modal "Disparar SOL" e no card
-- expandido de "Em Negociação" — mencionado no prompt de design sem marca
-- de decisão pendente, então tratado como já decidido.

alter table requests add column notes text;
