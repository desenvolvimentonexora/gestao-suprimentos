-- ---------------------------------------------------------------------------
-- Substitui task_card_activities (0047, log que empilhava toda movimentação)
-- por um registro único da última movimentação por card — cada nova
-- movimentação substitui a anterior, não acumula histórico.
-- ---------------------------------------------------------------------------
drop table if exists task_card_activities;

alter table task_cards
  add column last_moved_event_type text check (last_moved_event_type in ('moved_em_andamento', 'moved_concluido')),
  add column last_moved_at timestamptz,
  add column last_moved_by uuid;
