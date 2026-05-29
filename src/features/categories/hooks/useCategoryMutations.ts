import { useMutation, useQueryClient } from '@tanstack/react-query'
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
      qc.invalidateQueries({ queryKey: categoriesKeys.list(cat.store_id) })
    },
  })
}

export function useUpdateCategory(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoriesKeys.list(storeId) })
    },
  })
}

export function useDeleteCategory(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoriesKeys.list(storeId) })
    },
  })
}
