-- Ajuste de design Disparo/Em Negociação: categoria do material (assunto),
-- negociador responsável (papel distinto de quem criou a SOL) e a marca de
-- tempo de quando a requisição entrou em negociação, usada para o badge
-- "Em negociação há X dias".

alter table requests
  add column subject_category text,
  add column negotiator_id uuid references users(id),
  add column negotiating_started_at timestamptz;

create index requests_negotiator_id_idx on requests(negotiator_id);

create function fn_set_negotiating_started_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'negotiating' and old.status is distinct from 'negotiating' then
    new.negotiating_started_at = now();
  end if;
  return new;
end;
$$;

create trigger requests_set_negotiating_started_at
  before update on requests
  for each row execute function fn_set_negotiating_started_at();
