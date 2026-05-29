import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateStore } from '../api/mutations'
import { catalogKeys } from '../api/keys'
import type { UpdateStoreInput } from '../schemas'

export function useUpdateStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, input }: { storeId: string; input: UpdateStoreInput }) =>
      updateStore(storeId, input),
    onSuccess: (store) => {
      qc.invalidateQueries({ queryKey: catalogKeys.myStores() })
      qc.invalidateQueries({ queryKey: catalogKeys.storeBySlug(store.slug) })
    },
  })
}
