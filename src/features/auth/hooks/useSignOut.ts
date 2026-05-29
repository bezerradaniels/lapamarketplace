import { useMutation, useQueryClient } from '@tanstack/react-query'
import { track } from '@/features/analytics'
import { signOut } from '../api/mutations'

export function useSignOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      track('logout')
      qc.clear()
    },
  })
}
