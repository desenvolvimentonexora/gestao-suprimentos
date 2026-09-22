# Fidelidade Visual — Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aproximar a tela de Login do layout/proporção da referência (sistema Ampla), mantendo cor 100% de config, e criar uma escala de tokens de raio de borda reutilizável para as próximas telas da rodada de fidelidade.

**Architecture:** Introduz `--radius-sm/md/lg` como variáveis CSS ligadas ao `borderRadius` do Tailwind; migra `Button`/`Input`/`PasswordInput` para o novo `radius-md` e `Modal`/`ModuleCard`/`SupplierCard` para `radius-lg` (troca mecânica, mesmo valor). Adiciona `brand.subtitle` opcional ao schema de configuração, propagado por Admin → banco (seed) → `LoginPage`. Redesenha `skyline.svg` com padrão SVG (`<pattern>`) para textura de janelas.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS (CSS variables), Zod, Vitest + Testing Library.

---

Spec de referência: `docs/superpowers/specs/2026-09-22-fidelidade-login-design.md`

Cada task termina com lint/typecheck/test implícitos no seu próprio passo de verificação — nenhum commit deve deixar o typecheck quebrado, mesmo entre tasks.

## Task 1: Tokens de raio de borda

**Files:**
- Modify: `apps/web/src/index.css`
- Modify: `apps/web/tailwind.config.ts`

- [ ] **Step 1: Adicionar as variáveis de raio ao `:root`**

Em `apps/web/src/index.css`, dentro do bloco `:root` (logo após a última variável `--color-status-chegou-ar-pendente`), adicionar:

```css
    --color-status-chegou-ar-pendente: 217 119 6;

    /* Escala de raio de borda — reutilizável em todo o sistema, não é
       configuração de tenant (diferente das cores acima). Medida
       proporcionalmente na referência de fidelidade visual do Login. */
    --radius-sm: 4px;
    --radius-md: 6px;
    --radius-lg: 12px;
  }
```

(Mantém o `}` de fechamento do `:root` que já existe — só insere as três linhas novas antes dele.)

- [ ] **Step 2: Ligar as variáveis ao Tailwind**

Em `apps/web/tailwind.config.ts`, dentro de `theme.extend`, depois do bloco `colors` e antes de `transitionDuration`, adicionar:

```ts
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
```

- [ ] **Step 3: Verificar que o projeto builda com o token novo**

Run: `npm run --prefix apps/web build`
Expected: build conclui sem erro (o Tailwind aceita a extensão de `borderRadius` mesmo sem nenhuma classe `rounded-sm/md/lg` em uso ainda).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/index.css apps/web/tailwind.config.ts
git commit -m "feat(theme): tokens de raio de borda reutilizáveis (--radius-sm/md/lg)"
```

---

## Task 2: Aplicar `radius-md` em Button, Input e PasswordInput

**Files:**
- Modify: `apps/web/src/components/Button/Button.tsx:40`
- Modify: `apps/web/src/components/Input/Input.tsx:27`
- Modify: `apps/web/src/components/PasswordInput/PasswordInput.tsx:33`

Troca mecânica de classe (`rounded` → `rounded-md`), sem teste novo — nenhum teste existente destes três componentes verifica a classe de raio (confirmado por busca no repo). A verificação é visual, feita na Task 8.

- [ ] **Step 1: `Button.tsx`**

Em `apps/web/src/components/Button/Button.tsx:40`, trocar:

```tsx
      className={`rounded px-4 py-2 text-sm font-medium transition duration-DEFAULT focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
```

por:

```tsx
      className={`rounded-md px-4 py-2 text-sm font-medium transition duration-DEFAULT focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
```

- [ ] **Step 2: `Input.tsx`**

Em `apps/web/src/components/Input/Input.tsx:27`, trocar:

```tsx
        className={`rounded border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
```

por:

```tsx
        className={`rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
```

- [ ] **Step 3: `PasswordInput.tsx`**

Em `apps/web/src/components/PasswordInput/PasswordInput.tsx:33`, trocar:

```tsx
            className={`w-full rounded border border-line bg-surface px-3 py-2 pr-10 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
```

por:

```tsx
            className={`w-full rounded-md border border-line bg-surface px-3 py-2 pr-10 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
```

- [ ] **Step 4: Rodar a suíte destes componentes**

Run: `npm run --prefix apps/web test -- Button Input PasswordInput`
Expected: PASS (nenhum teste depende da classe de raio).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/Button/Button.tsx apps/web/src/components/Input/Input.tsx apps/web/src/components/PasswordInput/PasswordInput.tsx
git commit -m "feat(theme): Button, Input e PasswordInput usam o token radius-md"
```

---

## Task 3: Migrar Modal, ModuleCard e SupplierCard para `radius-lg`

Troca mecânica (`rounded-xl` → `rounded-lg`), mesmo valor visual (12px em ambos). `Modal.test.tsx` tem duas asserções que citam a classe literal `rounded-t-xl` e precisam ser atualizadas.

**Files:**
- Modify: `apps/web/src/components/Modal/Modal.tsx:47,52`
- Modify: `apps/web/src/components/Modal/Modal.test.tsx:91,101`
- Modify: `apps/web/src/components/ModuleCard/ModuleCard.tsx:32,37`
- Modify: `apps/web/src/modules/suppliers/SupplierCard.tsx:36`

- [ ] **Step 1: Atualizar as asserções do teste do Modal primeiro**

Em `apps/web/src/components/Modal/Modal.test.tsx:91`, trocar:

```tsx
    expect(headerRow?.className).toContain('rounded-t-xl')
```

por:

```tsx
    expect(headerRow?.className).toContain('rounded-t-lg')
```

Em `apps/web/src/components/Modal/Modal.test.tsx:101`, trocar:

```tsx
    expect(headerRow?.className).not.toContain('rounded-t-xl')
```

por:

```tsx
    expect(headerRow?.className).not.toContain('rounded-t-lg')
```

- [ ] **Step 2: Rodar o teste do Modal e confirmar que falha**

Run: `npm run --prefix apps/web test -- Modal`
Expected: FAIL — `headerRow?.className` ainda contém `rounded-t-xl`, não `rounded-t-lg`.

- [ ] **Step 3: Atualizar `Modal.tsx`**

Em `apps/web/src/components/Modal/Modal.tsx:47`, trocar:

```tsx
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl bg-surface p-6 shadow-lg focus:outline-none"
```

por:

```tsx
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-lg bg-surface p-6 shadow-lg focus:outline-none"
```

Em `apps/web/src/components/Modal/Modal.tsx:52`, trocar:

```tsx
              ? `-mx-6 -mt-6 mb-2 flex items-center justify-between rounded-t-xl px-6 py-4 ${headerClassName}`
```

por:

```tsx
              ? `-mx-6 -mt-6 mb-2 flex items-center justify-between rounded-t-lg px-6 py-4 ${headerClassName}`
```

- [ ] **Step 4: Rodar o teste do Modal de novo e confirmar que passa**

Run: `npm run --prefix apps/web test -- Modal`
Expected: PASS

- [ ] **Step 5: Atualizar `ModuleCard.tsx`**

Em `apps/web/src/components/ModuleCard/ModuleCard.tsx:32`, trocar:

```tsx
  const cardClassName = `w-full ${CARD_HEIGHT} flex flex-col rounded-xl border border-line bg-surface p-4 text-left transition duration-DEFAULT hover:-translate-y-0.5 hover:shadow-sm`
```

por:

```tsx
  const cardClassName = `w-full ${CARD_HEIGHT} flex flex-col rounded-lg border border-line bg-surface p-4 text-left transition duration-DEFAULT hover:-translate-y-0.5 hover:shadow-sm`
```

Em `apps/web/src/components/ModuleCard/ModuleCard.tsx:37`, trocar:

```tsx
        className={`${CARD_HEIGHT} flex cursor-not-allowed flex-col rounded-xl border border-line bg-surface p-4 opacity-50`}
```

por:

```tsx
        className={`${CARD_HEIGHT} flex cursor-not-allowed flex-col rounded-lg border border-line bg-surface p-4 opacity-50`}
```

- [ ] **Step 6: Atualizar `SupplierCard.tsx`**

Em `apps/web/src/modules/suppliers/SupplierCard.tsx:36`, trocar:

```tsx
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
```

por:

```tsx
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
```

- [ ] **Step 7: Rodar a suíte completa destes três componentes**

Run: `npm run --prefix apps/web test -- Modal ModuleCard SupplierCard`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/Modal/Modal.tsx apps/web/src/components/Modal/Modal.test.tsx apps/web/src/components/ModuleCard/ModuleCard.tsx apps/web/src/modules/suppliers/SupplierCard.tsx
git commit -m "refactor(theme): Modal, ModuleCard e SupplierCard usam o token radius-lg"
```

---

## Task 4: Campo `brand.subtitle` — schema, tipos e painel de Admin

Uma única task (schema + Admin) para não deixar o typecheck quebrado entre commits: `BrandValues.subtitle` como campo obrigatório da interface só faz sentido junto com quem o consome (`IdentitySection`, `AdminPage`).

**Files:**
- Modify: `apps/web/src/core/config/settingsSchema.ts:36-42`
- Modify: `apps/web/src/modules/admin/types.ts:21-25`
- Modify: `apps/web/src/modules/admin/IdentitySection.tsx:81-90`
- Modify: `apps/web/src/modules/admin/IdentitySection.test.tsx:9,52`
- Modify: `apps/web/src/modules/admin/AdminPage.tsx:79-83`

- [ ] **Step 1: Adicionar `subtitle` ao `brandSchema`**

Em `apps/web/src/core/config/settingsSchema.ts:36-42`, trocar:

```ts
export const brandSchema = z
  .object({
    name: z.string().optional(),
    tagline: z.string().optional(),
    logoUrl: z.string().optional(),
  })
  .partial()
```

por:

```ts
export const brandSchema = z
  .object({
    name: z.string().optional(),
    // Segunda linha do bloco de logo (ex.: segmento/razão social), distinta
    // da tagline (frase central da tela de login). Opcional — sem
    // configuração, o bloco de logo mostra só o nome.
    subtitle: z.string().optional(),
    tagline: z.string().optional(),
    logoUrl: z.string().optional(),
  })
  .partial()
```

Isso já atualiza o tipo `Brand` (`z.infer<typeof brandSchema>`) em todo o projeto, incluindo `LoginPage.tsx`, sem nenhuma outra mudança de tipo.

- [ ] **Step 2: Adicionar `subtitle` a `BrandValues` (tipos do Admin)**

Em `apps/web/src/modules/admin/types.ts:21-25`, trocar:

```ts
export interface BrandValues {
  name: string
  tagline: string
  logoUrl: string
}
```

por:

```ts
export interface BrandValues {
  name: string
  subtitle: string
  tagline: string
  logoUrl: string
}
```

- [ ] **Step 3: Atualizar os fixtures do teste de `IdentitySection`**

Em `apps/web/src/modules/admin/IdentitySection.test.tsx:9`, trocar:

```tsx
const brand = { name: 'Nexora', tagline: 'Sistema de Gestão Integrado', logoUrl: '/logo.svg' }
```

por:

```tsx
const brand = {
  name: 'Nexora',
  subtitle: 'Gestão de Suprimentos',
  tagline: 'Sistema de Gestão Integrado',
  logoUrl: '/logo.svg',
}
```

- [ ] **Step 4: Adicionar o caso de teste do campo novo**

Em `apps/web/src/modules/admin/IdentitySection.test.tsx`, dentro do `describe('IdentitySection', ...)`, logo depois do teste `'pré-preenche os campos com os valores atuais'`, adicionar:

```tsx
  it('pré-preenche e permite editar o subtítulo da marca', () => {
    render(<IdentitySection {...baseProps()} />)
    expect(screen.getByLabelText('Subtítulo da marca')).toHaveValue('Gestão de Suprimentos')
  })
```

- [ ] **Step 5: Atualizar a asserção de `onSave` para incluir `subtitle`**

Em `apps/web/src/modules/admin/IdentitySection.test.tsx:52` (dentro do teste `'chama onSave com marca e tema atualizados ao enviar'`), trocar:

```tsx
    expect(onSave).toHaveBeenCalledWith({
      brand: { name: 'Cliente X', tagline: 'Sistema de Gestão Integrado', logoUrl: '/logo.svg' },
      theme,
    })
```

por:

```tsx
    expect(onSave).toHaveBeenCalledWith({
      brand: {
        name: 'Cliente X',
        subtitle: 'Gestão de Suprimentos',
        tagline: 'Sistema de Gestão Integrado',
        logoUrl: '/logo.svg',
      },
      theme,
    })
```

- [ ] **Step 6: Rodar os testes e confirmar que falham**

Run: `npm run --prefix apps/web test -- IdentitySection`
Expected: FAIL — `getByLabelText('Subtítulo da marca')` não encontra o campo; o payload de `onSave` não bate porque o componente ainda não tem `subtitle` no estado.

- [ ] **Step 7: Adicionar o campo no formulário**

Em `apps/web/src/modules/admin/IdentitySection.tsx:81-90`, trocar:

```tsx
        <Input
          label="Nome da marca"
          value={brandValues.name}
          onChange={(e) => setBrandValues((current) => ({ ...current, name: e.target.value }))}
        />
        <Input
          label="Tagline"
          value={brandValues.tagline}
          onChange={(e) => setBrandValues((current) => ({ ...current, tagline: e.target.value }))}
        />
```

por:

```tsx
        <Input
          label="Nome da marca"
          value={brandValues.name}
          onChange={(e) => setBrandValues((current) => ({ ...current, name: e.target.value }))}
        />
        <Input
          label="Subtítulo da marca"
          value={brandValues.subtitle}
          onChange={(e) => setBrandValues((current) => ({ ...current, subtitle: e.target.value }))}
        />
        <Input
          label="Tagline"
          value={brandValues.tagline}
          onChange={(e) => setBrandValues((current) => ({ ...current, tagline: e.target.value }))}
        />
```

- [ ] **Step 8: Propagar `subtitle` em `AdminPage.tsx`**

Em `apps/web/src/modules/admin/AdminPage.tsx:79-83`, trocar:

```tsx
                brand={{
                  name: settings.brand.name ?? '',
                  tagline: settings.brand.tagline ?? '',
                  logoUrl: settings.brand.logoUrl ?? '',
                }}
```

por:

```tsx
                brand={{
                  name: settings.brand.name ?? '',
                  subtitle: settings.brand.subtitle ?? '',
                  tagline: settings.brand.tagline ?? '',
                  logoUrl: settings.brand.logoUrl ?? '',
                }}
```

- [ ] **Step 9: Rodar testes e typecheck e confirmar que passam**

Run: `npm run --prefix apps/web test -- IdentitySection && npm run --prefix apps/web typecheck`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/core/config/settingsSchema.ts apps/web/src/modules/admin/types.ts apps/web/src/modules/admin/IdentitySection.tsx apps/web/src/modules/admin/IdentitySection.test.tsx apps/web/src/modules/admin/AdminPage.tsx
git commit -m "feat(admin): brand.subtitle opcional e campo Subtítulo da marca na tela de Identidade"
```

---

## Task 5: Seed — subtítulo do tenant de demonstração

**Files:**
- Modify: `supabase/seed/0001_demo.sql:49-53`

- [ ] **Step 1: Adicionar `subtitle` ao JSON de `brand` do seed**

Em `supabase/seed/0001_demo.sql:49-53`, trocar:

```sql
  jsonb_build_object(
    'name', 'Nexora',
    'tagline', 'Sistema de Gestão Integrado',
    'logoUrl', '/assets/logo-nexora.svg'
  ),
```

por:

```sql
  jsonb_build_object(
    'name', 'Nexora',
    'subtitle', 'Gestão de Suprimentos',
    'tagline', 'Sistema de Gestão Integrado',
    'logoUrl', '/assets/logo-nexora.svg'
  ),
```

- [ ] **Step 2: Commit**

```bash
git add supabase/seed/0001_demo.sql
git commit -m "chore(seed): subtítulo da marca do tenant de demonstração"
```

Este seed só entra em vigor quando alguém rodar o script de seed contra o projeto de desenvolvimento (fora do escopo desta tarefa aplicar — ver "Como testar" na Task 8). Não é uma migration, pode ser reaplicado.

---

## Task 6: `LoginPanel` — logo maior, subtítulo e skyline oculto em telas estreitas

**Files:**
- Modify: `apps/web/src/app/LoginPage.tsx:29-37`
- Modify: `apps/web/src/app/LoginPage.test.tsx:12-16` e novo teste

- [ ] **Step 1: Atualizar o fixture de `brand` do teste e adicionar os casos novos**

Em `apps/web/src/app/LoginPage.test.tsx:12-16`, trocar:

```tsx
const brand = {
  name: 'Nexora',
  tagline: 'Sistema de Gestão Integrado',
  logoUrl: '/assets/logo-nexora.svg',
}
```

por:

```tsx
const brand = {
  name: 'Nexora',
  subtitle: 'Gestão de Suprimentos',
  tagline: 'Sistema de Gestão Integrado',
  logoUrl: '/assets/logo-nexora.svg',
}
```

Em seguida, dentro do `describe('LoginPage', ...)`, logo depois do teste `'mostra a tagline da marca e as boas-vindas'`, adicionar dois testes novos:

```tsx
  it('mostra o subtítulo da marca quando configurado', () => {
    render(<LoginPage brand={brand} onLoginSuccess={vi.fn()} />)
    expect(screen.getByText('Gestão de Suprimentos')).toBeInTheDocument()
  })

  it('não mostra subtítulo quando a marca não tem um configurado', () => {
    const brandSemSubtitulo = { ...brand, subtitle: undefined }
    render(<LoginPage brand={brandSemSubtitulo} onLoginSuccess={vi.fn()} />)
    expect(screen.queryByText('Gestão de Suprimentos')).not.toBeInTheDocument()
  })
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm run --prefix apps/web test -- LoginPage`
Expected: FAIL no primeiro teste novo — `LoginPanel` ainda não renderiza `brand.subtitle`.

- [ ] **Step 3: Atualizar `LoginPanel` em `LoginPage.tsx`**

Em `apps/web/src/app/LoginPage.tsx:29-37`, trocar:

```tsx
function LoginPanel({ brand }: { brand: Brand }) {
  return (
    <div className="flex flex-col items-center justify-between bg-gradient-to-t from-primary-dark to-primary px-8 py-10 text-on-primary sm:w-1/2">
      <img src={brand.logoUrl} alt={brand.name ?? ''} className="h-8" />
      <p className="max-w-xs text-center text-lg font-medium">{brand.tagline}</p>
      <img src="/assets/skyline.svg" alt="" className="w-full max-w-md" aria-hidden="true" />
    </div>
  )
}
```

por:

```tsx
function LoginPanel({ brand }: { brand: Brand }) {
  return (
    <div className="flex flex-col items-center justify-between bg-gradient-to-t from-primary-dark to-primary px-8 py-10 text-on-primary sm:w-1/2">
      <div className="flex flex-col items-center gap-1">
        <img src={brand.logoUrl} alt={brand.name ?? ''} className="h-14" />
        {brand.subtitle && <p className="text-sm text-on-primary">{brand.subtitle}</p>}
      </div>
      <p className="max-w-xs text-center text-lg font-medium">{brand.tagline}</p>
      <img
        src="/assets/skyline.svg"
        alt=""
        className="hidden w-full max-w-md sm:block"
        aria-hidden="true"
      />
    </div>
  )
}
```

Nota: `className="hidden ... sm:block"` esconde a ilustração do skyline abaixo do breakpoint `sm` (640px) do Tailwind — mesmo ponto em que o container raiz (`sm:flex-row`) já faz o painel virar faixa superior compacta. Decisão tomada na spec (seção 5).

- [ ] **Step 4: Rodar os testes de novo e confirmar que passam**

Run: `npm run --prefix apps/web test -- LoginPage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/LoginPage.tsx apps/web/src/app/LoginPage.test.tsx
git commit -m "feat(login): logo maior, subtítulo de duas linhas e skyline oculto em telas estreitas"
```

---

## Task 7: Redesenho de `skyline.svg`

**Files:**
- Modify: `apps/web/public/assets/skyline.svg`

Sem teste automatizado — é um asset estático (`<img>` no `LoginPanel`, `aria-hidden="true"`). Verificação visual na Task 8.

- [ ] **Step 1: Substituir o conteúdo do arquivo**

Substituir todo o conteúdo de `apps/web/public/assets/skyline.svg` por:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 130" fill="none" role="presentation" aria-hidden="true">
  <defs>
    <!-- Padrão de janela repetido — dá a textura densa da referência sem
         precisar de uma dezena de <rect> manuais por prédio. Cor âmbar fixa:
         exceção documentada à regra 4.1 (textura decorativa, não marca) —
         ver docs/superpowers/specs/2026-09-22-fidelidade-login-design.md §4. -->
    <pattern id="skyline-window" width="10" height="14" patternUnits="userSpaceOnUse">
      <rect x="2" y="3" width="4" height="4" fill="#FBBF24" fill-opacity="0.85" />
    </pattern>
  </defs>
  <g fill="#FFFFFF" fill-opacity="0.14">
    <rect x="6" y="75" width="30" height="55" />
    <rect x="40" y="50" width="24" height="80" />
    <rect x="68" y="85" width="28" height="45" />
    <rect x="100" y="30" width="34" height="100" />
    <rect x="138" y="65" width="24" height="65" />
    <rect x="166" y="45" width="30" height="85" />
    <rect x="200" y="80" width="26" height="50" />
    <rect x="230" y="20" width="36" height="110" />
    <rect x="270" y="70" width="24" height="60" />
    <rect x="298" y="40" width="30" height="90" />
    <rect x="332" y="75" width="26" height="55" />
    <rect x="362" y="60" width="28" height="70" />
  </g>
  <g>
    <rect x="9" y="83" width="24" height="42" fill="url(#skyline-window)" />
    <rect x="43" y="58" width="18" height="62" fill="url(#skyline-window)" />
    <rect x="71" y="93" width="22" height="32" fill="url(#skyline-window)" />
    <rect x="103" y="38" width="28" height="82" fill="url(#skyline-window)" />
    <rect x="141" y="73" width="18" height="47" fill="url(#skyline-window)" />
    <rect x="169" y="53" width="24" height="67" fill="url(#skyline-window)" />
    <rect x="203" y="88" width="20" height="32" fill="url(#skyline-window)" />
    <rect x="233" y="28" width="30" height="92" fill="url(#skyline-window)" />
    <rect x="273" y="78" width="18" height="42" fill="url(#skyline-window)" />
    <rect x="301" y="48" width="24" height="72" fill="url(#skyline-window)" />
    <rect x="335" y="83" width="20" height="37" fill="url(#skyline-window)" />
    <rect x="365" y="68" width="22" height="52" fill="url(#skyline-window)" />
  </g>
</svg>
```

- [ ] **Step 2: Rodar a suíte completa para garantir que nada mais depende do SVG antigo**

Run: `npm run --prefix apps/web test`
Expected: PASS (nenhum teste inspeciona o conteúdo do SVG, só a tag `<img>` que aponta pra ele)

- [ ] **Step 3: Commit**

```bash
git add apps/web/public/assets/skyline.svg
git commit -m "feat(login): skyline mais rico, com textura de janelas acesas (âmbar fixo)"
```

---

## Task 8: Verificação final e instruções de teste manual

**Files:** nenhum (task de verificação)

- [ ] **Step 1: Lint**

Run: `npm run --prefix apps/web lint`
Expected: PASS

- [ ] **Step 2: Typecheck**

Run: `npm run --prefix apps/web typecheck`
Expected: PASS

- [ ] **Step 3: Suíte de testes completa**

Run: `npm run --prefix apps/web test`
Expected: PASS

- [ ] **Step 4: Build**

Run: `npm run --prefix apps/web build`
Expected: PASS

- [ ] **Step 5: Teste manual**

Run: `npm run --prefix apps/web dev`, abrir `http://localhost:5173/login` e verificar:
1. Em ~1280px: logo maior, subtítulo "Gestão de Suprimentos" abaixo do logo, skyline visível com textura de janelas âmbar densa, cantos de input/botão levemente mais retos que antes.
2. Em ~768px: painel esquerdo ainda em faixa lateral ou já compacto conforme o breakpoint `sm` (640px) — skyline ausente abaixo desse ponto, presente acima.
3. Em ~360px: só logo + subtítulo + tagline na faixa superior compacta, sem skyline; formulário legível, sem scroll horizontal.
4. Conferir contraste do texto do subtítulo sobre o degradê (deve estar em `text-on-primary` cheio, sem opacidade reduzida).

Este seed do subtítulo (Task 5) só aparece se o ambiente local estiver de fato apontando para um projeto Supabase com esse seed aplicado; se não for o caso, o teste manual acima ainda é válido porque `LoginPage.test.tsx` (Task 6) já cobre a renderização do subtítulo via prop, independente do banco.

- [ ] **Step 6: Nenhum commit nesta task** — é só verificação. Se algo falhar, corrigir no commit da task correspondente (nova alteração + commit, não amend).

---

## Definição de pronto (checklist final)

- [ ] Responsivo até 360px (skyline oculto abaixo de `sm`, testado manualmente)
- [ ] Cor 100% de config, exceto a exceção documentada da janela âmbar (Task 7)
- [ ] Tokens de raio reutilizáveis, não valores soltos (Tasks 1–3)
- [ ] Lint, typecheck, testes e build passando (Task 8)
- [ ] PR descreve: valores de raio escolhidos, a decisão sobre a cor da janela acesa como exceção à regra 4.1, e como testar manualmente
