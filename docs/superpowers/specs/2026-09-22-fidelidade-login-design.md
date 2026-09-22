# Fidelidade visual — Tela de Login (design)

Data: 2026-09-22
Branch: `feature/fidelidade-login`

## Contexto

Primeira de uma rodada de fidelidade visual que depois cobre Início e os
cards de setor/módulo. O cliente quer cópia fiel de layout/proporção/estilo
em relação à tela de login do sistema real da Ampla (referência de
terceiro, captura de tela compartilhada pelo usuário nesta conversa, não
commitada no repositório) — **exceto cor**. Cor de marca, logo e paleta
continuam 100% de `settings.brand`/`config.theme` do tenant atual (Nexora),
nunca hardcoded, conforme regra 4.1 do CLAUDE.md.

Como é a primeira tela da rodada, os tokens de raio de borda criados aqui
são pensados para reuso em todo o sistema, não só nesta tela.

## Descrição da referência

Captura de tela de ~985px de largura (próxima da base de 1024px usada para
medir proporções):

- Painel esquerdo (~48% da largura, degradê vermelho escuro→claro de cima
  para baixo): bloco de logo (ícone + "ampla" em destaque + "incorporadora"
  como subtítulo menor abaixo, formando duas linhas), tagline central
  ("Sistema de Gestão Integrado") e, na base, ilustração de skyline com
  prédios de alturas variadas e textura densa de "janelas acesas" em
  âmbar/dourado cobrindo a maior parte dos edifícios.
- Painel direito (fundo quase branco): "Bem-vindo 👋" / "Faça login para
  continuar", rótulos pequenos em caixa alta ("E-MAIL", "SENHA"), campos
  com cantos discretamente arredondados (raio medido ≈ 6px nessa escala) e
  botão "ENTRAR" também com esse raio, largura total, caixa alta.

## 1. Tokens de raio de borda (reutilizáveis)

Novos tokens em `apps/web/src/index.css` (`:root`), no mesmo espírito das
variáveis de cor já existentes (mas como comprimento simples, não tripla
RGB — raio não precisa do modificador de opacidade do Tailwind):

```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 12px;
```

Ligados ao Tailwind em `tailwind.config.ts` via `theme.extend.borderRadius`:

```ts
borderRadius: {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
}
```

Hoje nenhum componente usa as classes `rounded-sm`, `rounded-md` ou
`rounded-lg` do Tailwind (confirmado por busca no repo) — logo, essa
extensão não colide com nada existente.

Aplicação:

- `Button`, `Input`, `PasswordInput`: trocam a classe `rounded` (valor fixo
  do Tailwind, 4px) por `rounded-md` (token, 6px — bate com a medição da
  referência). Esse é o único ajuste visual real desta seção. Como os três
  são componentes globais, o efeito aparece na aplicação inteira
  imediatamente — é a base para as próximas telas da rodada de fidelidade,
  não um valor isolado da tela de login.
- `Modal`, `ModuleCard`, `SupplierCard`: renomeiam `rounded-xl` (valor fixo
  do Tailwind, 12px) para `rounded-lg` (token, também 12px). Troca
  mecânica, zero mudança visual — só termina de conectar os componentes
  existentes ao sistema de tokens.
- `Card`, `Badge`, `Toast`: sem mudança. Continuam com `rounded` (4px do
  Tailwind, fora de escopo desta tela). Uma rodada futura decide se eles
  migram para `sm` ou `md` explícito.

## 2. Espaçamento

Conferido: `Input`/`PasswordInput` já usam `gap-1` (rótulo↔campo) e o
formulário de login usa `gap-4` (entre campos e botão) — escala padrão do
Tailwind, não valores soltos. Nenhuma mudança necessária.

## 3. Painel esquerdo — bloco de logo

A referência tem o nome da marca em duas linhas (nome principal +
subtítulo/segmento). Hoje `Brand` (`brandSchema`) só tem `name`, `tagline`
e `logoUrl`; a tagline já é usada como frase central separada
("Sistema de Gestão Integrado"), então o subtítulo do bloco de logo é um
campo novo e distinto.

- Novo campo opcional `subtitle` em `brandSchema`
  (`apps/web/src/core/config/settingsSchema.ts`) e no tipo `Brand`
  derivado.
- `BrandValues` (`apps/web/src/modules/admin/types.ts`) ganha `subtitle`.
- `IdentitySection.tsx`: novo `Input` "Subtítulo da marca" (opcional),
  mesmo padrão dos campos existentes.
- `AdminPage.tsx`: propaga `settings.brand.subtitle` para `IdentitySection`
  do mesmo jeito que `tagline`/`logoUrl` hoje.
- Seed (`supabase/seed/0001_demo.sql`): tenant Nexora ganha
  `'subtitle', 'Gestão de Suprimentos'` — só para o bloco de duas linhas
  ficar visível e testável no protótipo. Sem subtítulo configurado, o
  componente mostra só o nome (nunca inventa texto).
- `LoginPanel` (`LoginPage.tsx`): `logoUrl` sobe de `h-8` (32px) para
  `h-14` (56px). Quando `brand.subtitle` existir, uma linha abaixo do logo
  em texto menor (`text-sm`), na cor `text-on-primary` cheia — **sem**
  opacidade reduzida (`/70`, `/80` etc.), pelo mesmo motivo de contraste já
  registrado na seção 7 do CLAUDE.md para a faixa de topo das telas de
  trabalho: o topo do degradê é escuro, e opacidade reduzida sobre ele já
  se mostrou um problema de contraste neste projeto.

## 4. Painel esquerdo — ilustração do skyline

`apps/web/public/assets/skyline.svg` é redesenhado para ficar mais rico:

- 7–9 prédios (hoje são 10, mas com pouca variação de textura) com alturas
  mais variadas — mantém o princípio atual (retângulos simples, sem
  detalhe de telhado), só aumenta o contraste de altura entre eles.
- Textura de "janelas acesas" em grade, cobrindo a maior parte dos
  edifícios (hoje só 2 blocos pequenos de destaque no SVG atual).
- Cor da janela acesa: **exceção fixa aprovada nesta conversa** — âmbar
  fixo `#FBBF24` direto no asset SVG, documentado no PR
  como exceção de textura decorativa, não de cor de marca (regra 4.1). A
  silhueta dos prédios continua branca translúcida sobre o degradê do
  tema, como já é hoje — funciona com a cor de qualquer tenant, já que é
  uma sobreposição, não um valor de marca.

## 5. Responsivo

Abaixo do breakpoint `sm` do Tailwind (640px — o mesmo ponto em que o
layout já vira faixa superior compacta hoje, via `sm:flex-row` no
container e `sm:w-1/2` no painel), o skyline fica oculto
(`hidden sm:block` na tag da ilustração) — decisão tomada nesta conversa.
Só logo + tagline aparecem na faixa compacta. Nenhum breakpoint novo é
criado.

## 6. Formulário

Ícone de mostrar/ocultar senha (`PasswordInput`) e link "Esqueci minha
senha" continuam exatamente como estão — não há pedido de remoção.

## 7. Fora de escopo

- Lógica de autenticação (Supabase Auth) e validação de formulário — sem
  mudanças.
- `Card`, `Badge`, `Toast` — sem mudança de raio nesta rodada.
- Qualquer tela além do login (Início e cards ficam para as próximas
  rodadas, que herdam os tokens daqui).

## 8. Testes

- `LoginPage.test.tsx`: novo caso cobrindo `brand.subtitle` (aparece
  quando configurado, ausente quando não).
- `IdentitySection.test.tsx`: campo "Subtítulo da marca" persiste e é
  incluído no payload do submit.
- `IdentitySection.test.tsx` / testes de admin existentes: ajustar fixtures
  de `BrandValues` que hoje não incluem `subtitle`.
- Manual: `npm run dev`, abrir `/login`, testar em ~1280px, ~768px e
  ~360px; conferir contraste do subtítulo do logo e a textura do skyline.

## Definição de pronto

- Responsivo até 360px (skyline oculto abaixo de `sm`, testado).
- Cor 100% de config, exceto a exceção documentada da janela acesa
  (item 4).
- Tokens de raio como valores reutilizáveis, não soltos por componente.
- Lint, typecheck, testes e build passando.
- PR descreve: valores de raio escolhidos (`sm`/`md`/`lg`), a decisão
  sobre a cor da janela acesa como exceção à regra 4.1, e como testar
  manualmente.
