import { createBrowserClient } from '@/lib/supabase'
import { sanitizeRichText } from '@/lib/sanitize/sanitizeHtml'
import type { Product } from '@/types/domain'
import type { ProductInput } from '../schemas'

function toDbPayload(input: ProductInput) {
  return {
    name: input.name.trim(),
    // Defense in depth: store sanitized HTML. The authoritative XSS control is
    // render-side sanitization (a member can write raw HTML directly via the API),
    // but keeping stored content clean reduces blast radius.
    description: input.description ? sanitizeRichText(input.description) : null,
    price_in_cents: input.price_in_cents,
    is_active: input.is_active,
    is_featured: input.is_featured ?? false,
    stock: input.has_variations ? null : (input.stock ?? null),
    images: input.images ?? [],
    category: input.category?.trim().toLowerCase() || null,
    subcategory: input.subcategory?.trim().toLowerCase() || null,
    promo_price_in_cents: input.promo_price_in_cents ?? null,
    installment_count: input.installment_count ?? null,
    installment_total_in_cents: input.installment_total_in_cents ?? null,
    brand: input.has_no_brand ? null : (input.brand?.trim() || null),
    unit: input.unit?.trim() || null,
    barcode: input.barcode?.trim() || null,
    barcode_type: input.barcode_type || null,
    sku: input.auto_sku ? null : (input.sku?.trim() || null),
    auto_sku: input.auto_sku,
    condition: input.condition,
    purchase_recurrence: input.purchase_recurrence || null,
    has_no_brand: input.has_no_brand,
    cost_in_cents: input.cost_in_cents ?? null,
    has_variations: input.has_variations,
    variation_type: input.has_variations ? (input.variation_type ?? null) : null,
    variation_label: input.has_variations ? (input.variation_label ?? null) : null,
    variation_options: input.has_variations ? (input.variation_options ?? null) : null,
  }
}

export async function createProduct(
  storeId: string,
  input: ProductInput,
): Promise<Product> {
  const supabase = createBrowserClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = { store_id: storeId, ...toDbPayload(input) }
  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data as Product
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<Product> {
  const supabase = createBrowserClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = toDbPayload(input)
  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Product
}

/** Soft-delete: set deleted_at. */
export async function deleteProduct(id: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/** Deactivate a list of products (set is_active = false). Used in downgrade flow. */
export async function deactivateProducts(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const supabase = createBrowserClient()
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .in('id', ids)
  if (error) throw error
}
