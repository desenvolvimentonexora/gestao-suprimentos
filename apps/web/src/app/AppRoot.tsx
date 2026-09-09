import { useEffect, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { Spinner } from '../components'
import { fetchCurrentUserProfile, getSession, onAuthStateChange, signOut } from '../core/auth'
import { loadSettings, type Brand } from '../core/config'
import { applyTheme } from '../core/theme'
import { getTenant } from '../core/tenant'
import { HomePage } from '../modules/home/HomePage'
import { SuprimentosPage } from '../modules/suprimentos/SuprimentosPage'
import { AgendaFornecedoresPage } from '../modules/suppliers/AgendaFornecedoresPage'
import { AppShell } from './AppShell'
import { LoginPage } from './LoginPage'

function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    getSession().then(setSession)
    return onAuthStateChange(setSession)
  }, [])

  return session
}

function useSignOutHandler() {
  const navigate = useNavigate()
  return async () => {
    await signOut()
    navigate('/login', { replace: true })
  }
}

function RequireSession({ session, children }: { session: Session | null; children: ReactNode }) {
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function LoginRoute({ brand }: { brand: Brand }) {
  const navigate = useNavigate()
  return <LoginPage brand={brand} onLoginSuccess={() => navigate('/', { replace: true })} />
}

function HomeRoute({ fullName }: { fullName: string }) {
  const handleSignOut = useSignOutHandler()
  return <HomePage fullName={fullName} onSignOut={handleSignOut} />
}

function SuprimentosRoute({ fullName }: { fullName: string }) {
  const handleSignOut = useSignOutHandler()
  return <SuprimentosPage fullName={fullName} onSignOut={handleSignOut} />
}

function AgendaFornecedoresRoute({ tenantId, userId }: { tenantId: string; userId: string }) {
  return <AgendaFornecedoresPage tenantId={tenantId} userId={userId} />
}

function ProtectedLayout({ tenantName, userName }: { tenantName: string; userName: string }) {
  const handleSignOut = useSignOutHandler()

  return (
    <AppShell tenantName={tenantName} userName={userName} onSignOut={handleSignOut}>
      <Outlet />
    </AppShell>
  )
}

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
    </div>
  )
}

export function AppRoot() {
  const tenantQuery = useQuery({ queryKey: ['tenant'], queryFn: getTenant })
  const tenant = tenantQuery.data

  const settingsQuery = useQuery({
    queryKey: ['settings', tenant?.tenantId],
    queryFn: () => loadSettings(tenant!.tenantId),
    enabled: Boolean(tenant),
  })

  useEffect(() => {
    if (settingsQuery.data) applyTheme(settingsQuery.data.theme)
  }, [settingsQuery.data])

  const session = useSession()

  const profileQuery = useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: () => fetchCurrentUserProfile(session!.user.id),
    enabled: Boolean(session),
  })

  if (
    tenantQuery.isPending ||
    (tenant && settingsQuery.isPending) ||
    session === undefined
  ) {
    return <FullScreenSpinner />
  }

  if (tenantQuery.isError || !tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-ink-muted">
        Não foi possível identificar o cliente para este endereço. Verifique a URL ou entre em
        contato com o suporte.
      </div>
    )
  }

  const userName = profileQuery.data?.fullName ?? ''
  const brand = settingsQuery.data?.brand ?? {}

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={session ? <Navigate to="/" replace /> : <LoginRoute brand={brand} />}
        />
        <Route
          path="/"
          element={
            <RequireSession session={session ?? null}>
              <HomeRoute fullName={userName} />
            </RequireSession>
          }
        />
        <Route
          path="/suprimentos"
          element={
            <RequireSession session={session ?? null}>
              <SuprimentosRoute fullName={userName} />
            </RequireSession>
          }
        />
        <Route
          element={
            <RequireSession session={session ?? null}>
              <ProtectedLayout tenantName={tenant.name} userName={userName} />
            </RequireSession>
          }
        >
          <Route
            path="/suprimentos/agenda-fornecedores"
            element={
              <AgendaFornecedoresRoute tenantId={tenant.tenantId} userId={session?.user.id ?? ''} />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
