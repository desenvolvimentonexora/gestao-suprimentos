import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CircleUserRound } from 'lucide-react'

export interface UserMenuProps {
  userName: string
  onSignOut: () => void
  triggerClassName?: string
  children?: (closeMenu: () => void) => ReactNode
}

const DEFAULT_TRIGGER_CLASSNAME =
  'flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-on-primary hover:bg-white/20'

export function UserMenu({
  userName,
  onSignOut,
  triggerClassName = DEFAULT_TRIGGER_CLASSNAME,
  children,
}: UserMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

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
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={`Menu de ${userName}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className={triggerClassName}
      >
        <CircleUserRound size={20} aria-hidden="true" />
      </button>
      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-2 min-w-[160px] rounded border border-line bg-surface py-1 shadow-sm"
        >
          <div className="border-b border-line px-3 py-2 text-sm font-medium text-ink">{userName}</div>
          {children?.(() => setMenuOpen(false))}
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
  )
}
