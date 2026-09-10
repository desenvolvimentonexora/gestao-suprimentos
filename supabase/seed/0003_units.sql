-- Seed de demonstração — Fase 2 (Unidades).
-- Dados fictícios para popular a tabela `units` em desenvolvimento.
-- CNPJs são inventados, não correspondem a empresas reais.

insert into units (
  id, tenant_id, name, cnpj, zip_code, street, number, neighborhood, city, state,
  type, status, start_date, end_date,
  engineer_name, engineer_phone, engineer_email,
  admin_name, admin_phone, admin_email
) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'UP Graça', '12.345.678/0001-90', '40150-060', 'Rua Ilhéus', '120', 'Graça', 'Salvador', 'BA', 'obra', 'active', '2025-03-01', '2027-06-30', 'Rafael Nogueira', '(71) 99811-2233', 'rafael.nogueira@obraficticia.com.br', 'Patrícia Lemos', '(71) 99722-4455', 'patricia.lemos@obraficticia.com.br'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'UP Pituba', '23.456.789/0001-01', '41810-000', 'Av. Manoel Dias da Silva', '850', 'Pituba', 'Salvador', 'BA', 'obra', 'active', '2025-08-15', '2027-12-20', 'Cláudio Freire', '(71) 99633-5566', 'claudio.freire@obraficticia.com.br', 'Marina Souza', '(71) 99544-6677', 'marina.souza@obraficticia.com.br'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'UP Barra', '34.567.890/0001-12', '40140-130', 'Av. Oceânica', '2000', 'Barra', 'Salvador', 'BA', 'obra', 'completed', '2023-01-10', '2025-02-28', 'Diego Almeida', '(71) 99455-7788', 'diego.almeida@obraficticia.com.br', 'Fernanda Costa', '(71) 99366-8899', 'fernanda.costa@obraficticia.com.br'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'UP Itaigara', '45.678.901/0001-23', '41815-135', 'Av. Antônio Carlos Magalhães', '1200', 'Itaigara', 'Salvador', 'BA', 'obra', 'active', '2026-01-05', '2028-03-15', 'Bruno Tavares', '(71) 99277-9900', 'bruno.tavares@obraficticia.com.br', 'Camila Rocha', '(71) 99188-0011', 'camila.rocha@obraficticia.com.br'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 'Escritório Central', '56.789.012/0001-34', '41770-235', 'Av. Tancredo Neves', '1632', 'Caminho das Árvores', 'Salvador', 'BA', 'escritorio', 'active', null, null, null, null, null, 'Juliana Prado', '(71) 99099-1122', 'juliana.prado@obraficticia.com.br'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000001', 'Depósito Simões Filho', '67.890.123/0001-45', '43700-000', 'Rod. BR-324', 'Km 15', 'Distrito Industrial', 'Simões Filho', 'BA', 'deposito', 'active', null, null, null, null, null, 'Anderson Melo', '(71) 98990-2233', 'anderson.melo@obraficticia.com.br'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000001', 'UP Costa Azul', '78.901.234/0001-56', '41750-300', 'Rua Waldemar Falcão', '400', 'Costa Azul', 'Salvador', 'BA', 'obra', 'inactive', '2024-06-01', '2025-01-30', 'Renato Vasconcelos', '(71) 98881-3344', 'renato.vasconcelos@obraficticia.com.br', 'Aline Barreto', '(71) 98772-4455', 'aline.barreto@obraficticia.com.br')
on conflict (id) do nothing;
