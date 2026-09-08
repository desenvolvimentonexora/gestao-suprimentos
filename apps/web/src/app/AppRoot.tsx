import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { Spinner } from '../components'
import { fetchCurrentUserProfile, getSession, onAuthStateChange, signOut } from '../core/auth'
import { loadSettings } from '../core/config'
import { applyTheme } from '../core/theme'
import { getTenant } from '../core/tenant'
import { HomePage } from '../modules/home/HomePage'
import { moduleRegistry } from '../modules/registry'
import { AppShell } from './AppShell'
import { LoginPage } from './LoginPage'
import { ModulePlaceholderPage } from './ModulePlaceholderPage'

function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    getSession().then(setSession)
    return onAuthStateChange(setSession)
  }, [])

  return session
}

function LoginRoute({ tenantName }: { tenantName: string }) {
  const navigate = useNavigate()
  return (
    <LoginPage tenantName={tenantName} onLoginSuccess={() => navigate('/', { replace: true })} />
  )
}

function ProtectedLayout({ tenantName, userName }: { tenantName: string; userName: string }) {
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

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

  if (tenantQuery.isPending || (tenant && settingsQuery.isPending) || session === undefined) {
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

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            session ? <Navigate to="/" replace /> : <LoginRoute tenantName={tenant.name} />
          }
        />
        <Route
          element={
            session ? (
              <ProtectedLayout tenantName={tenant.name} userName={userName} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route
            path="/"
            element={
              <HomePage
                fullName={userName}
                modules={moduleRegistry}
                licensedModules={tenant.modules}
                grantedPermissions={[]}
              />
            }
          />
          {moduleRegistry.map((module) => (
            <Route
              key={module.id}
              path={module.route}
              element={<ModulePlaceholderPage label={module.label} />}
            />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
