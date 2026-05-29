import { createBrowserClient } from '@/lib/supabase'
import type { TablesUpdate } from '@/types/database'
import type { CouponDiscountType, StoreCoupon } from '@/types/domain'

export type UpsertCouponInput = {
  code: string
  description?: string | null
  discount_type: CouponDiscountType
  discount_value: number
  min_subtotal_in_cents?: number
  max_uses?: number | null
  is_active?: boolean
  expires_at?: string | null
  category_id?: string | null
  custom_url?: string | null
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

export async function createCoupon(
  storeId: string,
  input: UpsertCouponInput,
): Promise<StoreCoupon> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('store_coupons')
    .insert({
      store_id: storeId,
      code: normalizeCode(input.code),
      description: input.description?.trim() || null,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      min_subtotal_in_cents: input.min_subtotal_in_cents ?? 0,
      max_uses: input.max_uses ?? null,
      is_active: input.is_active ?? true,
      expires_at: input.expires_at ?? null,
      category_id: input.category_id ?? null,
      custom_url: input.custom_url?.trim().toLowerCase() || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as StoreCoupon
}

export async function updateCoupon(
  id: string,
  input: Partial<UpsertCouponInput>,
): Promise<StoreCoupon> {
  const supabase = createBrowserClient()
  const payload: TablesUpdate<'store_coupons'> = {}
  if (input.code !== undefined) payload.code = normalizeCode(input.code)
  if (input.description !== undefined)
    payload.description = input.description?.trim() || null
  if (input.discount_type !== undefined) payload.discount_type = input.discount_type
  if (input.discount_value !== undefined) payload.discount_value = input.discount_value
  if (input.min_subtotal_in_cents !== undefined)
    payload.min_subtotal_in_cents = input.min_subtotal_in_cents
  if (input.max_uses !== undefined) payload.max_uses = input.max_uses
  if (input.is_active !== undefined) payload.is_active = input.is_active
  if (input.expires_at !== undefined) payload.expires_at = input.expires_at
  if (input.category_id !== undefined) payload.category_id = input.category_id
  if (input.custom_url !== undefined)
    payload.custom_url = input.custom_url ? input.custom_url.trim().toLowerCase() : null

  const { data, error } = await supabase
    .from('store_coupons')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as StoreCoupon
}

export async function deleteCoupon(id: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase.from('store_coupons').delete().eq('id', id)
  if (error) throw error
}

/** Bumps `used_count` atomically via RPC. Safe to call from anon. */
export async function recordCouponUsage(couponId: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase.rpc('record_coupon_usage', {
    target_coupon: couponId,
  })
  if (error) throw error
}
