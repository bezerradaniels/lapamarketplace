import type { Product } from '@/types/domain'

/**
 * Price the customer actually pays for this product right now.
 * Falls back to the regular price when there's no active promotion.
 */
export function effectivePrice(p: Pick<Product, 'price_in_cents' | 'promo_price_in_cents'>): number {
  if (p.promo_price_in_cents != null && p.promo_price_in_cents < p.price_in_cents) {
    return p.promo_price_in_cents
  }
  return p.price_in_cents
}

/**
 * Profit margin as a percentage of the selling price. Returns 100 when a price
 * is set but no cost is known, and null when there is no price to base it on.
 */
export function marginPercent(
  priceCents: number,
  costCents: number | null | undefined,
): number | null {
  if (costCents && costCents > 0 && priceCents > 0) {
    return ((priceCents - costCents) / priceCents) * 100
  }
  return priceCents > 0 ? 100 : null
}

/** Discount percentage (0-100) when there's an active promo, otherwise null. */
export function discountPercent(
  p: Pick<Product, 'price_in_cents' | 'promo_price_in_cents'>,
): number | null {
  if (p.promo_price_in_cents == null || p.price_in_cents <= 0) return null
  if (p.promo_price_in_cents >= p.price_in_cents) return null
  return Math.round((1 - p.promo_price_in_cents / p.price_in_cents) * 100)
}
