-- Fila de Alterações: etapa de conferência do comprovante de pagamento
-- antes de liberar. Enquanto payment_proof_confirmed_at for nulo, o card
-- mostra a tag "Aguardando comprovante" e o botão "Confirmar comprovante";
-- depois de confirmado, o card libera direto (sem mais gate).

alter table comparisons
  add column payment_proof_confirmed_at timestamptz;
