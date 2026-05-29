import { useMutation } from '@tanstack/react-query'
import { track } from '@/features/analytics'
import { signUp } from '../api/mutations'

export function useSignUp() {
  return useMutation({
    mutationFn: signUp,
    onSuccess: () => track('sign_up', { method: 'email' }),
  })
}
