import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signOut } from '../api/mutations'

export function useSignOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => qc.clear(),
  })
}
