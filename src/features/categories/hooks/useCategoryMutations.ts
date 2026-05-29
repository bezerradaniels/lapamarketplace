import { useMutation, useQueryClient } from '@tanstack/react-query'
import { track } from '@/features/analytics'
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api/mutations'
import { categoriesKeys } from '../api/keys'

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: (cat) => {
      track('category_created', {
        store_id: cat.store_id,
        category_id: cat.id,
        category_name: cat.name,
      })
      qc.invalidateQueries({ queryKey: categoriesKeys.list(cat.store_id) })
    },
  })
}

export function useUpdateCategory(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateCategory,
    onSuccess: (cat) => {
      track('category_updated', { store_id: storeId, category_id: cat.id })
      qc.invalidateQueries({ queryKey: categoriesKeys.list(storeId) })
    },
  })
}

export function useDeleteCategory(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: (_data, id) => {
      track('category_deleted', { store_id: storeId, category_id: id })
      qc.invalidateQueries({ queryKey: categoriesKeys.list(storeId) })
    },
  })
}
