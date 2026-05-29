import { useMutation } from '@tanstack/react-query'
import { track } from '@/features/analytics'
import { signIn } from '../api/mutations'

export function useSignIn() {
  return useMutation({
    mutationFn: signIn,
    onSuccess: () => track('login', { method: 'email' }),
  })
}
