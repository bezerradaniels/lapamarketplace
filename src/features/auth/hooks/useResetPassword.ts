import { useMutation } from '@tanstack/react-query'
import { requestPasswordReset } from '../api/mutations'

export function useResetPassword() {
  return useMutation({ mutationFn: requestPasswordReset })
}
