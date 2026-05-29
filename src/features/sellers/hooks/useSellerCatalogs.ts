import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'
import { sellerCatalogKeys } from '../api/sellerCatalogKeys'
import {
  createSellerCatalog,
  updateSellerCatalog,
  deleteSellerCatalog,
  type SellerCatalogInput,
} from '../api/sellerCatalogMutations'
import type { SellerCatalog } from '../types'

export function useSellerCatalogs(storeId: string | undefined) {
  return useQuery({
    queryKey: sellerCatalogKeys.list(storeId ?? ''),
    queryFn: async () => {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('seller_catalogs')
        .select('*')
        .eq('store_id', storeId as string)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as SellerCatalog[]
    },
    enabled: !!storeId,
  })
}

export function useCreateSellerCatalog(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SellerCatalogInput) => createSellerCatalog(storeId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: sellerCatalogKeys.list(storeId) }),
  })
}

export function useUpdateSellerCatalog(id: string, storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<SellerCatalogInput>) => updateSellerCatalog(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sellerCatalogKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: sellerCatalogKeys.detail(id) })
    },
  })
}

export function useDeleteSellerCatalog(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSellerCatalog(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: sellerCatalogKeys.list(storeId) }),
  })
}
