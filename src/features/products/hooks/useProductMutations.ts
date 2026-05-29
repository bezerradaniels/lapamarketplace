import { useMutation, useQueryClient } from '@tanstack/react-query'
import { track } from '@/features/analytics'
import { createProduct, deleteProduct, updateProduct } from '../api/mutations'
import { productsKeys } from '../api/keys'
import type { ProductInput } from '../schemas'

export function useCreateProduct(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductInput) => createProduct(storeId, input),
    onSuccess: (product) => {
      track('product_created', {
        store_id: storeId,
        product_id: product.id,
        product_name: product.name,
        has_image: (product.images?.length ?? 0) > 0,
        has_variations: product.has_variations ?? false,
      })
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
      track('product_updated', { store_id: storeId, product_id: id })
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
    onSuccess: (_data, id) => {
      track('product_deleted', { store_id: storeId, product_id: id })
      qc.invalidateQueries({ queryKey: productsKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: productsKeys.publicList(storeId) })
    },
  })
}
