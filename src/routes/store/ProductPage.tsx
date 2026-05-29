import { useMemo, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { cn } from '@/lib/utils'
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  PackageIcon,
  ShoppingBagAddIcon,
  WhatsappIcon,
  PlusSignIcon,
  MinusSignIcon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons'
import type { Product, Store, VariationOption } from '@/types/domain'
import {
  useProduct,
  usePublicProducts,
  discountPercent,
  getTotalVariationStock,
  getVariationStock,
} from '@/features/products'
import { useCartStore, buildCartKey } from '@/features/cart'
import { formatMoney } from '@/lib/format'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { buildStorePath } from '@/lib/tenant'
import { sanitizeRichText } from '@/lib/sanitize/sanitizeHtml'

type VariationGroup = {
  label: string
  values: Array<{
    value: string
    isOutOfStock: boolean
  }>
}

function getOptionAttributes(option: VariationOption, fallbackLabel: string) {
  if (option.attributes && Object.keys(option.attributes).length > 0) {
    return option.attributes
  }
  return { [fallbackLabel]: option.name }
}

function buildVariationGroups(options: VariationOption[], fallbackLabel: string): VariationGroup[] {
  const labels: string[] = []
  options.forEach((option) => {
    Object.keys(getOptionAttributes(option, fallbackLabel)).forEach((label) => {
      if (!labels.includes(label)) labels.push(label)
    })
  })

  return labels.map((label) => {
    const values = Array.from(
      new Set(
        options
          .map((option) => getOptionAttributes(option, fallbackLabel)[label])
          .filter((value): value is string => Boolean(value)),
      ),
    )

    return {
      label,
      values: values.map((value) => {
        const matchingOptions = options.filter(
          (option) => getOptionAttributes(option, fallbackLabel)[label] === value,
        )
        return {
          value,
          isOutOfStock:
            matchingOptions.length > 0 &&
            matchingOptions.every((option) => option.stock === 0),
        }
      }),
    }
  })
}

function findMatchingVariationOption(
  options: VariationOption[],
  selectedValues: Record<string, string>,
  groupLabels: string[],
  fallbackLabel: string,
) {
  if (groupLabels.some((label) => !selectedValues[label])) return null

  return (
    options.find((option) => {
      const attributes = getOptionAttributes(option, fallbackLabel)
      return groupLabels.every((label) => attributes[label] === selectedValues[label])
    }) ?? null
  )
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const store = useOutletContext<Store>()
  const product = useProduct(id)
  const allProducts = usePublicProducts(store.id)
  const addItem = useCartStore((s) => s.addItem)
  const updateQty = useCartStore((s) => s.updateQuantity)
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null)
  const [selectedVariationValues, setSelectedVariationValues] = useState<Record<string, string>>({})
  const homePath = buildStorePath(store.slug)

  const p = product.data
  const variationLabel = p?.variation_label ?? 'Variação'
  const variationGroups = useMemo(
    () => buildVariationGroups(p?.variation_options ?? [], variationLabel),
    [p?.variation_options, variationLabel],
  )

  const related = useMemo<Product[]>(() => {
    if (!p || !allProducts.data) return []
    const others = allProducts.data.filter((x) => x.id !== p.id)
    const sameCategory = p.category
      ? others.filter((x) => x.category === p.category)
      : []
    const sameBrand = p.brand
      ? others.filter(
          (x) => x.brand === p.brand && !sameCategory.includes(x),
        )
      : []
    const rest = others.filter(
      (x) => !sameCategory.includes(x) && !sameBrand.includes(x),
    )
    return [...sameCategory, ...sameBrand, ...rest].slice(0, 4)
  }, [p, allProducts.data])

  // Reset selection when the product changes, adjusting state during render
  // instead of in an effect to avoid a cascading re-render.
  const [prevId, setPrevId] = useState(id)
  if (id !== prevId) {
    setPrevId(id)
    setSelectedVariation(null)
    setSelectedVariationValues({})
    setActiveImg(0)
  }

  const images = useMemo(() => {
    const base = p?.images ?? []
    return base.length > 0 ? base : [null as string | null]
  }, [p?.images])

  // Clamp the active image index if the gallery shrank.
  const [prevImagesLen, setPrevImagesLen] = useState(images.length)
  if (images.length !== prevImagesLen) {
    setPrevImagesLen(images.length)
    setActiveImg((current) => Math.min(current, Math.max(images.length - 1, 0)))
  }

  if (product.isLoading) {
    return (
      <div className="px-5 py-12 text-center text-sm text-z-text-muted">
        Carregando...
      </div>
    )
  }
  if (!p || p.store_id !== store.id) {
    return (
      <div className="flex flex-col gap-3 px-5 py-12 text-center">
        <p className="text-sm text-z-text-muted">Produto não encontrado.</p>
        <Link to={homePath} className="text-sm font-medium text-z-green underline">
          Voltar ao catálogo
        </Link>
      </div>
    )
  }

  const promo = p.promo_price_in_cents
  const hasPromo = promo != null && promo < p.price_in_cents
  const finalPrice = hasPromo ? promo : p.price_in_cents
  const discount = discountPercent(p)
  const selectedStock = getVariationStock(p, selectedVariation)
  const totalVariationStock = p.has_variations ? getTotalVariationStock(p) : null
  const stock = p.has_variations ? selectedStock : p.stock
  const displayStock = selectedVariation ? selectedStock : totalVariationStock ?? p.stock

  const mustPickVariation =
    p.has_variations &&
    (p.variation_options ?? []).length > 0 &&
    selectedVariation === null

  const handleGallerySelect = (index: number) => {
    setActiveImg(index)
  }

  const goPrev = () =>
    handleGallerySelect((activeImg - 1 + images.length) % images.length)
  const goNext = () => handleGallerySelect((activeImg + 1) % images.length)

  const handleAdd = () => {
    if (mustPickVariation || stock === 0) return
    addItem(p, selectedVariation)
    const key = buildCartKey(p.id, selectedVariation)
    if (qty > 1) updateQty(key, stock == null ? qty : Math.min(qty, stock))
  }

  const handleVariationSelect = (name: string) => {
    const option = (p.variation_options ?? []).find((o) => o.name === name)
    if (option?.stock === 0) return
    const shouldClear = selectedVariation === name
    setSelectedVariation(shouldClear ? null : name)
    setSelectedVariationValues(
      shouldClear || !option ? {} : getOptionAttributes(option, variationLabel),
    )
    setQty((current) =>
      option?.stock == null ? current : Math.min(current, Math.max(option.stock, 1)),
    )
  }

  const handleVariationValueSelect = (label: string, value: string) => {
    const nextValues = { ...selectedVariationValues }
    if (nextValues[label] === value) {
      delete nextValues[label]
    } else {
      nextValues[label] = value
    }

    setSelectedVariationValues(nextValues)
    const match = findMatchingVariationOption(
      p.variation_options ?? [],
      nextValues,
      variationGroups.map((group) => group.label),
      variationLabel,
    )

    if (!match || match.stock === 0) {
      setSelectedVariation(null)
      return
    }

    setSelectedVariation(match.name)
    setQty((current) =>
      match.stock == null ? current : Math.min(current, Math.max(match.stock, 1)),
    )
  }

  const handleWhatsApp = () => {
    if (!store.whatsapp_phone) return
    const variationSuffix = selectedVariation ? ` (${selectedVariation})` : ''
    const message = `Olá! Tenho interesse no produto *${p.name}${variationSuffix}* (${formatMoney(
      finalPrice,
    )}).`
    window.open(buildWhatsAppLink(store.whatsapp_phone, message), '_blank')
  }

  const productFacts: Array<{ label: string; value: string }> = [
    p.brand && { label: 'Marca', value: p.brand },
    p.category && { label: 'Categoria', value: p.category },
    p.unit && { label: 'Unidade', value: p.unit },
    { label: 'Condição', value: conditionLabel(p.condition) },
    p.sku && { label: 'SKU', value: p.sku },
  ].filter(Boolean) as Array<{ label: string; value: string }>

  const properties: Array<{ label: string; value: string }> = [
    p.barcode && { label: 'Código', value: p.barcode },
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 pb-28 sm:px-6 sm:py-6 sm:pb-8">
      {/* Back link */}
      <div className="mb-4">
        <Link
          to={homePath}
          className="inline-flex items-center gap-1 text-sm text-z-text-muted hover:text-z-text"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
          Voltar ao catálogo
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        {/* Gallery */}
        <Gallery
          images={images}
          activeImg={activeImg}
          setActiveImg={handleGallerySelect}
          goPrev={goPrev}
          goNext={goNext}
          alt={p.name}
        />

        {/* Info */}
        <div className="flex flex-col gap-6">
          <div>
            {p.category && (
              <span className="text-[13px] font-medium uppercase tracking-wider text-z-text-hint">
                {p.category}
              </span>
            )}
            <h1 className="mt-1 text-[30px] font-bold leading-tight tracking-tight text-z-ink sm:text-[34px]">
              {p.name}
            </h1>
          </div>

          <ProductFacts facts={productFacts} className="hidden lg:grid" />

          {/* Price */}
          <div className="flex flex-col gap-1">
            {hasPromo && (
              <span className="text-[15px] text-z-text-hint line-through">
                {formatMoney(p.price_in_cents)}
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[32px] font-bold leading-none tracking-tight text-z-ink sm:text-[38px]">
                {finalPrice === 0 ? 'Valor a combinar' : formatMoney(finalPrice)}
              </span>
              {hasPromo && (
                <span className="rounded-lg bg-[#e8f8ef] px-2.5 py-1 text-[13px] font-bold text-[#02a650]">
                  {discount}% OFF
                </span>
              )}
            </div>
            {p.installment_count != null && p.installment_total_in_cents != null && (
              <span className="text-[14px] text-z-text-muted">
                <span className="font-semibold text-[#02a650]">{p.installment_count}x </span>
                <span className="font-semibold text-z-ink">
                  {formatMoney(Math.ceil(p.installment_total_in_cents / p.installment_count))}
                </span>
                {p.installment_total_in_cents <= finalPrice
                  ? <span className="text-[#02a650]"> sem juros</span>
                  : null
                }
              </span>
            )}
          </div>

          {/* Variation picker */}
          {p.has_variations && (p.variation_options ?? []).length > 0 && (
            <VariationPicker
              label={variationLabel}
              options={p.variation_options!}
              groups={variationGroups}
              selected={selectedVariation}
              selectedValues={selectedVariationValues}
              onSelect={handleVariationSelect}
              onValueSelect={handleVariationValueSelect}
            />
          )}

          {/* Quantity + primary CTA */}
          <div className="flex flex-col gap-4">
            <span className="text-[14px] font-bold text-z-ink sm:hidden">
              Quantidade
            </span>
            <div className="flex items-center gap-3">
              <div className="hidden shrink-0 items-center gap-4 sm:flex">
                <span className="text-[14px] font-bold text-z-ink">Quantidade</span>
                <QuantityStepper
                  qty={qty}
                  max={stock ?? undefined}
                  onChange={setQty}
                />
              </div>
              <div className="sm:hidden">
                <QuantityStepper
                  qty={qty}
                  max={stock ?? undefined}
                  onChange={setQty}
                />
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={stock === 0 || mustPickVariation}
                className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-4 text-[12px] font-bold uppercase tracking-wide text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 sm:px-6 sm:text-[14px] sm:tracking-wider"
                style={{ background: 'var(--store-primary)' }}
              >
                <HugeiconsIcon icon={ShoppingBagAddIcon} size={18} />
                {mustPickVariation ? 'Selecione uma opção' : 'Adicionar ao pedido'}
              </button>
            </div>

            {displayStock !== null && displayStock !== undefined && (
              <p className="text-[13px] font-medium text-z-text-muted">
                {selectedVariation
                  ? `Estoque disponível: ${displayStock}`
                  : `Estoque total disponível: ${displayStock}`}
              </p>
            )}

            {store.whatsapp_phone && (
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#25d366] text-[14px] font-bold uppercase tracking-wider text-[#25d366] transition-colors hover:bg-[#25d366]/10"
              >
                <HugeiconsIcon icon={WhatsappIcon} size={20} />
                Pedir via WhatsApp
              </button>
            )}
          </div>

          {/* Additional details if any */}
          {properties.length > 0 && (
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-z-border pt-6">
              {properties.map((prop) => (
                <div key={prop.label} className="flex flex-col">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-z-text-hint">
                    {prop.label}
                  </dt>
                  <dd className="mt-1 text-[15px] font-medium text-z-ink">
                    {prop.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {/* Description card */}
      {p.description && (
        <div className="mt-6 rounded-2xl border border-z-border bg-white p-5 shadow-sm sm:p-6">
          <ProductFacts facts={productFacts} className="mb-5 lg:hidden" />
          <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-z-text-hint">
            Descrição
          </h2>
          <div
            className="whitespace-pre-line text-[15px] leading-relaxed text-z-text [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{
              // SECURITY: DOMPurify strips every disallowed tag AND attribute
              // (incl. event handlers like onmouseover). A regex tag allow-list
              // does not — it leaves `<p onclick=...>` intact (stored XSS).
              __html: sanitizeRichText(p.description),
            }}
          />
        </div>
      )}

      {/* You may also like */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-base font-bold">Você também pode gostar</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {related.map((r) => (
              <RelatedCard
                key={r.id}
                product={r}
                storeSlug={store.slug}
                onAdd={() => useCartStore.getState().addItem(r, null)}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                               */
/* -------------------------------------------------------------------------- */

function conditionLabel(condition: Product['condition']) {
  const labels: Record<Product['condition'], string> = {
    new: 'Novo',
    used: 'Usado',
    refurbished: 'Recondicionado',
  }
  return labels[condition] ?? condition
}

function ProductFacts({
  facts,
  className,
}: {
  facts: Array<{ label: string; value: string }>
  className?: string
}) {
  if (facts.length === 0) return null

  return (
    <dl className={cn('grid grid-cols-2 gap-x-8 gap-y-5', className)}>
      {facts.map((fact) => (
        <div key={fact.label} className="min-w-0">
          <dt className="text-[14px] font-semibold text-z-text-muted">
            {fact.label}
          </dt>
          <dd className="mt-1 truncate text-[16px] font-bold text-z-text">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function VariationPicker({
  label,
  options,
  groups,
  selected,
  selectedValues,
  onSelect,
  onValueSelect,
}: {
  label: string
  options: VariationOption[]
  groups: VariationGroup[]
  selected: string | null
  selectedValues: Record<string, string>
  onSelect: (name: string) => void
  onValueSelect: (label: string, value: string) => void
}) {
  const hasAttributeGroups = groups.length > 0

  if (hasAttributeGroups) {
    return (
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-z-ink">{group.label}</span>
              {selectedValues[group.label] ? (
                <span className="text-[13px] font-medium text-z-text-muted">
                  · {selectedValues[group.label]}
                </span>
              ) : (
                <span className="text-[12px] font-semibold text-rose-500">
                  Selecione uma opção
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {group.values.map((item) => {
                const isSelected = selectedValues[group.label] === item.value
                return (
                  <button
                    key={`${group.label}-${item.value}`}
                    type="button"
                    onClick={() => onValueSelect(group.label, item.value)}
                    disabled={item.isOutOfStock}
                    className={cn(
                      'flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium transition-all',
                      isSelected
                        ? 'text-z-ink shadow-sm'
                        : 'border-z-border text-z-text hover:border-z-ink',
                      item.isOutOfStock &&
                        'cursor-not-allowed opacity-45 hover:border-z-border',
                    )}
                    style={
                      isSelected
                        ? {
                            borderColor: 'var(--store-primary)',
                            backgroundColor:
                              'color-mix(in srgb, var(--store-primary) 12%, transparent)',
                          }
                        : undefined
                    }
                  >
                    {item.value}
                    {item.isOutOfStock && (
                      <span className="text-[11px] font-semibold text-z-text-hint">
                        Esgotado
                      </span>
                    )}
                    {isSelected && (
                      <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        size={14}
                        style={{ color: 'var(--store-primary)' }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {selected ? (
          <p className="text-[12px] font-medium text-z-text-muted">
            Opção selecionada: {selected}
          </p>
        ) : (
          <p className="text-[12px] font-semibold text-rose-500">
            Selecione todas as opções para adicionar ao pedido.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-bold text-z-ink">{label}</span>
        {selected ? (
          <span className="text-[13px] font-medium text-z-text-muted">· {selected}</span>
        ) : (
          <span className="text-[12px] font-semibold text-rose-500">Selecione uma opção</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected === opt.name
          const isOutOfStock = opt.stock === 0
          return (
            <button
              key={opt.name}
              type="button"
              onClick={() => onSelect(opt.name)}
              disabled={isOutOfStock}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium transition-all',
                isSelected
                  ? 'text-z-ink shadow-sm'
                  : 'border-z-border text-z-text hover:border-z-ink',
                isOutOfStock && 'cursor-not-allowed opacity-45 hover:border-z-border',
              )}
              style={
                isSelected
                  ? {
                      borderColor: 'var(--store-primary)',
                      backgroundColor: 'color-mix(in srgb, var(--store-primary) 12%, transparent)',
                    }
                  : undefined
              }
            >
              {opt.name}
              {isOutOfStock && (
                <span className="text-[11px] font-semibold text-z-text-hint">
                  Esgotado
                </span>
              )}
              {isSelected && (
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  size={14}
                  style={{ color: 'var(--store-primary)' }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Gallery({
  images,
  activeImg,
  setActiveImg,
  goPrev,
  goNext,
  alt,
}: {
  images: (string | null)[]
  activeImg: number
  setActiveImg: (i: number) => void
  goPrev: () => void
  goNext: () => void
  alt: string
}) {
  const hasMultiple = images.length > 1
  const hasAnyImage = images.some(Boolean)
  return (
    <div className="flex flex-col gap-3">
      {/* Main image — high priority, above fold */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-z-border shadow-sm">
        {hasAnyImage && (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-sm">
            {activeImg + 1}/{images.length} {images.length === 1 ? 'foto' : 'fotos'}
          </span>
        )}
        {images[activeImg] ? (
          <OptimizedImage
            src={images[activeImg]}
            transform={{ width: 900, quality: 88 }}
            alt={alt}
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover transition-all duration-300"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-z-text-hint" style={{ backgroundColor: '#f9f6f2' }}>
            <HugeiconsIcon icon={PackageIcon} size={64} />
            <span className="mt-2 text-xs">produto sem imagem</span>
          </div>
        )}
        {hasMultiple && (
          <>
            <GalleryArrow direction="prev" icon={ArrowLeft02Icon} onClick={goPrev} />
            <GalleryArrow direction="next" icon={ArrowRight02Icon} onClick={goNext} />
          </>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveImg(i)}
              className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white transition-all"
              style={{
                border:
                  activeImg === i
                    ? '2px solid var(--store-primary)'
                    : '1px solid rgba(0,0,0,0.08)',
              }}
              aria-label={`Imagem ${i + 1}`}
            >
              {img ? (
                <OptimizedImage
                  src={img}
                  transform={{ width: 128, quality: 80 }}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-z-text-hint" style={{ backgroundColor: '#f9f6f2' }}>
                  <HugeiconsIcon icon={PackageIcon} size={20} />
                  <span className="mt-1 text-[8px]">sem imagem</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GalleryArrow({
  direction,
  icon,
  onClick,
}: {
  direction: 'prev' | 'next'
  icon: IconSvgElement
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Imagem anterior' : 'Próxima imagem'}
      className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-z-text shadow-z transition-colors hover:bg-white ${
        direction === 'prev' ? 'left-3' : 'right-3'
      }`}
    >
      <HugeiconsIcon icon={icon} size={18} />
    </button>
  )
}

function QuantityStepper({
  qty,
  max,
  onChange,
}: {
  qty: number
  max?: number
  onChange: (next: number) => void
}) {
  return (
    <div className="inline-flex h-12 shrink-0 items-stretch overflow-hidden rounded-full border border-z-border bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, qty - 1))}
        disabled={qty <= 1}
        className="flex w-11 items-center justify-center text-z-text hover:bg-z-bg2 disabled:opacity-40"
        aria-label="Diminuir"
      >
        <HugeiconsIcon icon={MinusSignIcon} size={14} />
      </button>
      <div className="flex w-10 items-center justify-center text-center text-base font-bold tabular-nums">
        {qty}
      </div>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        disabled={max !== undefined && qty >= max}
        className="flex w-11 items-center justify-center text-z-text hover:bg-z-bg2 disabled:opacity-40"
        aria-label="Aumentar"
      >
        <HugeiconsIcon icon={PlusSignIcon} size={14} />
      </button>
    </div>
  )
}

function RelatedCard({
  product: p,
  storeSlug,
  onAdd,
}: {
  product: Product
  storeSlug: string
  onAdd: () => void
}) {
  const discount = discountPercent(p)
  const finalPrice = p.promo_price_in_cents ?? p.price_in_cents
  const hasPromo = discount !== null
  const cartItems = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const isInCart = cartItems.some((item) => item.product.id === p.id)
  const cartKey = buildCartKey(p.id, null)

  return (
    <article className="group flex flex-col rounded-2xl border border-z-border bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <Link to={buildStorePath(storeSlug, `produto/${p.id}`)} className="block">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl transition-shadow">
          {p.images[0] ? (
            <OptimizedImage
              src={p.images[0]}
              transform={{ width: 400, quality: 82 }}
              alt={p.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-z-text-hint" style={{ backgroundColor: '#f9f6f2' }}>
              <HugeiconsIcon icon={PackageIcon} size={36} />
              <span className="mt-2 text-xs">produto sem imagem</span>
            </div>
          )}

        </div>

        <div className="mt-3">
          <h3 className="line-clamp-2 min-h-[1.5em] text-[18px] font-bold leading-tight tracking-tight text-z-ink">
            {p.name}
          </h3>

          <div className="mt-1 flex flex-col gap-0.5">
            {hasPromo && (
              <span className="text-[12px] text-z-text-hint line-through">
                {formatMoney(p.price_in_cents)}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-[20px] font-bold leading-none text-z-ink">
                {finalPrice === 0 ? 'A combinar' : formatMoney(finalPrice)}
              </span>
              {hasPromo && (
                <span className="rounded-md bg-[#e8f8ef] px-1.5 py-0.5 text-[11px] font-bold text-[#02a650]">
                  {discount}% OFF
                </span>
              )}
            </div>
            {p.installment_count != null && p.installment_total_in_cents != null && (
              <span className="text-[11px] text-z-text-muted">
                <span className="font-semibold text-[#02a650]">{p.installment_count}x </span>
                <span className="font-semibold text-z-ink">
                  {formatMoney(Math.ceil(p.installment_total_in_cents / p.installment_count))}
                </span>
                {p.installment_total_in_cents <= finalPrice
                  ? <span className="text-[#02a650]"> sem juros</span>
                  : null
                }
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* If product has variations, send to product page instead of direct add */}
      {p.has_variations ? (
        <Link
          to={buildStorePath(storeSlug, `produto/${p.id}`)}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-z-border text-[12px] font-bold text-z-ink transition-all hover:bg-z-bg2 active:scale-[0.98]"
        >
          Ver opções
        </Link>
      ) : (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onAdd()
            }}
            className={cn(
              'mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-bold text-white transition-all active:scale-[0.98]',
              isInCart ? 'bg-gray-200 text-gray-600' : 'hover:opacity-90',
            )}
            style={!isInCart ? { background: 'var(--store-primary)' } : undefined}
          >
            {isInCart ? (
              <>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-400">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-white" />
                </div>
                Adicionado
              </>
            ) : (
              <>
                <HugeiconsIcon icon={ShoppingBagAddIcon} size={16} />
                Adicionar ao pedido
              </>
            )}
          </button>
          {isInCart && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                removeItem(cartKey)
              }}
              className="mt-2 text-center text-xs text-red-500 hover:text-red-600"
            >
              Remover
            </button>
          )}
        </>
      )}
    </article>
  )
}
