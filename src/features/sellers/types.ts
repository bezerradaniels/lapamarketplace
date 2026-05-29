export type SellerCatalogProducts = 'all' | 'specific'

export type SellerCatalog = {
  id: string
  store_id: string
  name: string
  catalog_slug: string
  avatar_url: string | null
  whatsapp_phone: string | null // E.164
  use_store_whatsapp: boolean
  contact_email: string | null
  catalog_products: SellerCatalogProducts
  specific_product_ids: string[]
  has_dashboard_access: boolean
  linked_user_id: string | null
  created_at: string
  updated_at: string
}
