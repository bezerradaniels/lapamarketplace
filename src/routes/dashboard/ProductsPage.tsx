import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PlusSignIcon,
  PackageIcon,
  EditIcon,
  DeleteIcon,
} from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import {
  NewProductFullModal,
  useCreateProduct,
  useDeleteProduct,
  useProducts,
} from '@/features/products'
import { usePlanLimits } from '@/features/billing'
import { formatMoney } from '@/lib/format'
import { ROUTES } from '@/config/routes'
import { Badge, Button } from '@/components/ui'

export default function ProductsPage() {
  const { store } = useActiveStore()
  const products = useProducts(store?.id)
  const create = useCreateProduct(store?.id ?? '')
  const del = useDeleteProduct(store?.id ?? '')
  const limits = usePlanLimits(store?.id)
  const [newProductOpen, setNewProductOpen] = useState(false)
  const list = products.data ?? []
  const limit = limits.productLimit
  const atLimit = limit !== null && list.length >= limit

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tighter">Produtos</h1>
          <p className="text-sm text-z-text-muted">
            {list.length} {list.length === 1 ? 'produto' : 'produtos'}
            {limit !== null && (
              <>
                {' '}
                de <strong className="text-z-text">{limit}</strong> no plano{' '}
                {limits.plan?.name ?? '—'}
              </>
            )}
            .
          </p>
        </div>

        {/* Header buttons — hidden on mobile */}
        <div className="hidden items-center gap-2 sm:flex">
          {!atLimit && (
            <Button asChild variant="outline" className="hidden lg:inline-flex">
              <Link to={ROUTES.dashboardProductsBulk}>
                Adicionar em massa
              </Link>
            </Button>
          )}
          {atLimit ? (
            <Button asChild variant="outline">
              <Link to={ROUTES.dashboardBilling}>Aumentar limite</Link>
            </Button>
          ) : (
            <Button type="button" onClick={() => setNewProductOpen(true)}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              Novo produto
            </Button>
          )}
        </div>
      </header>

      {atLimit && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <span className="text-amber-900">
            Você atingiu o limite de <strong>{limit}</strong> produtos do plano{' '}
            <strong>{limits.plan?.name}</strong>. Faça upgrade para adicionar
            mais.
          </span>
          <Link
            to={ROUTES.dashboardBilling}
            className="shrink-0 text-sm font-semibold text-z-green hover:underline"
          >
            Ver planos →
          </Link>
        </div>
      )}

      {products.isLoading ? (
        <p className="text-sm text-z-text-muted">Carregando...</p>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-z-border bg-white p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-z-bg2 text-z-text-hint">
            <HugeiconsIcon icon={PackageIcon} size={26} />
          </div>
          <div className="text-base font-semibold">
            Nenhum produto cadastrado
          </div>
          <p className="max-w-sm text-sm text-z-text-muted">
            Adicione seu primeiro produto e ele aparecerá no seu catálogo público.
          </p>
          <Button type="button" onClick={() => setNewProductOpen(true)}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            Criar produto
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-z-border overflow-hidden rounded-2xl border border-z-border bg-white">
          {list.map((product) => (
            <li
              key={product.id}
              className="flex items-center gap-3 p-3 transition-colors hover:bg-z-bg2/40 sm:gap-4 sm:p-4"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-z-bg2 sm:h-14 sm:w-14">
                {product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-z-text-hint">
                    <HugeiconsIcon icon={PackageIcon} size={20} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  {product.category && (
                    <span className="rounded-md bg-z-bg2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-z-text-muted">
                      {product.category}
                    </span>
                  )}
                  {product.promo_price_in_cents != null && (
                    <Badge tone="lilac">Promo</Badge>
                  )}
                  {!product.is_active && <Badge tone="neutral">Inativo</Badge>}
                </div>
                <p className="text-sm text-z-text-muted">
                  {product.promo_price_in_cents != null ? (
                    <>
                      <span className="line-through text-z-text-hint">
                        {formatMoney(product.price_in_cents)}
                      </span>{' '}
                      <strong className="text-z-green">
                        {formatMoney(product.promo_price_in_cents)}
                      </strong>
                    </>
                  ) : (
                    formatMoney(product.price_in_cents)
                  )}
                  {product.stock !== null && ` · ${product.stock} em estoque`}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`${ROUTES.dashboardProducts}/${product.id}`}>
                    <HugeiconsIcon icon={EditIcon} size={14} />
                    <span className="hidden sm:inline">Editar</span>
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Excluir "${product.name}"?`)) {
                      del.mutate(product.id)
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-z-primary/30 bg-z-primary/10 px-2 py-1.5 text-xs font-medium text-z-primary hover:bg-z-primary/15 sm:px-3"
                >
                  <HugeiconsIcon icon={DeleteIcon} size={14} />
                  <span className="hidden sm:inline">Excluir</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Limite atingido — aviso mobile (bottom bar não leva ao billing) */}
      {atLimit && (
        <Link
          to={ROUTES.dashboardBilling}
          aria-label="Aumentar limite de produtos"
          className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95 sm:hidden"
        >
          Aumentar limite →
        </Link>
      )}

      {store && newProductOpen && (
        <NewProductFullModal
          storeId={store.id}
          storeSlug={store.slug}
          onClose={() => setNewProductOpen(false)}
          onSubmit={async (values) => {
            const created = await create.mutateAsync(values)
            return created.id
          }}
        />
      )}
    </div>
  )
}
