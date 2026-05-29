import { useState, useMemo } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  Search01Icon,
  MinusSignIcon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import { formatMoney } from '@/lib/format'
import { effectivePrice } from '@/features/products/utils/price'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/domain'

export type PickedItem = {
  product: Product
  quantity: number
}

type Props = {
  open: boolean
  products: Product[]
  alreadyPicked: PickedItem[]
  onConfirm: (items: PickedItem[]) => void
  onClose: () => void
}

export function ProductPickerModal({
  open,
  products,
  alreadyPicked,
  onConfirm,
  onClose,
}: Props) {
  if (!open) return null
  return (
    <PickerContent
      key="product-picker"
      products={products}
      alreadyPicked={alreadyPicked}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}

function PickerContent({
  products,
  alreadyPicked,
  onConfirm,
  onClose,
}: Omit<Props, 'open'>) {
  const [search, setSearch] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const item of alreadyPicked) {
      initial[item.product.id] = item.quantity
    }
    return initial
  })
  const [added, setAdded] = useState<Set<string>>(() => {
    return new Set(alreadyPicked.map((i) => i.product.id))
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)),
    )
  }, [products, search])

  const addedCount = added.size

  const getQty = (id: string) => quantities[id] ?? 1

  const setQty = (id: string, qty: number) =>
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, qty) }))

  const toggleAdd = (product: Product) => {
    const id = product.id
    setAdded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        if (!quantities[id]) setQty(id, 1)
      }
      return next
    })
  }

  const handleConfirm = () => {
    const items: PickedItem[] = products
      .filter((p) => added.has(p.id))
      .map((p) => ({ product: p, quantity: getQty(p.id) }))
    onConfirm(items)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-z-pop">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-z-border px-6 py-5">
          <div className="flex-1">
            <p className="text-sm font-medium text-z-text">
              Pesquise e adicione produtos ao pedido.
            </p>
            <div className="relative mt-3">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-z-text-hint"
              />
              <input
                autoFocus
                type="text"
                placeholder="Pesquisar por nome ou código"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-z-border pl-9 pr-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-z-text-muted transition-colors hover:bg-z-bg2 hover:text-z-text"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between border-b border-z-border bg-z-bg px-6 py-2 text-xs">
          <span className="text-z-text-muted">
            Produtos encontrados{' '}
            <strong className="text-z-text">({filtered.length} itens)</strong>
          </span>
          <span className="font-medium text-rose-500">
            Adicionados ({addedCount} itens)
          </span>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-z-text-muted">
              <HugeiconsIcon icon={Search01Icon} size={28} className="text-z-text-hint" />
              <p>Nenhum produto encontrado para "{search}"</p>
            </div>
          ) : (
            <ul className="divide-y divide-z-border">
              {filtered.map((product) => {
                const isAdded = added.has(product.id)
                const qty = getQty(product.id)
                const price = effectivePrice(product)
                const cover = product.images[0]

                return (
                  <li
                    key={product.id}
                    className={cn(
                      'flex items-start gap-4 p-4 transition-colors',
                      isAdded && 'bg-z-green/5',
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-z-border bg-z-bg">
                      {cover ? (
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-z-text-hint">
                          ?
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-z-text">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-xs text-z-text-muted">
                        Código do produto:{' '}
                        {product.barcode ?? product.sku ?? '-'}
                      </p>
                      <p className="text-xs text-z-text-muted">
                        Estoque:{' '}
                        {product.stock != null ? `${product.stock} un.` : 'Ilimitado'}
                      </p>
                      <p className="text-xs text-z-text-muted">
                        Preço:{' '}
                        <strong className="text-z-text">{formatMoney(price)}</strong>
                      </p>
                    </div>

                    {/* Quantity + Add */}
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="flex items-center overflow-hidden rounded-lg border border-z-border">
                        <button
                          type="button"
                          onClick={() => setQty(product.id, qty - 1)}
                          className="flex h-9 w-9 items-center justify-center text-z-text-muted transition-colors hover:bg-z-bg2"
                        >
                          <HugeiconsIcon icon={MinusSignIcon} size={12} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-z-text">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(product.id, qty + 1)}
                          className="flex h-9 w-9 items-center justify-center text-z-text-muted transition-colors hover:bg-z-bg2"
                        >
                          <HugeiconsIcon icon={PlusSignIcon} size={12} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleAdd(product)}
                        className={cn(
                          'h-9 rounded-xl px-4 text-sm font-medium transition-colors',
                          isAdded
                            ? 'border border-z-green/30 bg-z-green/10 text-z-green'
                            : 'bg-z-green text-white hover:opacity-90',
                        )}
                      >
                        {isAdded ? 'Adicionado ✓' : 'Adicionar'}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-z-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-z-border px-5 py-2.5 text-sm font-medium text-z-text-muted transition-colors hover:bg-z-bg2"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={addedCount === 0}
            onClick={handleConfirm}
            className="rounded-xl bg-z-text px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
          >
            Adicionar produtos
          </button>
        </div>
      </div>
    </div>
  )
}
