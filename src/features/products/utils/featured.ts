import type { Product } from '@/types/domain'

/** Maximum number of products a store may feature at once. */
export const MAX_FEATURED_PRODUCTS = 4

type FeaturedSlotsArgs = {
  /** All of the store's products (used to count occupied featured slots). */
  allProducts: Pick<Product, 'is_featured' | 'deleted_at'>[]
  /** Whether the product being edited is currently toggled as featured. */
  isFeatured: boolean
  /** Whether the product was already featured when the form opened. */
  initiallyFeatured: boolean
}

type FeaturedSlots = {
  /** Featured slots occupied by products other than the one being edited. */
  otherCount: number
  /** Whether the "featured" toggle may still be enabled. */
  canEnable: boolean
  /** Slots that would be used if the current toggle state were saved. */
  displayedCount: number
}

/**
 * Computes featured-slot availability for the product form. Excludes the
 * product being edited from the "other products" count so toggling it on does
 * not count against itself.
 */
export function featuredSlots({
  allProducts,
  isFeatured,
  initiallyFeatured,
}: FeaturedSlotsArgs): FeaturedSlots {
  const total = allProducts.filter((p) => p.is_featured && !p.deleted_at).length
  const otherCount = total - (initiallyFeatured ? 1 : 0)
  return {
    otherCount,
    canEnable: isFeatured || otherCount < MAX_FEATURED_PRODUCTS,
    displayedCount: otherCount + (isFeatured ? 1 : 0),
  }
}
