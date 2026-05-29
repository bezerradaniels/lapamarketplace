import { useMutation } from '@tanstack/react-query'
import { verifyOtp } from '../api/mutations'

export function useVerifyOtp() {
  return useMutation({ mutationFn: verifyOtp })
}
