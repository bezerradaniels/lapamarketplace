import type { Session, User } from '@supabase/supabase-js'
import { createBrowserClient } from '@/lib/supabase'

export async function getSession(): Promise<Session | null> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
}
