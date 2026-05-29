import { createBrowserClient } from '@/lib/supabase'
import type { SignInInput, SignUpInput } from '../schemas'

export async function signIn({ email, password }: SignInInput) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUp({ email, password, name }: SignUpInput) {
  const supabase = createBrowserClient()

  const isTestEmail = email.includes('+teste') || email.includes('+test')

  // Uses standard Supabase signUp — email confirmation must be disabled in the
  // Supabase Auth project settings (Auth > Providers > Email > "Confirm email").
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, is_test: isTestEmail },
    },
  })

  if (signUpError) throw signUpError
  if (!signUpData.user) throw new Error('Não foi possível criar a conta.')

  if (!isTestEmail) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (signUpData.session?.access_token) {
        headers.Authorization = `Bearer ${signUpData.session.access_token}`
      }

      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signup-notification`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, name }),
      })
    } catch {
      // Don't block signup if notification fails
    }
  }

  return signUpData
}

export async function verifyOtp({ email, token, type = 'email' }: { email: string; token: string; type?: 'signup' | 'email' }) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type })
  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function requestPasswordReset(email: string) {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/entrar`,
  })
  if (error) throw error
}
