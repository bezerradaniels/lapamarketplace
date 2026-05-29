import { useMutation } from '@tanstack/react-query'
import { signIn } from '../api/mutations'

export function useSignIn() {
  return useMutation({ mutationFn: signIn })
}
