import { useMutation } from '@tanstack/react-query'
import { signUp } from '../api/mutations'

export function useSignUp() {
  return useMutation({ mutationFn: signUp })
}
