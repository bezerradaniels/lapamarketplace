import { createBrowserClient } from '@/lib/supabase'
import type { SellerCatalog, SellerCatalogProducts } from '../types'

export type SellerCatalogInput = {
  name: string
  catalog_slug: string
  avatar_url?: string | null
  whatsapp_phone?: string | null
  use_store_whatsapp: boolean
  contact_email?: string | null
  catalog_products: SellerCatalogProducts
  specific_product_ids?: string[]
  has_dashboard_access: boolean
}

export async function createSellerCatalog(
  storeId: string,
  input: SellerCatalogInput,
): Promise<SellerCatalog> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('seller_catalogs')
    .insert({ store_id: storeId, ...input })
    .select()
    .single()

  if (error) throw error
  return data as SellerCatalog
}

export async function updateSellerCatalog(
  id: string,
  input: Partial<SellerCatalogInput>,
): Promise<SellerCatalog> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('seller_catalogs')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as SellerCatalog
}

export async function deleteSellerCatalog(id: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase.from('seller_catalogs').delete().eq('id', id)
  if (error) throw error
}
