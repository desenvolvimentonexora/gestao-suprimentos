import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CircleUserRound, Paperclip, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { TaskBoardContainer } from '../modules/tasks/TaskBoardContainer'

export interface AppShellProps {
  userName: string
  tenantId: string
  userId: string
  isAdmin?: boolean
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

export function AppShell({
  userName,
  tenantId,
  userId,
  isAdmin = false,
  onSignOut,
  children,
}: AppShellProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [taskBoardOpen, setTaskBoardOpen] = useState(false)
  const location = useLocation()
  const showSuprimentosBack = location.pathname.startsWith('/suprimentos/')

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
      <header className="flex items-center justify-between gap-4 bg-primary-dark px-4 py-2">
        <img
          src="/assets/logo-nexora.png"
          alt="Nexora"
          className="h-10 w-auto shrink-0 object-contain brightness-0 invert"
        />

        <div className="relative w-full max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-primary/70"
            aria-hidden="true"
          />
          <input
            ref={searchRef}
            type="search"
            placeholder="Buscar…"
            aria-label="Buscar"
            className="w-full rounded border border-white/20 bg-white/10 py-1.5 pl-9 pr-3 text-sm text-on-primary placeholder:text-on-primary/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Abrir suporte"
            onClick={() => setTaskBoardOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-on-primary hover:bg-white/20"
          >
            <Paperclip size={16} aria-hidden="true" />
            Suporte
          </button>

          {showSuprimentosBack && (
            <Link
              to="/suprimentos"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-on-primary hover:bg-white/20"
            >
              ← Suprimentos
            </Link>
          )}
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={`Menu de ${userName}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-on-primary hover:bg-white/20"
          >
            <CircleUserRound size={20} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-10 mt-2 min-w-[160px] rounded border border-line bg-surface py-1 shadow-sm"
            >
              <div className="border-b border-line px-3 py-2 text-sm font-medium text-ink">{userName}</div>
              {isAdmin && (
                <Link
                  to="/admin"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-bg"
                >
                  Administração
                </Link>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  setTaskBoardOpen(true)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-bg"
              >
                <Paperclip size={14} aria-hidden="true" />
                Suporte
              </button>
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

      <TaskBoardContainer
        isOpen={taskBoardOpen}
        onClose={() => setTaskBoardOpen(false)}
        tenantId={tenantId}
        userId={userId}
      />
    </div>
  )
}
