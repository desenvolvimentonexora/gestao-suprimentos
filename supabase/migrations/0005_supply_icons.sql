-- Ícones (nome do ícone lucide-react, kebab-case) para categorias de insumo
-- e materiais, exibidos nas colunas 1 e 2 da Agenda de Fornecedores.

alter table supply_categories add column icon text not null default 'package';
alter table materials add column icon text not null default 'package';

-- Categorias já semeadas: ícone curado (ver modules/suppliers/iconMap.ts).
update supply_categories set icon = 'hard-hat' where name = 'Engenharia';
update supply_categories set icon = 'landmark' where name = 'Arquitetura';
update supply_categories set icon = 'wrench' where name = 'Serralheria';
