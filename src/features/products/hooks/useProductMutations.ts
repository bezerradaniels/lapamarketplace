import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct, deleteProduct, updateProduct } from '../api/mutations'
import { productsKeys } from '../api/keys'
import type { ProductInput } from '../schemas'

export function useCreateProduct(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductInput) => createProduct(storeId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productsKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: productsKeys.publicList(storeId) })
    },
  })
}

export function useUpdateProduct(storeId: string, id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductInput) => updateProduct(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productsKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: productsKeys.publicList(storeId) })
      qc.invalidateQueries({ queryKey: productsKeys.byId(id) })
    },
  })
}

export function useDeleteProduct(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productsKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: productsKeys.publicList(storeId) })
    },
  })
}
