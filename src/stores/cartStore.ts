import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, ValidatedCoupon } from '@/types/domain'
import { effectivePrice } from '@/features/products/utils/price'
import { getVariationStock } from '@/features/products/utils/variation'

export type CartItem = {
  product: Product
  quantity: number
  selectedVariation: string | null
  /** Stable key used for update/remove: `${productId}::${selectedVariation ?? ''}` */
  cartKey: string
}

/**
 * Coupon snapshot persisted in the cart. The `discount_in_cents` is recomputed
 * server-side at order-creation time anyway, but keeping the last-known
 * discount lets the UI react instantly when items change.
 */
export type AppliedCoupon = {
  id: string
  code: string
  discountType: ValidatedCoupon['discount_type']
  discountValue: number
  discountInCents: number
  /** Cart subtotal at the moment the coupon was applied. Used to detect when
   *  a re-validation is needed (subtotal changed → recompute or drop). */
  subtotalInCentsAtApply: number
}

export function buildCartKey(productId: string, variation?: string | null): string {
  return `${productId}::${variation ?? ''}`
}

function maxAvailableQuantity(product: Product, selectedVariation?: string | null) {
  const stock = getVariationStock(product, selectedVariation)
  return stock == null ? Number.POSITIVE_INFINITY : stock
}

type CartStore = {
  items: CartItem[]
  coupon: AppliedCoupon | null
  addItem: (product: Product, selectedVariation?: string | null) => void
  removeItem: (cartKey: string) => void
  updateQuantity: (cartKey: string, quantity: number) => void
  clearCart: () => void
  scopeToStore: (storeId: string) => void
  applyCoupon: (coupon: AppliedCoupon) => void
  clearCoupon: () => void
  subtotalInCents: () => number
  discountInCents: () => number
  totalInCents: () => number
}

function computeDiscount(c: AppliedCoupon, subtotal: number): number {
  if (c.discountType === 'percent') {
    return Math.floor((subtotal * c.discountValue) / 100)
  }
  return Math.min(c.discountValue, subtotal)
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      addItem: (product, selectedVariation = null) =>
        set((state) => {
          const key = buildCartKey(product.id, selectedVariation)
          const existing = state.items.find((i) => i.cartKey === key)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.cartKey === key
                  ? {
                      ...i,
                      quantity: Math.min(
                        i.quantity + 1,
                        maxAvailableQuantity(product, selectedVariation),
                      ),
                    }
                  : i,
              ),
            }
          }
          if (maxAvailableQuantity(product, selectedVariation) <= 0) return state
          return {
            items: [
              ...state.items,
              { product, quantity: 1, selectedVariation, cartKey: key },
            ],
          }
        }),
      removeItem: (cartKey) =>
        set((state) => {
          const remaining = state.items.filter((i) => i.cartKey !== cartKey)
          return {
            items: remaining,
            coupon: remaining.length === 0 ? null : state.coupon,
          }
        }),
      updateQuantity: (cartKey, quantity) =>
        set((state) => ({
          items: state.items.map((i) => {
            if (i.cartKey !== cartKey) return i
            const max = maxAvailableQuantity(i.product, i.selectedVariation)
            return {
              ...i,
              quantity: max <= 0 ? i.quantity : Math.min(Math.max(1, quantity), max),
            }
          }),
        })),
      clearCart: () => set({ items: [], coupon: null }),
      scopeToStore: (storeId) =>
        set((state) => {
          const filtered = state.items.filter((i) => i.product.store_id === storeId)
          return {
            items: filtered,
            coupon: filtered.length === 0 ? null : state.coupon,
          }
        }),
      applyCoupon: (coupon) => set({ coupon }),
      clearCoupon: () => set({ coupon: null }),
      subtotalInCents: () =>
        get().items.reduce(
          (sum, i) => sum + effectivePrice(i.product) * i.quantity,
          0,
        ),
      discountInCents: () => {
        const { coupon } = get()
        if (!coupon) return 0
        const subtotal = get().subtotalInCents()
        return Math.min(computeDiscount(coupon, subtotal), subtotal)
      },
      totalInCents: () => {
        const subtotal = get().subtotalInCents()
        const discount = get().discountInCents()
        return Math.max(0, subtotal - discount)
      },
    }),
    {
      name: 'lapa-marketplace-cart',
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2) {
          // Old items don't have cartKey or selectedVariation — backfill them.
          const old = persisted as {
            items: Array<{ product: Product; quantity: number }>
            coupon: AppliedCoupon | null
          }
          return {
            ...old,
            items: old.items.map((i) => ({
              ...i,
              selectedVariation: null,
              cartKey: buildCartKey(i.product.id, null),
            })),
          }
        }
        return persisted as CartStore
      },
    },
  ),
)
