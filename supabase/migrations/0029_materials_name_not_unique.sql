-- Agenda de Fornecedores: um insumo genérico (ex.: "Aço") pode ter vários
-- tipos/códigos diferentes — uma empresa pode fornecer N tipos de aço. A
-- trava de nome único por tenant impedia cadastrar um segundo "Aço" com
-- código diferente. O código continua único (materials_tenant_code_unique,
-- da 0019): o mesmo código sempre aponta para a mesma linha, permitindo que
-- vários fornecedores vendam o mesmo item exato (base da cotação/comparação).

alter table materials drop constraint materials_tenant_id_name_key;
