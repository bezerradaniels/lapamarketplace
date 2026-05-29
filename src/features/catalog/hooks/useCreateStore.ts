import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createStore } from '../api/mutations'
import { catalogKeys } from '../api/keys'

export function useCreateStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createStore,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogKeys.myStores() })
    },
  })
}
