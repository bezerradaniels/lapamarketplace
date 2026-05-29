import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PackageIcon,
  SearchIcon,
  ArrowDownIcon,
  ShoppingBagAddIcon,
  CheckmarkCircle01Icon,
  Edit01Icon,
  StarIcon,
} from '@hugeicons/core-free-icons'
import type { Product, Store } from '@/types/domain'
import { usePublicProducts, discountPercent } from '@/features/products'
import { useCartStore, buildCartKey } from '@/features/cart'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { buildStorePath } from '@/lib/tenant'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { ROUTES } from '@/config/routes'
import { useStoreOwnerMode } from '@/routes/store/storeOwnerMode'

const ALL_CATEGORY = '__all__'
type SortKey = 'recent' | 'price_asc' | 'price_desc' | 'name'

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Mais recentes',
  price_asc: 'Menor preço',
  price_desc: 'Maior preço',
  name: 'A → Z',
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function effective(p: Product) {
  return p.promo_price_in_cents ?? p.price_in_cents
}

export default function StorePage() {
  const store = useOutletContext<Store>()
  const products = usePublicProducts(store.id)
  const addItem = useCartStore((s) => s.addItem)

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('recent')
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY)

  // Memoize so the `?? []` fallback keeps a stable reference and the
  // dependent useMemos below don't recompute on every render.
  const list = useMemo(() => products.data ?? [], [products.data])
  const featuredProducts = useMemo(
    () => list.filter((p) => p.is_featured && p.is_active),
    [list],
  )

  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    for (const p of list) {
      if (!p.category) continue
      if (!seen.has(p.category)) seen.set(p.category, titleCase(p.category))
    }
    return Array.from(seen, ([key, label]) => ({ key, label }))
  }, [list])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let result = list
    if (selectedCategory !== ALL_CATEGORY) {
      result = result.filter((p) => p.category === selectedCategory)
    }
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      )
    }
    const sorted = [...result]
    switch (sort) {
      case 'price_asc':
        sorted.sort((a, b) => effective(a) - effective(b))
        break
      case 'price_desc':
        sorted.sort((a, b) => effective(b) - effective(a))
        break
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        break
      case 'recent':
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        )
    }
    return sorted
  }, [list, search, sort, selectedCategory])

  if (products.isLoading) {
    return (
      <div className="px-5 py-12 text-center text-sm text-z-text-muted">
        Carregando produtos...
      </div>
    )
  }

  if (list.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-z-bg2 text-z-text-hint">
          <HugeiconsIcon icon={PackageIcon} size={26} />
        </div>
        <h2 className="text-base font-semibold">Catálogo em construção</h2>
        <p className="mt-1 text-sm text-z-text-muted">
          Nenhum produto disponível no momento.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Em Destaque */}
      {featuredProducts.length > 0 && !search && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <HugeiconsIcon icon={StarIcon} size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-z-text">Em Destaque</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featuredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                storeSlug={store.slug}
                onAdd={() => addItem(p)}
                featured
              />
            ))}
          </div>
        </section>
      )}

      {/* Search + sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={SearchIcon}
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-z-text-hint"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produtos..."
            className="h-11 w-full rounded-full border border-z-border bg-white pl-10 pr-4 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
          />
        </div>
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="mt-4 overflow-x-auto pb-1">
          <div className="flex w-max gap-2">
            <CategoryChip
              label="Todos"
              active={selectedCategory === ALL_CATEGORY}
              onClick={() => setSelectedCategory(ALL_CATEGORY)}
            />
            {categories.map((c) => (
              <CategoryChip
                key={c.key}
                label={c.label}
                active={selectedCategory === c.key}
                onClick={() => setSelectedCategory(c.key)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-z-text-muted">
          Nenhum produto encontrado.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              storeSlug={store.slug}
              onAdd={() => addItem(p)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                              */
/* -------------------------------------------------------------------------- */

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors',
        active
          ? 'border-transparent text-white'
          : 'border-z-border bg-white text-z-text-muted hover:bg-z-bg2',
      )}
      style={
        active
          ? { background: 'var(--store-primary)' }
          : undefined
      }
    >
      {label}
    </button>
  )
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey
  onChange: (next: SortKey) => void
}) {
  return (
    <div className="relative inline-flex shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        aria-label="Ordenar"
        className="h-11 w-11 appearance-none rounded-full border border-z-border bg-white text-sm font-medium opacity-0 focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20 sm:w-auto sm:pl-5 sm:pr-10 sm:opacity-100"
      >
        {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
          <option key={k} value={k}>
            {SORT_LABELS[k]}
          </option>
        ))}
      </select>
      {/* Mobile: icon-only handle behind the (transparent) select */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full border border-z-border bg-white sm:hidden">
        <HugeiconsIcon icon={ArrowDownIcon} size={16} className="text-z-text-muted" />
      </div>
      {/* Desktop: caret */}
      <HugeiconsIcon
        icon={ArrowDownIcon}
        size={14}
        className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-z-text-hint sm:block"
      />
    </div>
  )
}

function ProductCard({
  product: p,
  storeSlug,
  onAdd,
  featured = false,
}: {
  product: Product
  storeSlug: string
  onAdd: () => void
  featured?: boolean
}) {
  const discount = discountPercent(p)
  const finalPrice = p.promo_price_in_cents ?? p.price_in_cents
  const hasPromo = discount !== null
  const cartItems = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const isInCart = cartItems.some((item) => item.product.id === p.id)
  const { isOwner, ownerMode } = useStoreOwnerMode()
  const showEditOverlay = isOwner && ownerMode === 'lojista'

  return (
    <article className="group relative flex flex-col rounded-2xl border border-z-border bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4">
      {showEditOverlay && (
        <Link
          to={`${ROUTES.dashboardProducts}?edit=${p.id}`}
          className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-z-ink shadow-sm ring-1 ring-black/10 backdrop-blur-sm hover:bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          <HugeiconsIcon icon={Edit01Icon} size={11} />
          Editar
        </Link>
      )}
      {featured && (
        <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
          <HugeiconsIcon icon={StarIcon} size={10} />
          Destaque
        </div>
      )}
      <Link to={buildStorePath(storeSlug, `produto/${p.id}`)} className="block">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl">
          {p.images[0] ? (
            <OptimizedImage
              src={p.images[0]}
              transform={{ width: 600, quality: 85 }}
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
          <h3 className="line-clamp-2 min-h-[1.5em] text-[20px] font-bold capitalize leading-tight tracking-tight text-z-ink">
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
                {finalPrice === 0 ? 'Valor a combinar' : formatMoney(finalPrice)}
              </span>
              {hasPromo && (
                <span className="rounded-md bg-[#e8f8ef] px-1.5 py-0.5 text-[11px] font-bold text-[#02a650]">
                  {discount}% OFF
                </span>
              )}
            </div>
            {p.installment_count != null && p.installment_total_in_cents != null && (
              <span className="text-[11px] text-z-text-muted">
                <span className="font-semibold text-z-ink">{p.installment_count}x </span>
                <span className="font-semibold text-z-ink">
                  {formatMoney(Math.ceil(p.installment_total_in_cents / p.installment_count))}
                </span>
                {p.installment_total_in_cents <= finalPrice && (
                  <span className="text-[#02a650]"> sem juros</span>
                )}
              </span>
            )}
          </div>
        </div>
      </Link>

      {p.has_variations ? (
        <Link
          to={buildStorePath(storeSlug, `produto/${p.id}`)}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-z-border text-[12px] font-bold text-z-ink transition-all hover:bg-z-bg2 active:scale-[0.98]"
        >
          Ver mais
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
              'mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-bold text-white transition-all active:scale-[0.98]',
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
                <HugeiconsIcon icon={ShoppingBagAddIcon} size={18} />
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
                removeItem(buildCartKey(p.id, null))
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
