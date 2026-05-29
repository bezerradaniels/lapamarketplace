import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listMembers } from '../api/queries'
import { addSellerByEmail, removeSeller } from '../api/mutations'
import { sellersKeys } from '../api/keys'

export function useMembers(storeId: string | undefined) {
  return useQuery({
    queryKey: sellersKeys.list(storeId ?? ''),
    queryFn: () => listMembers(storeId as string),
    enabled: !!storeId,
  })
}

export function useAddSeller(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (email: string) => addSellerByEmail(storeId, email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sellersKeys.list(storeId) })
    },
  })
}

export function useRemoveSeller(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => removeSeller(storeId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sellersKeys.list(storeId) })
    },
  })
}
