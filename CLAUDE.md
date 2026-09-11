# CLAUDE.md — Gestão de Suprimento Beta V1 (Nexora)

Este arquivo orienta o Claude Code neste repositório. Leia-o inteiro antes de qualquer tarefa.
Documentação de referência: `docs/Documentacao_Tecnica_Consolidada_v4.docx` (arquitetura, modelo de dados, modelos de entrega).

## 1. O que é este projeto

Plataforma web de gestão de suprimentos (requisições → cotações → comparação → aprovação → pedidos → entregas → notas fiscais), comercializada pela Nexora para empresas de segmentos diferentes (construção, confecção, indústria).

Princípio que governa tudo: **um único código serve todos os clientes.** O que difere entre clientes (logo, cores, vocabulário, campos, fluxos de aprovação, módulos ligados) é configuração guardada no banco, nunca código.

Estado atual: **protótipo**. Um único projeto Supabase na nuvem (plano gratuito, conta da Nexora), um único cliente fictício, tudo no domínio da Nexora. Sem Docker e sem Supabase local nesta fase. Mesmo assim, o código já deve ler toda configuração do banco, como se houvesse vários clientes.

## 2. Stack (não mudar sem decisão explícita)

| Camada | Tecnologia |
|---|---|
| Front | React 18 + TypeScript + Vite |
| Estilo | Tailwind CSS + CSS variables para tema |
| Roteamento | React Router |
| Estado de servidor | TanStack Query |
| Formulários | React Hook Form + Zod |
| Backend | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) |
| Validação de config | Zod |
| Testes | Vitest + Testing Library; Playwright para e2e (fase posterior) |
| Ícones | lucide-react |
| Excel / PDF | SheetJS (xlsx), pdf-lib |

Não usar: Redux, styled-components, CSS-in-JS, Next.js, localStorage para dados de negócio, bibliotecas de UI prontas (MUI, Ant, Chakra). Componentes são nossos.

## 3. Estrutura do repositório

```
apps/web/                  front React
  src/
    app/                   bootstrap, providers, router, tema
    core/                  auth, tenant (descoberta do cliente), config, permissões
    components/            componentes genéricos (Button, Input, Card, Table, Modal...)
    modules/               um diretório por módulo de negócio
      home/
      requests/
      quotations/
      comparison/
      approvals/
      suppliers/
      units/
      admin/
    lib/                   supabase client tipado, utils, formatters
    types/                 tipos gerados do banco (supabase gen types)
supabase/
  migrations/              SQL numerado, nunca editado depois de aplicado
  functions/               Edge Functions (TypeScript/Deno)
  seed/                    dados de demonstração
templates/                 configuração inicial por segmento (construcao.json, confeccao.json)
scripts/                   provisionar.sh, atualizar.sh, gerar-tipos.sh
docs/                      documentação técnica
```

Regras de estrutura:
- Um módulo **nunca importa de outro módulo**. Compartilham dados via banco e componentes via `components/` e `core/`.
- Cada módulo se registra em `modules/registry.ts` com: `id`, `label`, `icon`, `route`, `permissions`. O menu e a home são gerados a partir do registro filtrado pela licença e pela configuração.
- Funções chamadas por eventos ficam em componentes, nunca em `window.*`.

## 4. Regras invioláveis

1. **Nada de cliente no código.** Proibido `if (cliente === ...)`, nomes de empresas, cores fixas, rótulos de entidades fixos ("Obra", "SOL"). Rótulos vêm de `config.vocabulary`, cores de `config.theme`, módulos de `config.modules`.
2. **Descoberta do cliente pelo subdomínio.** `core/tenant` lê `window.location.hostname`, consulta a tabela `tenants` (no protótipo, uma linha) e obtém `{ tenantId, supabaseUrl, supabaseAnonKey, modules }`. Mesmo com um único cliente, o caminho é este.
3. **Toda mudança de banco é uma migration** em `supabase/migrations/NNNN_descricao.sql`. Nunca editar uma migration já aplicada. Adicionar é seguro; renomear/remover só em versão posterior.
4. **RLS em toda tabela** desde a migration que a cria. Nenhuma tabela sem política.
5. **Regras de negócio críticas no banco ou em Edge Function**, não no front (ex.: "uma requisição só tem uma comparação ativa" é um índice único parcial).
6. **Soft delete.** `deleted_at` em vez de DELETE. Auditoria em `audit_log`.
7. **Chaves de API nunca no front.** IA e integrações passam por Edge Function.
8. **TypeScript estrito.** `strict: true`, sem `any` sem justificativa em comentário.
9. **Acessibilidade mínima:** foco visível, labels em inputs, contraste AA, navegação por teclado nos modais.
10. **Não instalar dependências novas sem listar o motivo no PR.**

## 5. Fluxo Git

- `main`: só recebe código pronto e testado, via pull request.
- Uma branch por feature/fase: `feature/f1-login`, `feature/f1-home`, `feature/f2-requests`, `fix/...`.
- Commits em português, seguindo Conventional Commits: `feat(login): tela de login com Supabase Auth`, `fix(home): contraste do card em tema escuro`, `chore(db): migration 0003 units`.
- Cada PR: descrição do que muda, migrations incluídas, como testar. Branch curta; mesclar cedo.
- Versões são tags `vX.Y.Z` em `main`. `CHANGELOG.md` atualizado a cada tag.
- Nunca criar branch por cliente.

Antes de cada commit: `npm run lint && npm run typecheck && npm run test`.

## 6. Fases de construção

Trabalhar **uma fase por vez**, na ordem. Não iniciar a próxima antes de a anterior estar mesclada em `main` e testada.

### Fase 0 — Fundação (`feature/f0-fundacao`)
- Monorepo com `apps/web` (Vite + React + TS + Tailwind) e `supabase/` (CLI inicializada e vinculada ao projeto na nuvem com `supabase link`).
- ESLint, Prettier, Vitest configurados. Scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `db:migrate`, `db:types`.
- Migration `0001_fundacao.sql`: `tenants`, `organizations`, `users` (perfil ligado a `auth.users`), `roles`, `permissions`, `user_roles`, `settings`, `audit_log`, função de trigger de auditoria. RLS em tudo.
- `core/tenant`, `core/config` (carrega `settings` e valida com Zod), `core/theme` (aplica CSS variables), `core/auth` (sessão Supabase), `core/permissions`.
- Seed com um tenant, uma organização, um admin, configuração de tema e vocabulário do segmento "construção".
- Componentes base: `Button`, `Input`, `PasswordInput`, `Card`, `Badge`, `Spinner`, `Toast`.

### Fase 1 — Login e Home (`feature/f1-login`, `feature/f1-home`)
Ver seção 7 para a direção visual.
- **Login:** e-mail e senha via Supabase Auth; erros claros ("E-mail ou senha incorretos"); "Esqueci minha senha" com fluxo de redefinição; logo e cor do cliente vindos da configuração; redirecionamento para a home após login; sessão persistida.
- **Home:** saudação com nome do usuário; grade de módulos gerada de `modules/registry.ts` filtrada por licença, configuração e permissão; status de cada módulo (disponível/beta) vindo do registro; busca rápida; troca de área (setor) se o cliente tiver mais de uma; menu de usuário com sair.
- Layout base da aplicação (`AppShell`): barra superior, área de conteúdo, responsivo até 360px.

### Fase 2 — Cadastros (`feature/f2-units`, `feature/f2-suppliers`)
- Unidades (o que o cliente chama de obra/loja/fábrica) e Fornecedores (categorias, múltiplos CNPJs, contatos). Tabelas, listagem, formulário, busca, importação por planilha.

### Fase 3 — Requisições e Cotações (`feature/f3-requests`, `feature/f3-quotations`)
- Requisições com itens, importação Excel com mapeamento de colunas, estados e prazos; cotações por requisição; tempo real via Realtime.

### Fase 4 — Comparação e Aprovações (`feature/f4-comparison`, `feature/f4-approvals`)
- Leitura de PDFs por IA via Edge Function; tabela comparativa; motor de workflow configurável; devolução automática em rejeição; registro em `approvals` e `audit_log`.

### Fase 5 — Pedidos básico e Administração (`feature/f5-orders`, `feature/f5-admin`)
- Pedidos vinculados à comparação aprovada; painel de administração: tema, vocabulário, campos customizados, fluxos, usuários, módulos (dentro da licença).

### Fase 6 — Segundo cliente fictício (`feature/f6-tenant-2`)
- Template "confecção", segundo tenant no mapa, subdomínio apontado. Critério de sucesso: alternar entre os dois sem tocar em código.

Fases posteriores (entregas, notas fiscais, concorrência, dashboard, RH, logística) só depois da Fase 6.

## 7. Direção visual (Fase 1)

**Histórico:** a versão original desta seção pedia uma home discreta ("mesa de trabalho calma", sem gradiente, sem selo colorido), rejeitando de propósito uma referência do cliente com cards em grade e gradiente. Essa decisão foi revista duas vezes:

1. Primeira revisão: o cliente quer fidelidade ao layout do sistema anterior dele (grade de cards, saudação centralizada, degradê, badges de status), trocando só a paleta (era vermelho/bordô, agora preto + verde Nexora) — mas só nas telas de navegação (Login, Home, hubs de setor). As telas de trabalho (listagens, formulários, comparação) ficaram na linha "mesa de trabalho calma": sem degradê, bordas finas em vez de cor.
2. Segunda revisão (atual): o cliente pediu mais cor também nas telas de trabalho. Em vez de aplicar o degradê completo atrás de tabelas e listas densas (o que prejudica leitura de dados em uso prolongado), adotamos um **modelo híbrido**: o topo de cada tela de trabalho ganha o mesmo degradê preto→verde da Home (com o título da página, ações e cards de indicador, se houver), e a área de conteúdo abaixo — onde ficam listas, tabelas, formulários — continua em `--color-bg`, clara, sem degradê. Ver "Telas de trabalho" mais abaixo para o padrão exato.

**Tema (valores padrão, sobrescritos por `settings.theme` e `settings.brand` do tenant):**
- `--color-bg`: #F4F5F4
- `--color-surface`: #FFFFFF
- `--color-ink`: #141414 · `--color-ink-muted`: #5C645F
- `--color-primary`: #3A7769 (verde Nexora, vem da config)
- `--color-primary-dark`: #0E0E0E (ponta escura dos degradês)
- `--color-on-primary`: #FFFFFF (texto sobre fundo `primary`/degradê)
- `--color-accent`: #B45309 · `--color-line`: #E2E5E3
- `--color-badge-available` / `--color-badge-beta` / `--color-badge-soon`: #3A7769 / #B45309 / #8A8F8C
- `settings.brand`: `{ name, tagline, logoUrl }` — nome e frase da tela de login, logo (hoje um SVG placeholder em `apps/web/public/assets/`).
- Cards e formulários: bordas de 1px em `--color-line`, sombra só no hover de card (não em repouso). Degradê é aceito nas telas de navegação, não nas telas de trabalho.
- Nenhum componente usa hex direto — sempre `var(--color-*)`, alimentado pelo tema da config.

**Tipografia:** mesma família (Inter), mesma escala. Rótulos do formulário de login em caixa alta pequena via classe (`labelClassName` do `Input`/`PasswordInput`) — nunca texto literalmente maiúsculo, para não quebrar leitor de tela que soletra letra por letra.

**Login:**
- Painel esquerdo: degradê de `--color-primary-dark` a `--color-primary` (baixo para cima), logo (`brand.logoUrl`) no topo, `brand.tagline` no meio, ilustração de skyline (placeholder) na base. Vira faixa superior compacta abaixo de ~720px.
- Painel direito, fundo `--color-bg`, formulário até 380px: "Bem-vindo 👋", "Faça login para continuar", campos com rótulo pequeno em caixa alta, botão "ENTRAR" em caixa alta e largura total. Erro de autenticação em texto acima do botão, sem modal. "Esqueci minha senha" discreto abaixo.

**Home (setores):**
- Fundo em degradê de `--color-primary-dark` (topo) a `--color-primary` (base), tela cheia.
- Saudação centralizada "Bom dia/Boa tarde/Boa noite, {nome} 👋" em `--color-on-primary`.
- Grade de `components/ModuleCard.tsx` via `components/ModuleGrid.tsx` — 4 colunas largas, 2 tablet, 1 mobile. Conteúdo dos cards (setores: Suprimentos, Engenharia, RH...) é dado de produto em `modules/registry.ts` (`sectorRegistry`), não vocabulário por cliente.
- `components/StatusBadge.tsx` no canto de cada card: DISPONÍVEL / BETA / EM BREVE. "Em breve" = opacidade reduzida, não clicável (`aria-disabled`). Os demais são clicáveis; só o módulo com `route` definido no registro navega de verdade — os outros mostram "Módulo ainda não disponível" ao clicar.
- "↩ Sair da conta" centralizado abaixo da grade.

**Suprimentos (`/suprimentos`, primeiro hub de setor construído):**
- Mesmo fundo em degradê. Barra com busca (visual por enquanto, sem lógica) à esquerda, saudação centralizada, "← Setores" à direita (volta para `/`).
- Mesma grade de `ModuleCard`, conteúdo em `modules/registry.ts` (`suprimentosRegistry`). Só "Agenda de Fornecedores" navega (para um placeholder "em construção" até a Fase 2 implementar de verdade); os demais mostram a mesma mensagem de indisponibilidade.

Ao adicionar um novo setor ou ferramenta, editar `modules/registry.ts` — nunca hardcodar card fora dali. Esse conteúdo (nomes, descrições, ordem) é do produto Nexora, igual entre tenants; o que muda por configuração é só tema e marca (`settings.theme`, `settings.brand`).

**Telas de trabalho (Fase 2+, modelo híbrido):**
- Estrutura em duas faixas: `<div className="min-h-screen bg-bg">` envolvendo tudo; dentro, uma faixa de topo `bg-gradient-to-b from-primary-dark to-primary` com padding próprio, e depois a área de conteúdo normal (`mx-auto max-w-6xl px-6 py-8`, fundo `--color-bg` herdado).
- Na faixa de topo: link de voltar (`text-on-primary`, **nunca** com opacidade reduzida tipo `/80` — testar contraste, o topo do degradê é bem escuro), título da página (`text-on-primary`), ações da tela (botões) e, se a tela tiver métricas, os cards de indicador.
- Botões dentro da faixa de topo usam o variant `on-primary` de `components/Button` (borda e fundo translúcidos brancos, texto `text-on-primary`) — os variants `primary`/`secondary`/`ghost` não têm contraste adequado sobre o degradê. `components/ComingSoonButton` aceita esse variant também.
- Cards de indicador (números, KPIs) ficam brancos (`bg-surface`, como um `Card` comum) flutuando sobre o degradê — mesmo padrão de `ModuleCard` sobre o degradê da Home.
- Abaixo da faixa de topo, tudo volta ao padrão "mesa de trabalho calma": fundo `--color-bg`, listas/tabelas/formulários com bordas finas em `--color-line`, sem degradê, sem sombra em repouso. É aqui que fica a densidade de dados (linhas de tabela, cards de item, listas longas) — não decorar essa área com cor de marca além do que já é catálogo de produto (`StatusBadge`, badges de status do domínio).
- Cores semânticas (atraso/erro em vermelho, pendência em âmbar, aprovado em verde de status) nunca são substituídas pela cor de marca — mesmo o verde da Nexora sendo similar a "aprovado", são conceitos diferentes e devem continuar visualmente distintos.

## 8. Convenções de código

- Componentes em PascalCase, um por arquivo, com props tipadas. Hooks em `useX`.
- Consultas ao Supabase ficam em `modules/<m>/api.ts`, expostas via hooks do TanStack Query em `modules/<m>/queries.ts`. Componentes não chamam o Supabase diretamente.
- Textos de interface em `pt-BR`, sentença normal, sem ponto final em rótulos, com ponto em mensagens completas. Verbos ativos em botões: "Salvar alterações", "Enviar para aprovação".
- Datas com `Intl.DateTimeFormat('pt-BR')`. Moeda com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: config.currency })`.
- Erros: mostrar o que aconteceu e o que fazer. Nunca "Ocorreu um erro".
- Estados vazios convidam à ação: "Nenhuma requisição ainda. Importe uma planilha ou crie a primeira."

## 9. Banco de dados

- Nomes de tabelas e colunas em inglês, snake_case, plural para tabelas (`requests`, `request_items`).
- Toda tabela: `id uuid default gen_random_uuid()`, `tenant_id`, `created_at`, `updated_at`, `created_by`, `deleted_at`.
- Chaves estrangeiras sempre. Índices para toda coluna usada em filtro.
- RLS: política por `tenant_id` e por permissão. Escrita sensível (aprovações, exclusão) só via Edge Function com `service_role`.
- Após qualquer migration: `npm run db:types` para regenerar `src/types/database.ts`.

## 10. Definição de pronto (por feature)

- [ ] Funciona no fluxo feliz e nos erros previstos
- [ ] Responsivo até 360px
- [ ] Textos e rótulos vindos da configuração quando forem de entidade de negócio
- [ ] Migrations incluídas e aplicadas no projeto de desenvolvimento sem erro
- [ ] Tipos regenerados
- [ ] Lint, typecheck e testes passando
- [ ] Nenhuma menção a cliente, cor ou rótulo fixo no código
- [ ] PR descreve como testar

## 11. Comandos

```bash
npm install
npm run dev              # front em http://localhost:5173, conectado ao projeto Supabase na nuvem
npx supabase login       # uma vez, autentica a CLI
npx supabase link --project-ref <ref>   # uma vez, vincula ao projeto de desenvolvimento
npm run db:migrate       # = supabase db push: aplica as migrations pendentes no projeto vinculado
npm run db:types         # = supabase gen types typescript --linked > src/types/database.ts
npm run lint && npm run typecheck && npm run test
```

Não usar `supabase start` nem Docker no protótipo. As migrations são aplicadas diretamente no projeto de desenvolvimento na nuvem com `supabase db push`. Como o banco é compartilhado por quem desenvolve, avisar antes de aplicar uma migration e nunca aplicar migration destrutiva sem backup (`supabase db dump`).

Variáveis de ambiente (`apps/web/.env.local`, nunca commitado):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
Valores obtidos em Project Settings → API do projeto na nuvem. No protótipo essas variáveis alimentam a única linha da tabela `tenants`; em produção o front consulta o servidor de licenças.

## 12. Como o Claude Code deve trabalhar aqui

- Ler este arquivo e a seção da fase atual antes de começar. Perguntar se a fase não estiver clara.
- Propor o plano em tópicos antes de escrever código em tarefas maiores que um componente.
- Criar a branch da feature antes de qualquer alteração. Não commitar em `main`.
- Rodar lint, typecheck e testes antes de anunciar conclusão. Se algo falhar, corrigir, não silenciar.
- Ao terminar, listar: arquivos alterados, migrations adicionadas, como testar manualmente.
- Se um pedido violar a seção 4, dizer qual regra e propor a alternativa em vez de obedecer.
