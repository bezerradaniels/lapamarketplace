import { beforeEach, describe, expect, it } from 'vitest'
import type { Product } from '@/types/domain'
import { type AppliedCoupon, buildCartKey, useCartStore } from './cartStore'

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    store_id: 's1',
    price_in_cents: 1000,
    promo_price_in_cents: null,
    has_variations: false,
    variation_options: null,
    stock: null,
    ...overrides,
  } as Product
}

const percentCoupon = (value: number): AppliedCoupon => ({
  id: 'c1',
  code: 'OFF',
  discountType: 'percent',
  discountValue: value,
  discountInCents: 0,
  subtotalInCentsAtApply: 0,
})

const fixedCoupon = (cents: number): AppliedCoupon => ({
  id: 'c2',
  code: 'FIXED',
  discountType: 'fixed',
  discountValue: cents,
  discountInCents: cents,
  subtotalInCentsAtApply: 0,
})

beforeEach(() => {
  useCartStore.setState({ items: [], coupon: null })
})

describe('addItem', () => {
  it('adds a new product with quantity 1', () => {
    useCartStore.getState().addItem(makeProduct())
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(1)
    expect(items[0].cartKey).toBe(buildCartKey('p1', null))
  })

  it('increments quantity when the same product is added again', () => {
    const p = makeProduct()
    useCartStore.getState().addItem(p)
    useCartStore.getState().addItem(p)
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })

  it('does not exceed available stock', () => {
    const p = makeProduct({ stock: 1 })
    useCartStore.getState().addItem(p)
    useCartStore.getState().addItem(p)
    expect(useCartStore.getState().items[0].quantity).toBe(1)
  })

  it('refuses to add an out-of-stock product', () => {
    useCartStore.getState().addItem(makeProduct({ stock: 0 }))
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})

describe('updateQuantity', () => {
  it('clamps to a minimum of 1', () => {
    const p = makeProduct()
    useCartStore.getState().addItem(p)
    useCartStore.getState().updateQuantity(buildCartKey('p1', null), 0)
    expect(useCartStore.getState().items[0].quantity).toBe(1)
  })

  it('clamps to available stock', () => {
    const p = makeProduct({ stock: 3 })
    useCartStore.getState().addItem(p)
    useCartStore.getState().updateQuantity(buildCartKey('p1', null), 99)
    expect(useCartStore.getState().items[0].quantity).toBe(3)
  })
})

describe('removeItem', () => {
  it('drops the coupon once the cart is empty', () => {
    useCartStore.getState().addItem(makeProduct())
    useCartStore.getState().applyCoupon(percentCoupon(10))
    useCartStore.getState().removeItem(buildCartKey('p1', null))
    expect(useCartStore.getState().items).toHaveLength(0)
    expect(useCartStore.getState().coupon).toBeNull()
  })
})

describe('money calculations', () => {
  it('sums the effective price across items', () => {
    useCartStore.getState().addItem(makeProduct({ id: 'a', price_in_cents: 1000 }))
    useCartStore.getState().addItem(makeProduct({ id: 'a', price_in_cents: 1000 })) // qty 2
    useCartStore
      .getState()
      .addItem(makeProduct({ id: 'b', price_in_cents: 500, promo_price_in_cents: 400 }))
    expect(useCartStore.getState().subtotalInCents()).toBe(2400)
  })

  it('applies a percentage coupon (floored)', () => {
    useCartStore.getState().addItem(makeProduct({ price_in_cents: 999 }))
    useCartStore.getState().applyCoupon(percentCoupon(10))
    expect(useCartStore.getState().discountInCents()).toBe(99) // floor(999 * 0.1)
    expect(useCartStore.getState().totalInCents()).toBe(900)
  })

  it('caps a fixed coupon at the subtotal so the total never goes negative', () => {
    useCartStore.getState().addItem(makeProduct({ price_in_cents: 500 }))
    useCartStore.getState().applyCoupon(fixedCoupon(800))
    expect(useCartStore.getState().discountInCents()).toBe(500)
    expect(useCartStore.getState().totalInCents()).toBe(0)
  })
})
