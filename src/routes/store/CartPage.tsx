import { useState, useEffect, useRef } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  PlusSignIcon,
  MinusSignIcon,
  CancelIcon,
  PackageIcon,
  ShoppingCartIcon,
  Tick02Icon,
  WhatsappIcon,
} from '@hugeicons/core-free-icons'
import { useCartStore } from '@/features/cart'
import { effectivePrice, getVariationImage, getVariationStock } from '@/features/products'
import {
  validateCouponCode,
  CouponValidationError,
  couponErrorMessage,
} from '@/features/coupons'
import { formatMoney } from '@/lib/format'
import { buildStorePath } from '@/lib/tenant'
import type { Store } from '@/types/domain'

export default function CartPage() {
  const store = useOutletContext<Store>()
  const [searchParams] = useSearchParams()
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const subtotal = useCartStore((s) => s.subtotalInCents())
  const discount = useCartStore((s) => s.discountInCents())
  const total = useCartStore((s) => s.totalInCents())
  const appliedCoupon = useCartStore((s) => s.coupon)
  const originalSubtotal = items.reduce((sum, i) => sum + i.product.price_in_cents * i.quantity, 0)
  const promoDiscount = originalSubtotal - subtotal
  const applyCouponToCart = useCartStore((s) => s.applyCoupon)
  const clearCoupon = useCartStore((s) => s.clearCoupon)

  const [code, setCode] = useState(() => searchParams.get('coupon') ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const checkoutBtnRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const el = checkoutBtnRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const homePath = buildStorePath(store.slug)
  const checkoutPath = buildStorePath(store.slug, 'checkout')

  // Auto-apply coupon from URL parameter (e.g., from custom coupon link)
  useEffect(() => {
    const couponFromUrl = searchParams.get('coupon')
    if (couponFromUrl && !appliedCoupon) {
      // `code` is pre-filled from the URL via lazy state init; here we just
      // validate and apply it.
      validateCouponCode({
        storeId: store.id,
        code: couponFromUrl,
        subtotalInCents: subtotal,
        cartItems: items,
      })
        .then((validated) => {
          applyCouponToCart({
            id: validated.id,
            code: validated.code,
            discountType: validated.discount_type,
            discountValue: validated.discount_value,
            discountInCents: validated.discount_in_cents,
            subtotalInCentsAtApply: subtotal,
          })
          setCode('')
        })
        .catch(() => {
          // If auto-apply fails, just clear the code
          setCode('')
        })
    }
  }, [searchParams, store.id, subtotal, items, appliedCoupon, applyCouponToCart])

  const onApplyCoupon = async () => {
    setError(null)
    setIsValidating(true)
    try {
      const validated = await validateCouponCode({
        storeId: store.id,
        code,
        subtotalInCents: subtotal,
        cartItems: items,
      })
      applyCouponToCart({
        id: validated.id,
        code: validated.code,
        discountType: validated.discount_type,
        discountValue: validated.discount_value,
        discountInCents: validated.discount_in_cents,
        subtotalInCentsAtApply: subtotal,
      })
      setCode('')
    } catch (err) {
      const codeStr =
        err instanceof CouponValidationError ? err.code : 'unknown'
      setError(couponErrorMessage(codeStr))
    } finally {
      setIsValidating(false)
    }
  }

  const onRemoveCoupon = () => {
    clearCoupon()
    setCode('')
    setError(null)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-z-bg2 text-z-text-hint">
          <HugeiconsIcon icon={ShoppingCartIcon} size={28} />
        </div>
        <h1 className="text-lg font-bold tracking-tight">Seu carrinho está vazio</h1>
        <Link to={homePath} className="text-sm font-medium text-z-green hover:underline">
          Voltar ao catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 pb-28 sm:px-6 sm:pb-8">
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-10">
        {/* Left Column: Items */}
        <div className="flex flex-col gap-4">
          <div className="mb-2 flex items-center gap-2">
            <Link
              to={homePath}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-bg2"
              aria-label="Voltar"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
            </Link>
            <h1 className="text-xl font-bold tracking-tight">
              Carrinho ({items.length})
            </h1>
          </div>

          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const { product, quantity, selectedVariation, cartKey } = item
              const image = getVariationImage(product, selectedVariation)
              const stock = getVariationStock(product, selectedVariation)
              return (
              <div
                key={cartKey}
                className="flex gap-4 rounded-xl border border-z-border bg-white p-4 shadow-sm"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-z-bg2 ring-1 ring-z-border">
                  {image ? (
                    <img
                      src={image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-z-text-hint">
                      <HugeiconsIcon icon={PackageIcon} size={28} />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <div className="text-[22px] font-bold leading-tight tracking-tight text-z-ink">
                    {product.name}
                  </div>
                  {selectedVariation && (
                    <div className="mt-0.5 inline-flex">
                      <span className="rounded-full border border-z-border bg-z-bg px-2.5 py-0.5 text-[12px] font-medium text-z-text">
                        {selectedVariation}
                      </span>
                    </div>
                  )}
                  {product.promo_price_in_cents != null && product.promo_price_in_cents < product.price_in_cents && (
                    <div className="mt-0.5 text-[13px] text-z-text-hint line-through">
                      {formatMoney(product.price_in_cents)} / un.
                    </div>
                  )}
                  <div className="text-[17px] font-bold text-z-ink">
                    {formatMoney(effectivePrice(product))} / un.
                    {product.promo_price_in_cents != null && product.promo_price_in_cents < product.price_in_cents && (
                      <span className="ml-2 text-[12px] font-semibold text-[#02a650]">
                        {Math.round((1 - product.promo_price_in_cents / product.price_in_cents) * 100)}% OFF
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(cartKey, Math.max(1, quantity - 1))
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-z-border bg-white hover:bg-z-bg2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Diminuir"
                      >
                        <HugeiconsIcon icon={MinusSignIcon} size={14} />
                      </button>
                      <span className="w-6 text-center text-[16px] font-bold tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(cartKey, quantity + 1)}
                        disabled={stock != null && quantity >= stock}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-z-border bg-white hover:bg-z-bg2 active:scale-95"
                        aria-label="Aumentar"
                      >
                        <HugeiconsIcon icon={PlusSignIcon} size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(cartKey)}
                  className="self-start p-1 text-z-text-hint hover:text-rose-600"
                  aria-label="Remover"
                >
                  <HugeiconsIcon icon={CancelIcon} size={18} />
                </button>
              </div>
            )})}

          </div>

        </div>

        {/* Right Column: Sticky Summary & Coupon */}
        <div className="lg:sticky lg:top-24 flex flex-col gap-4 mt-6 lg:mt-0">
          <div className="rounded-xl border border-z-border bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold mb-5 text-z-ink border-b border-z-border pb-4">Resumo do pedido</h2>
            
            <div className="flex flex-col gap-2">
              <div className="mb-3 flex flex-col gap-2 border-b border-z-border pb-4">
                {items.map(({ product, quantity, selectedVariation, cartKey }) => (
                  <div
                    key={cartKey}
                    className="flex items-start justify-between gap-3 text-[14px]"
                  >
                    <span className="min-w-0 text-z-text-muted">
                      <span className="font-semibold text-z-text">
                        {quantity}x
                      </span>{' '}
                      {product.name}
                      {selectedVariation && (
                        <span className="text-z-text-hint"> · {selectedVariation}</span>
                      )}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-z-text">
                      {formatMoney(effectivePrice(product) * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {(promoDiscount > 0 || discount > 0) && (
                <div className="flex justify-between text-[15px]">
                  <span className="text-z-text-muted">Subtotal</span>
                  <span className="tabular-nums text-z-text-muted">{formatMoney(originalSubtotal)}</span>
                </div>
              )}
              {promoDiscount > 0 && (
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#02a650]">Desconto produtos</span>
                  <span className="font-semibold text-[#02a650] tabular-nums">−{formatMoney(promoDiscount)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#02a650]">
                    Cupom{appliedCoupon ? ` · ${appliedCoupon.code}` : ''}
                  </span>
                  <span className="font-semibold text-[#02a650] tabular-nums">−{formatMoney(discount)}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-z-border pt-3 text-[22px] font-bold tracking-tight text-z-ink">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(total)}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                ref={checkoutBtnRef}
                to={checkoutPath}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[16px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: '#34d399' }}
              >
                <HugeiconsIcon icon={WhatsappIcon} size={20} />
                Finalizar no WhatsApp
              </Link>
              <Link
                to={homePath}
                className="inline-flex items-center justify-center gap-1.5 text-[14px] font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
              >
                Continuar comprando
                <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
              </Link>
            </div>
          </div>

          {/* Coupon */}
          <div className="rounded-xl border border-z-border bg-white p-5 shadow-sm">
            <div className="mb-3 text-[14px] font-bold text-z-ink">Cupom de desconto</div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-z-bg2 px-3 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    size={16}
                    className="shrink-0 text-z-green"
                    strokeWidth={3}
                  />
                  <span className="truncate text-sm font-bold text-z-ink uppercase tracking-wider">
                    {appliedCoupon.code}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onRemoveCoupon}
                  aria-label="Remover cupom"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-z-text-hint hover:bg-white hover:text-rose-600"
                >
                  <HugeiconsIcon icon={CancelIcon} size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void onApplyCoupon()
                      }
                    }}
                    placeholder="Inserir código"
                    className="flex-1 rounded-lg border border-z-border bg-white px-4 py-2.5 text-sm uppercase placeholder:normal-case placeholder:text-z-text-hint focus:border-z-ink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void onApplyCoupon()}
                    disabled={isValidating || !code.trim()}
                    className="rounded-lg bg-z-bg2 px-4 py-2.5 text-sm font-bold text-z-ink hover:bg-z-border disabled:opacity-50"
                  >
                    {isValidating ? '...' : 'Aplicar'}
                  </button>
                </div>
                {error && (
                  <div className="mt-2 px-1 text-xs font-semibold text-rose-600">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sticky bottom checkout CTA — mobile only, visible only after main button scrolls out */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-z-border bg-white px-4 py-3 shadow-z-lg transition-transform duration-300 sm:hidden ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
      >
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-z-text-hint">Total</div>
          <div
            className="text-[18px] font-bold tracking-tight tabular-nums"
            style={{ color: 'var(--store-primary)' }}
          >
            {formatMoney(total)}
          </div>
        </div>
        <Link
          to={checkoutPath}
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-[13px] font-bold uppercase tracking-wider text-white transition-all active:scale-[0.98]"
          style={{ background: '#34d399' }}
        >
          <HugeiconsIcon icon={WhatsappIcon} size={18} />
          Finalizar no WhatsApp
        </Link>
      </div>
    </div>
  )
}
