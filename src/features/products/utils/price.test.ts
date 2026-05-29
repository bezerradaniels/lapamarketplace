import { describe, expect, it } from 'vitest'
import { discountPercent, effectivePrice } from './price'

describe('effectivePrice', () => {
  it('returns the regular price when there is no promo', () => {
    expect(effectivePrice({ price_in_cents: 1000, promo_price_in_cents: null })).toBe(1000)
  })

  it('returns the promo price when it is lower', () => {
    expect(effectivePrice({ price_in_cents: 1000, promo_price_in_cents: 700 })).toBe(700)
  })

  it('ignores a promo that is not actually cheaper', () => {
    expect(effectivePrice({ price_in_cents: 1000, promo_price_in_cents: 1000 })).toBe(1000)
    expect(effectivePrice({ price_in_cents: 1000, promo_price_in_cents: 1200 })).toBe(1000)
  })
})

describe('discountPercent', () => {
  it('returns null when there is no active promo', () => {
    expect(discountPercent({ price_in_cents: 1000, promo_price_in_cents: null })).toBeNull()
    expect(discountPercent({ price_in_cents: 1000, promo_price_in_cents: 1000 })).toBeNull()
  })

  it('returns the rounded discount percentage', () => {
    expect(discountPercent({ price_in_cents: 1000, promo_price_in_cents: 700 })).toBe(30)
    expect(discountPercent({ price_in_cents: 1000, promo_price_in_cents: 666 })).toBe(33)
  })

  it('returns null for a non-positive price', () => {
    expect(discountPercent({ price_in_cents: 0, promo_price_in_cents: 0 })).toBeNull()
  })
})
