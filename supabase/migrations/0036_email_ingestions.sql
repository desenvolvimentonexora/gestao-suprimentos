-- Leitura automática de cotações por e-mail (spec em
-- docs/superpowers/specs/2026-09-19-leitura-automatica-cotacoes-design.md).
--
-- source: de onde a cotação veio — 'manual' (upload por alguém, como já
-- era) ou 'email_auto' (a Edge Function poll-supplier-quotes criou sozinha).
alter table quotations add column source text not null default 'manual'
  check (source in ('manual', 'email_auto'));

-- email_ingestions: registro de toda mensagem candidata (não lida, com PDF)
-- que a Edge Function poll-supplier-quotes examinou — casada ou não. Serve
-- de auditoria (o que aconteceu com cada e-mail) e de trava de idempotência
-- (única por gmail_message_id): se marcar como lida falhar depois de já
-- ter gravado a cotação, uma segunda tentativa encontra a linha aqui e não
-- duplica nada.
create table email_ingestions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  gmail_message_id text not null,
  from_email text not null,
  subject text,
  request_id uuid references requests(id),
  supplier_id uuid references suppliers(id),
  quotation_id uuid references quotations(id),
  status text not null check (status in ('matched', 'unmatched', 'error')),
  detail text,
  created_at timestamptz not null default now(),
  unique (tenant_id, gmail_message_id)
);
create index email_ingestions_tenant_id_idx on email_ingestions(tenant_id);

alter table email_ingestions enable row level security;
create policy "email_ingestions_select_own_tenant" on email_ingestions
  for select
  to authenticated
  using (tenant_id = current_tenant_id());
