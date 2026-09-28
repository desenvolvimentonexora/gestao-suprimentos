-- Disparo deixa de mandar a SOL pra negociação sozinho (0034) — agora fica
-- em "Liberada pro Disparo" recebendo cotações, e só vai pra negociação
-- quando um humano decide isso manualmente (com 3+ cotações recebidas). Novo
-- tipo de evento pra registrar essa decisão na linha do tempo, distinto do
-- "dispatched_to_suppliers" que já existia. Só o valor de enum aqui — mesmo
-- motivo do 0033 (não dá pra usar um valor recém-criado na mesma transação).
alter type request_review_type add value 'sent_to_negotiation';
