import { createBrowserClient } from '@/lib/supabase'
import type { StoreCoupon, ValidatedCoupon, Product } from '@/types/domain'

/**
 * Public RPC — works for anon (storefront). Throws an Error whose `message`
 * is the i18n-friendly code from `validate_coupon` (e.g. `coupon_not_found`).
 */
export async function validateCouponCode(args: {
  storeId: string
  code: string
  subtotalInCents: number
  cartItems?: Array<{ product: Product; quantity: number }>
}): Promise<ValidatedCoupon> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.rpc('validate_coupon', {
    target_store: args.storeId,
    coupon_code: args.code,
    subtotal_in_cents: args.subtotalInCents,
  })

  if (error) {
    // Postgres `RAISE EXCEPTION USING message=...` lands in `error.message`.
    throw new CouponValidationError(error.message)
  }
  const row = (data ?? [])[0]
  if (!row) throw new CouponValidationError('coupon_not_found')

  const validated = row as ValidatedCoupon

  // Check category eligibility if coupon is restricted to a category
  if (validated.category_id && args.cartItems && args.cartItems.length > 0) {
    const categoryEligible = await checkCategoryEligibility(
      args.storeId,
      validated.category_id,
      args.cartItems,
    )
    if (!categoryEligible) {
      throw new CouponValidationError('coupon_category_not_eligible')
    }
  }

  return validated
}

/**
 * Check if any cart item belongs to the specified category or its subcategories.
 */
async function checkCategoryEligibility(
  storeId: string,
  categoryId: string,
  cartItems: Array<{ product: Product; quantity: number }>,
): Promise<boolean> {
  const supabase = createBrowserClient()

  // Fetch the category and its subcategories
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id, name, parent_id')
    .eq('id', categoryId)
    .single()

  if (categoryError) return false

  // Get all subcategories (including nested)
  const { data: allCategories, error: allCategoriesError } = await supabase
    .from('categories')
    .select('id, name, parent_id')
    .eq('store_id', storeId)

  if (allCategoriesError) return false

  // Build a set of category names that are eligible (this category + all subcategories)
  const eligibleCategoryNames = new Set<string>()
  eligibleCategoryNames.add(category.name)

  // Find all subcategories recursively
  const addSubcategories = (parentId: string) => {
    allCategories
      ?.filter((c) => c.parent_id === parentId)
      .forEach((sub) => {
        eligibleCategoryNames.add(sub.name)
        addSubcategories(sub.id)
      })
  }
  addSubcategories(category.id)

  // Check if any cart item belongs to an eligible category
  return cartItems.some((item) => {
    const productCategory = item.product.category
    return productCategory !== null && eligibleCategoryNames.has(productCategory)
  })
}

export class CouponValidationError extends Error {
  code: string
  constructor(code: string) {
    super(code)
    this.code = code
    this.name = 'CouponValidationError'
  }
}

/** Dashboard: list coupons of a store (members only). */
export async function listCoupons(storeId: string): Promise<StoreCoupon[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('store_coupons')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as StoreCoupon[]
}
