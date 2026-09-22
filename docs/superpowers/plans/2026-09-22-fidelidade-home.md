# Fidelidade Visual — Início e Cards de Módulo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aproximar a tela de Início (e o hub de Suprimentos, que compartilha os mesmos componentes) do layout/proporção da referência (sistema Ampla): cards de módulo compactos com fundo sólido nos três estados, e um container centralizado mais estreito — mantendo cor 100% de config.

**Architecture:** Ajustes de classes Tailwind em quatro arquivos existentes — nenhum componente novo, nenhuma mudança de schema/tipo. `ModuleCard`/`ModuleGrid` são compartilhados por `HomePage` e `SuprimentosPage`, então a compactação do card se propaga para as duas telas automaticamente.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS. Reaproveita os tokens de raio (`--radius-sm/md/lg`) já criados na rodada de fidelidade do Login — nenhum token novo.

---

Spec de referência: `docs/superpowers/specs/2026-09-22-fidelidade-home-design.md`

Cada task termina com seu próprio passo de verificação — nenhum commit deve deixar lint/typecheck/test quebrado.

## Task 1: Compactar `ModuleCard` e `ModuleGrid`

**Files:**
- Modify: `apps/web/src/components/ModuleCard/ModuleCard.tsx`
- Modify: `apps/web/src/components/ModuleGrid/ModuleGrid.tsx`

Não é preciso escrever testes novos: os testes existentes de `ModuleCard.test.tsx` checam o *padrão* da classe (`/\bh-\d+\b/` para altura, `toContain('line-clamp')` para truncamento), não o valor exato — continuam válidos sem alteração. Nenhum teste assume `p-4`, `size={28}`, `opacity-50` ou `gap-4` explicitamente (confirmado por leitura prévia do arquivo de teste).

- [ ] **Step 1: Rodar os testes de `ModuleCard` e `ModuleGrid` antes de mexer, para ter uma baseline**

Run: `npm run --prefix apps/web test -- ModuleCard ModuleGrid`
Expected: PASS (todos os testes já passam antes de qualquer mudança — isso confirma que a suíte atual não vai quebrar por acidente e serve de baseline pra comparar depois).

- [ ] **Step 2: Compactar `ModuleCard.tsx`**

Em `apps/web/src/components/ModuleCard/ModuleCard.tsx`, trocar o arquivo inteiro (conteúdo atual, pós rodada de fidelidade do Login):

```tsx
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge, type ModuleStatus } from '../StatusBadge/StatusBadge'

export interface ModuleCardProps {
  label: string
  description: string
  icon: LucideIcon
  status: ModuleStatus
  route?: string
}

const CARD_HEIGHT = 'h-44'

function CardBody({ label, description, icon: Icon, status }: Omit<ModuleCardProps, 'route'>) {
  return (
    <>
      <div className="flex items-start justify-between">
        <Icon size={28} className="text-primary" aria-hidden="true" />
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 font-semibold text-ink">{label}</p>
      <p className="mt-1 line-clamp-3 text-sm text-ink-muted">{description}</p>
    </>
  )
}

export function ModuleCard({ label, description, icon, status, route }: ModuleCardProps) {
  const [showUnavailable, setShowUnavailable] = useState(false)

  const cardClassName = `w-full ${CARD_HEIGHT} flex flex-col rounded-lg border border-line bg-surface p-4 text-left transition duration-DEFAULT hover:-translate-y-0.5 hover:shadow-sm`

  if (status === 'em-breve') {
    return (
      <div
        className={`${CARD_HEIGHT} flex cursor-not-allowed flex-col rounded-lg border border-line bg-surface p-4 opacity-50`}
        aria-disabled="true"
      >
        <CardBody label={label} description={description} icon={icon} status={status} />
      </div>
    )
  }

  if (route) {
    return (
      <Link to={route} className={`block ${cardClassName}`}>
        <CardBody label={label} description={description} icon={icon} status={status} />
      </Link>
    )
  }

  return (
    <div>
      <button type="button" onClick={() => setShowUnavailable(true)} className={cardClassName}>
        <CardBody label={label} description={description} icon={icon} status={status} />
      </button>
      {showUnavailable && (
        <p className="mt-1 text-xs text-ink-muted" role="status">
          Módulo ainda não disponível
        </p>
      )}
    </div>
  )
}
```

por:

```tsx
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge, type ModuleStatus } from '../StatusBadge/StatusBadge'

export interface ModuleCardProps {
  label: string
  description: string
  icon: LucideIcon
  status: ModuleStatus
  route?: string
}

const CARD_HEIGHT = 'h-32'

function CardBody({ label, description, icon: Icon, status }: Omit<ModuleCardProps, 'route'>) {
  return (
    <>
      <div className="flex items-start justify-between">
        <Icon size={20} className="text-primary" aria-hidden="true" />
        <StatusBadge status={status} />
      </div>
      <p className="mt-2 text-sm font-semibold text-ink">{label}</p>
      <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{description}</p>
    </>
  )
}

export function ModuleCard({ label, description, icon, status, route }: ModuleCardProps) {
  const [showUnavailable, setShowUnavailable] = useState(false)

  const cardClassName = `w-full ${CARD_HEIGHT} flex flex-col rounded-lg border border-line bg-surface p-3 text-left transition duration-DEFAULT hover:-translate-y-0.5 hover:shadow-sm`

  if (status === 'em-breve') {
    return (
      <div
        className={`${CARD_HEIGHT} flex cursor-not-allowed flex-col rounded-lg border border-line bg-surface p-3`}
        aria-disabled="true"
      >
        <CardBody label={label} description={description} icon={icon} status={status} />
      </div>
    )
  }

  if (route) {
    return (
      <Link to={route} className={`block ${cardClassName}`}>
        <CardBody label={label} description={description} icon={icon} status={status} />
      </Link>
    )
  }

  return (
    <div>
      <button type="button" onClick={() => setShowUnavailable(true)} className={cardClassName}>
        <CardBody label={label} description={description} icon={icon} status={status} />
      </button>
      {showUnavailable && (
        <p className="mt-1 text-xs text-ink-muted" role="status">
          Módulo ainda não disponível
        </p>
      )}
    </div>
  )
}
```

Resumo das mudanças: `CARD_HEIGHT` `h-44`→`h-32`; ícone `size={28}`→`size={20}`; título ganha `text-sm` explícito; descrição `text-sm`/`line-clamp-3`→`text-xs`/`line-clamp-2`; título `mt-3`→`mt-2`; padding `p-4`→`p-3` nos dois lugares (`cardClassName` e o card em-breve); **remoção de `opacity-50`** do card em-breve (essa é a mudança que resolve a Seção 3 da spec — os três estados passam a ter o mesmo `bg-surface` sólido).

- [ ] **Step 3: Compactar o gap de `ModuleGrid.tsx`**

Em `apps/web/src/components/ModuleGrid/ModuleGrid.tsx`, trocar:

```tsx
import type { ReactNode } from 'react'

export interface ModuleGridProps {
  children: ReactNode
}

export function ModuleGrid({ children }: ModuleGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  )
}
```

por:

```tsx
import type { ReactNode } from 'react'

export interface ModuleGridProps {
  children: ReactNode
}

export function ModuleGrid({ children }: ModuleGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  )
}
```

- [ ] **Step 4: Rodar os testes de novo e confirmar que ainda passam**

Run: `npm run --prefix apps/web test -- ModuleCard ModuleGrid`
Expected: PASS (mesmos testes da Step 1, sem nenhuma alteração de asserção — eles checam o padrão da classe, não os valores exatos, então continuam verdes com os novos valores).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ModuleCard/ModuleCard.tsx apps/web/src/components/ModuleGrid/ModuleGrid.tsx
git commit -m "feat(home): cards de módulo mais compactos, com fundo sólido nos três estados"
```

---

## Task 2: Container centralizado mais estreito em Início e Suprimentos

**Files:**
- Modify: `apps/web/src/modules/home/HomePage.tsx`
- Modify: `apps/web/src/modules/suprimentos/SuprimentosPage.tsx`

Troca mecânica de classe (`max-w-6xl` → `max-w-[960px]`). Sem teste novo — nenhum teste existente de `HomePage.test.tsx` ou `SuprimentosPage.test.tsx` assume esse valor (confirmado por leitura prévia dos arquivos de teste).

- [ ] **Step 1: `HomePage.tsx`**

Em `apps/web/src/modules/home/HomePage.tsx`, trocar:

```tsx
      <div className="mx-auto mt-10 max-w-6xl">
```

por:

```tsx
      <div className="mx-auto mt-10 max-w-[960px]">
```

- [ ] **Step 2: `SuprimentosPage.tsx`**

Em `apps/web/src/modules/suprimentos/SuprimentosPage.tsx`, trocar:

```tsx
      <div className="mx-auto mt-10 max-w-6xl">
```

por:

```tsx
      <div className="mx-auto mt-10 max-w-[960px]">
```

- [ ] **Step 3: Rodar os testes de `HomePage` e `SuprimentosPage`**

Run: `npm run --prefix apps/web test -- HomePage SuprimentosPage`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/modules/home/HomePage.tsx apps/web/src/modules/suprimentos/SuprimentosPage.tsx
git commit -m "feat(home): container da grade de módulos mais estreito (960px), alinhado com Suprimentos"
```

---

## Task 3: Verificação final e instruções de teste manual

**Files:** nenhum (task de verificação)

- [ ] **Step 1: Lint**

Run: `npm run --prefix apps/web lint`
Expected: PASS

- [ ] **Step 2: Typecheck**

Run: `npm run --prefix apps/web typecheck`
Expected: PASS

- [ ] **Step 3: Suíte de testes completa**

Run: `npm run --prefix apps/web test -- --run`
Expected: PASS (mesma contagem da baseline antes desta branch — nenhum teste novo foi adicionado neste plano, só valores de classe mudaram)

- [ ] **Step 4: Build**

Run: `npm run --prefix apps/web build`
Expected: PASS

- [ ] **Step 5: Teste manual**

Run: `npm run --prefix apps/web dev`, abrir `http://localhost:5173/` e `http://localhost:5173/suprimentos` e verificar:
1. Em ~1440px: grade centralizada numa faixa bem mais estreita que a tela cheia (bastante espaço vazio nas laterais), cards pequenos e compactos.
2. Os três estados de card (disponível, beta, em-breve) lado a lado: mesmo fundo branco sólido, badge é a única diferença visual — nenhum card "apagado"/translúcido.
3. Título e descrição legíveis, sem quebra estranha, dentro do card menor.
4. Em ~1024px e ~768px: grade cai para 2 colunas. Em ~360px: 1 coluna, sem scroll horizontal.
5. Botão "Sair da conta" continua funcionando nas duas telas.

- [ ] **Step 6: Nenhum commit nesta task** — é só verificação. Se algo falhar, corrigir no commit da task correspondente (nova alteração + commit, não amend).

---

## Definição de pronto (checklist final)

- [ ] Responsivo (grade cai para 2/1 coluna, testado manualmente em ambas as telas)
- [ ] Raio e espaçamento reaproveitando os tokens/escala já existentes (nenhum token novo)
- [ ] Cor 100% de config — nenhuma cor nova introduzida
- [ ] Lint, typecheck, testes e build passando (Task 3)
- [ ] PR descreve: o `max-width` escolhido (960px) e por quê, os tamanhos escolhidos para o card compacto, e a decisão sobre o botão "Sair da conta" (mantido, sem duplicação)
