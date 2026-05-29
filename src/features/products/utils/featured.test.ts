import { describe, expect, it } from 'vitest'
import type { Product } from '@/types/domain'
import { MAX_FEATURED_PRODUCTS, featuredSlots } from './featured'

const featured = (n: number): Pick<Product, 'is_featured' | 'deleted_at'>[] =>
  Array.from({ length: n }, () => ({ is_featured: true, deleted_at: null }))

describe('featuredSlots', () => {
  it('ignores soft-deleted products when counting', () => {
    const products = [
      { is_featured: true, deleted_at: null },
      { is_featured: true, deleted_at: '2026-01-01' },
    ]
    const r = featuredSlots({ allProducts: products, isFeatured: false, initiallyFeatured: false })
    expect(r.otherCount).toBe(1)
  })

  it('does not count the edited product against itself', () => {
    const r = featuredSlots({
      allProducts: featured(MAX_FEATURED_PRODUCTS),
      isFeatured: true,
      initiallyFeatured: true,
    })
    expect(r.otherCount).toBe(MAX_FEATURED_PRODUCTS - 1)
    expect(r.canEnable).toBe(true)
    expect(r.displayedCount).toBe(MAX_FEATURED_PRODUCTS)
  })

  it('blocks enabling once the limit is reached by other products', () => {
    const r = featuredSlots({
      allProducts: featured(MAX_FEATURED_PRODUCTS),
      isFeatured: false,
      initiallyFeatured: false,
    })
    expect(r.canEnable).toBe(false)
    expect(r.displayedCount).toBe(MAX_FEATURED_PRODUCTS)
  })

  it('allows enabling when there is a free slot', () => {
    const r = featuredSlots({
      allProducts: featured(2),
      isFeatured: false,
      initiallyFeatured: false,
    })
    expect(r.canEnable).toBe(true)
    expect(r.displayedCount).toBe(2)
  })
})
