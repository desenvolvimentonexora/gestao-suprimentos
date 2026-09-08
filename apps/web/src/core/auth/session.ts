import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { mapAuthErrorMessage } from './mapAuthErrorMessage'

export interface SignInResult {
  session: Session | null
  errorMessage: string | null
}

export async function signInWithPassword(email: string, password: string): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { session: data.session, errorMessage: mapAuthErrorMessage(error) }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => subscription.unsubscribe()
}
