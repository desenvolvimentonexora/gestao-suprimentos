-- Correção crítica: a interface nunca deve exibir o UUID de uma requisição.
-- Quando não há external_ref (número vindo do ERP/planilha), precisa de um
-- número curto e legível gerado pelo próprio sistema, estável no tempo
-- (nunca muda, mesmo que outras requisições sejam excluídas depois).
--
-- Como o `id` é gerado por tenant mas não existe uma sequence nativa do
-- Postgres por tenant, usamos uma tabela de contadores genérica (um
-- contador por tenant + nome) com incremento atômico via upsert — mesmo
-- padrão de "getOrCreate com upsert" já usado em outras partes do sistema,
-- só que no banco em vez do client.

create table tenant_sequences (
  tenant_id uuid not null references tenants(id),
  sequence_name text not null,
  current_value bigint not null default 0,
  primary key (tenant_id, sequence_name)
);

alter table tenant_sequences enable row level security;
create policy "tenant_sequences_tenant_access" on tenant_sequences
  for all
  to authenticated
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create function fn_next_tenant_sequence(p_tenant_id uuid, p_sequence_name text)
returns bigint
language plpgsql
as $$
declare
  v_value bigint;
begin
  insert into tenant_sequences (tenant_id, sequence_name, current_value)
  values (p_tenant_id, p_sequence_name, 1)
  on conflict (tenant_id, sequence_name)
    do update set current_value = tenant_sequences.current_value + 1
  returning current_value into v_value;
  return v_value;
end;
$$;

alter table requests add column sequence_number bigint;

-- Preenche as requisições já existentes, em ordem de criação, por tenant.
with ordered as (
  select id, tenant_id, row_number() over (partition by tenant_id order by created_at) as rn
  from requests
)
update requests r
set sequence_number = o.rn
from ordered o
where r.id = o.id;

-- Sincroniza o contador de cada tenant com o maior número já usado no
-- backfill acima, para as próximas requisições continuarem a contagem.
insert into tenant_sequences (tenant_id, sequence_name, current_value)
select tenant_id, 'requests', coalesce(max(sequence_number), 0)
from requests
group by tenant_id
on conflict (tenant_id, sequence_name)
  do update set current_value = excluded.current_value;

alter table requests add constraint requests_tenant_sequence_unique unique (tenant_id, sequence_number);

create function fn_set_request_sequence_number()
returns trigger
language plpgsql
as $$
begin
  if new.sequence_number is null then
    new.sequence_number = fn_next_tenant_sequence(new.tenant_id, 'requests');
  end if;
  return new;
end;
$$;

create trigger requests_set_sequence_number
  before insert on requests
  for each row execute function fn_set_request_sequence_number();
