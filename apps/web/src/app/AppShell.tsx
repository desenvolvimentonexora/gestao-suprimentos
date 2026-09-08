import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Search } from 'lucide-react'

export interface AppShellProps {
  tenantName: string
  userName: string
  onSignOut: () => void
  children: ReactNode
}

function isTypingTarget(element: Element | null): boolean {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    (element instanceof HTMLElement && element.isContentEditable)
  )
}

export function AppShell({ tenantName, userName, onSignOut, children }: AppShellProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || isTypingTarget(document.activeElement)) return
      event.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-surface px-4 py-2">
        <span className="shrink-0 text-sm font-semibold text-ink">{tenantName}</span>

        <div className="relative w-full max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
          <input
            ref={searchRef}
            type="search"
            placeholder="Buscar…"
            aria-label="Buscar"
            className="w-full rounded border border-line bg-bg py-1.5 pl-9 pr-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-1 text-sm text-ink hover:text-primary"
          >
            {userName}
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-10 mt-2 min-w-[140px] rounded border border-line bg-surface py-1 shadow-sm"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onSignOut()
                }}
                className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-bg"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
