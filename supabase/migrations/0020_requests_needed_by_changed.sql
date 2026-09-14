-- Ajuste de design Em Negociação (adendo): tag "data alterada" ao lado da
-- data de entrega quando ela foi corrigida depois da criação da requisição.
-- Mesmo padrão de trigger já usado em fn_set_negotiating_started_at
-- (0013_negotiator_and_subject.sql): marca de forma automática, sem exigir
-- que a UI informe explicitamente que uma alteração aconteceu.

alter table requests add column needed_by_changed boolean not null default false;

create function fn_flag_needed_by_changed()
returns trigger
language plpgsql
as $$
begin
  if new.needed_by is distinct from old.needed_by then
    new.needed_by_changed = true;
  end if;
  return new;
end;
$$;

create trigger requests_flag_needed_by_changed
  before update on requests
  for each row execute function fn_flag_needed_by_changed();
