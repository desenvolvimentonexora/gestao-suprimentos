-- ---------------------------------------------------------------------------
-- Adiciona 'validated' aos eventos possíveis de last_moved_event_type
-- (0048): quando um card em "Concluído" é validado pelo cliente, reaproveita
-- as mesmas colunas last_moved_* (mesmo padrão de "só a última substitui a
-- anterior") em vez de criar uma coluna nova.
-- ---------------------------------------------------------------------------
alter table task_cards drop constraint task_cards_last_moved_event_type_check;

alter table task_cards add constraint task_cards_last_moved_event_type_check
  check (last_moved_event_type in ('moved_em_andamento', 'moved_concluido', 'validated'));
