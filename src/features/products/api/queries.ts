import { createBrowserClient } from '@/lib/supabase'
import type { Product } from '@/types/domain'

/**
 * Lists all products of a store for the dashboard (includes inactive).
 * Relies on RLS `products_member_read`.
 */
export async function listProductsForStore(storeId: string): Promise<Product[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Product[]
}

/**
 * Public catalog listing: only active products of live stores.
 * RLS `products_public_read` enforces the rest.
 */
export async function listPublicProducts(storeId: string): Promise<Product[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Product[]
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return (data as Product | null) ?? null
}
