# Leitura automática de cotações por e-mail — design

Data: 2026-09-19
Fase: 3/4 (`feature/f3-leitura-cotacoes-email`, a criar a partir de `main`)

## Contexto

O disparo automático de solicitações (Fase 3, já em `main`) manda e-mail de
cotação pro fornecedor e registra em `request_dispatch_recipients` quem foi
contatado por qual SOL. O que falta é o lado de volta: quando o fornecedor
responde com o orçamento em PDF, alguém hoje precisa abrir o e-mail, baixar
o PDF, entrar no sistema e importar manualmente via "Adicionar cotação por
PDF" (`ImportQuotationPdfModal`, em Equalização).

Esse fluxo manual já resolve a parte difícil — upload do PDF, extração por
IA (Claude, via `compare-quotations`), casamento dos itens extraídos com os
itens da SOL (`matchExtractedItems`) e gravação em `quotation_items`/
`comparison_lines`. Este design conecta a entrada (e-mail do fornecedor) a
esse pipeline que já existe, sem reescrevê-lo.

**Confirmado com o usuário**: fornecedores sempre respondem com PDF anexo
(nunca só texto no corpo) — isso simplifica bastante, não precisa de
extração de texto livre.

## Objetivo

A cada poucos minutos, verificar a caixa de entrada da Nexora por respostas
de fornecedores com PDF anexo, casar cada uma com a SOL/fornecedor certos, e
alimentar o pipeline de extração já existente — **sem revisão humana antes
de confirmar** (decisão explícita do usuário: a rede de segurança é a
conferência que já acontece em Em Negociação, não um gate de confiança
antes de gravar). Para essa rede de segurança funcionar de verdade, este
design também adiciona a visualização do PDF original em Em Negociação, que
hoje não existe pra nenhuma cotação (nem as importadas manualmente).

## 1. Autenticação de leitura: API do Gmail (OAuth), não IMAP

A senha de app já configurada (`GMAIL_USER`/`GMAIL_APP_PASSWORD`) funciona
pra SMTP (enviar) e serviria pra IMAP também, mas não tem biblioteca de IMAP
madura conhecida pra Deno (risco de implementação alto — protocolo binário,
sem opção de só usar `fetch`). A API REST do Gmail resolve isso: é só HTTP,
roda em qualquer runtime que tenha `fetch`, mas exige OAuth (a senha de app
não vale aqui) — custo inicial de setup maior, execução mais simples e
confiável depois.

Novos secrets do Supabase: `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`,
`GMAIL_OAUTH_REFRESH_TOKEN`. Setup único (não repete a cada deploy):

1. Criar um projeto no Google Cloud Console, ativar a "Gmail API".
2. Criar credenciais OAuth 2.0 (tipo "Aplicativo de Desktop" é o caminho
   mais simples pra gerar o refresh token manualmente uma vez).
3. Autorizar o escopo `https://www.googleapis.com/auth/gmail.modify`
   (precisa de `modify`, não só `readonly`, porque o passo de marcar o
   e-mail como lido usa `messages.modify`) logado na conta Gmail da Nexora.
4. Trocar o código de autorização por um refresh token (fluxo OAuth padrão
   "installed app" — o passo a passo exato de comandos fica no plano de
   implementação, não aqui).
5. Guardar os três valores como secrets do Supabase.

## 2. Gatilho: `pg_cron` a cada 10 minutos

```sql
select cron.schedule(
  'poll-supplier-quotes',
  '*/10 * * * *',
  $$ select net.http_post(
       url := '<edge-function-url>/poll-supplier-quotes',
       headers := jsonb_build_object('Authorization', 'Bearer ' || '<service-role-key-ou-anon-key-com-permissão>')
     ) $$
);
```

(Sintaxe exata e qual chave usar no header ficam pro plano — depende de como
o projeto tem `pg_net`/`pg_cron` habilitados; ambas as extensões existem no
plano gratuito do Supabase.) 10 minutos é um intervalo de partida razoável —
fácil de ajustar depois sem migration, é só re-agendar o cron.

## 3. Nova Edge Function `poll-supplier-quotes`

Fluxo por execução:

1. `GET /gmail/v1/users/me/messages?q=is:unread has:attachment filename:pdf`
   — já filtra no lado do Gmail pra não trazer lixo.
2. Pra cada mensagem: `GET .../messages/{id}?format=full` pra pegar
   `From`, `Subject` e localizar a parte do PDF (pra obter o
   `attachmentId`).
3. Extrai o número da SOL do assunto: remove prefixos `Re:`/`Fwd:` (pode
   repetir), espera o padrão `Cotação — {número}` (mesmo texto que
   `buildDispatchEmail`, do disparo automático, já gera) — se não bater
   esse padrão, marca como `unmatched` (ver seção 5) e segue pro próximo
   e-mail, sem travar o lote inteiro.
4. Resolve `{número}` pra um `request_id`: bate com `requests.external_ref`
   diretamente, ou com `requests.sequence_number` se o número extraído
   for do formato "SOL {n}".
5. Confirma o remetente: busca em `request_dispatch_recipients` uma linha
   com esse `request_id` e `email` igual ao `From` (case-insensitive) —
   isso dá o `supplier_id` com confiança (foi literalmente quem avisamos
   por e-mail). Sem casamento aqui (SOL existe mas remetente não bate com
   nenhum destinatário conhecido) → `unmatched`.
6. Baixa o anexo: `GET .../messages/{id}/attachments/{attachmentId}` —
   Gmail devolve em base64url (`-`/`_`, sem padding); precisa converter pra
   base64 padrão antes de passar pra `extractQuoteDataFromPdf` (que já
   espera base64 padrão, é o mesmo formato que `compare-quotations/index.ts`
   já produz hoje a partir do Storage).
7. Roda o pipeline que já existe, do lado do servidor (mesma lógica de
   `getOrCreateDraftComparison` → `createPdfQuotation` → upload pro bucket
   `quotation-attachments` → `extractQuoteDataFromPdf` → `matchExtractedItems`
   → grava `quotation_items`/`comparison_lines`/atualiza `quotations`,
   igual ao que `ImportQuotationPdfModal` + `confirmExtractedItems` já fazem
   hoje no front, só que com `service_role` e sem esperar clique de
   ninguém). `created_by`/`reviewer` ficam `null` nessas linhas — não tem
   um usuário humano por trás dessa ação.
8. Marca a mensagem processada: `POST .../messages/{id}/modify` removendo a
   label `UNREAD`. Isso é o **último** passo, de propósito — se algo falhar
   antes, o e-mail continua não-lido e é tentado de novo na próxima
   execução (ver limitação de duplicidade na seção 6).

`extractQuoteDataFromPdf` (hoje só dentro de `compare-quotations/`) muda de
lugar pra `supabase/functions/_shared/ai-provider.ts`, já que duas Edge
Functions passam a precisar dela — `compare-quotations/index.ts` atualiza o
import, comportamento idêntico, é só mover arquivo.

## 4. Confirmação automática, sem revisão

Diferente do fluxo manual (que só grava depois do clique em "Confirmar" na
tela de revisão), aqui o resultado de `matchExtractedItems` é gravado
direto — inclusive itens com `requestItemId: null` (não casaram com nenhum
item da SOL) são **descartados silenciosamente**, mesmo comportamento que
`confirmExtractedItems` já tem hoje pro fluxo manual (filtra
`item.requestItemId !== null` antes de inserir). Isso já era assim antes
desta automação; não é uma regra nova, só passa a rodar sem ninguém ver.

## 5. Auditoria e idempotência: tabela `email_ingestions`

Toda mensagem candidata (tinha PDF, estava não lida) gera uma linha aqui,
dê ou não certo o casamento — serve tanto de log pra investigar problema
quanto de trava contra reprocessar o mesmo e-mail duas vezes (única por
`gmail_message_id`, então mesmo que o passo de marcar como lida falhe, uma
segunda tentativa não duplica a cotação).

```sql
create table email_ingestions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  gmail_message_id text not null,
  from_email text not null,
  subject text,
  request_id uuid references requests(id),
  supplier_id uuid references suppliers(id),
  quotation_id uuid references quotations(id),
  status text not null, -- 'matched' | 'unmatched' | 'error'
  detail text,
  created_at timestamptz not null default now(),
  unique (tenant_id, gmail_message_id)
);
```

Linhas com `status = 'unmatched'` (ou `'error'`) são exatamente a fila de
"ninguém tratou isso automaticamente" — não tem UI pra elas neste design
(fora de escopo, ver seção 8), mas a tabela já deixa o caminho pronto pra
uma tela de acompanhamento futura, sem precisar de nova migration quando
alguém pedir isso.

## 6. Rastreabilidade: `quotations.source`

Nova coluna, pra saber depois se uma cotação chegou sozinha ou foi
importada por alguém:

```sql
alter table quotations add column source text not null default 'manual'
  check (source in ('manual', 'email_auto'));
```

## 7. "Ver PDF" em Em Negociação (peça nova, sem a qual a confirmação automática fica sem rede de segurança)

Hoje, em nenhum lugar do sistema dá pra abrir o PDF original de uma
cotação — nem as importadas manualmente. `NegotiatingRequestCard.tsx`
(Em Negociação) lista cada cotação (Fornecedor / Status / Ações), só com a
ação "Descartar". Adiciona um link "Ver PDF" nessa linha, que:

- Busca o `storage_path` mais recente em `quotation_attachments` pra
  aquele `quotation_id`.
- Gera uma signed URL (`supabase.storage.from('quotation-attachments').createSignedUrl(path, 60)`)
  — o bucket é privado, mas a policy de storage já libera `select` pra
  qualquer usuário autenticado dentro do próprio tenant, então isso
  funciona direto do front, sem Edge Function nova.
- Abre em nova aba.

Sem essa peça, "confiar na conferência de Em Negociação" (a decisão que
justificou pular o gate de confiança) não tem como se sustentar — a pessoa
não teria como checar o PDF original mesmo se quisesse.

## 8. Limitações conhecidas (aceitas, não resolvidas agora)

- Fornecedor responde de um e-mail diferente do cadastrado (ex.: usa e-mail
  pessoal em vez do corporativo cadastrado) → não casa com
  `request_dispatch_recipients`, vira `unmatched`, ninguém é avisado
  automaticamente — fica só registrado em `email_ingestions` pra quem for
  investigar manualmente.
- Assunto alterado pelo fornecedor a ponto de não bater o padrão (ex.:
  apaga o "Re:" e escreve "Segue orçamento") → mesmo caminho, `unmatched`.
- Falha entre gravar a cotação e marcar o e-mail como lido → próxima
  execução tenta de novo o mesmo e-mail; como a trava de idempotência é por
  `gmail_message_id` na tabela de auditoria, a segunda tentativa é
  interrompida antes de duplicar a cotação (checar `email_ingestions` antes
  de processar, não só marcar Gmail como lido).
- Nenhuma notificação automática pra fila de `unmatched`/`error` — só fica
  registrado.

## Fora de escopo

Tela de acompanhamento dos e-mails não reconhecidos automaticamente; gate
de confiança bloqueando confirmação automática (decisão explícita do
usuário: sem isso); extração de cotação por texto livre no corpo do e-mail
(fornecedores sempre respondem com PDF, confirmado); qualquer mudança no
fluxo manual de importação de PDF que já existe.

## Mudanças de dados (resumo)

- Migration nova: `quotations.source` + tabela `email_ingestions`.
- `extractQuoteDataFromPdf` migra de `compare-quotations/ai-provider.ts`
  pra `_shared/ai-provider.ts` (sem mudança de comportamento).
- `npm run db:migrate` (aviso prévio) + `npm run db:types` depois.

## Testes

- Lógica pura de casamento de assunto → número da SOL (`parseQuoteSubject`
  ou nome equivalente): testável isoladamente, mesmo padrão de
  `dispatch-logic.test.ts` (`Deno.test`).
- Conversão base64url → base64: função pura, testável isoladamente.
- Handler da Edge Function (orquestração com Gmail API + Supabase):
  sem teste automatizado, mesma convenção já usada em `review-request`/
  `compare-quotations` (index.ts não testado, só a lógica pura que ele
  chama) — verificado por teste manual ponta a ponta.
- Front: teste do link "Ver PDF" em `NegotiatingRequestCard.test.tsx`.

## Auto-revisão da spec

- Sem TBD pendente, exceto os comandos exatos de setup OAuth (passo a
  passo fica no plano de implementação, não é ambiguidade de design).
- Escopo focado: não mexe no fluxo manual existente, só adiciona um
  caminho de entrada novo que alimenta o mesmo pipeline.
- Risco mais importante do design (confirmação sem revisão) foi
  explicitamente confirmado pelo usuário, com a mitigação (link "Ver PDF")
  incluída como parte obrigatória deste design, não opcional.
