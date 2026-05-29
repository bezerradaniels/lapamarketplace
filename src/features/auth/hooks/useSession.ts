import { useContext } from 'react'
import { AuthContext } from '@/providers/AuthContext'

export function useSession() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useSession deve estar dentro de <AuthProvider>')
  return ctx
}
