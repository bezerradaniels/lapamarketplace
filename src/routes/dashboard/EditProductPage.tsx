import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { buildStoreUrl, useActiveStore } from '@/lib/tenant'
import {
  ProductForm,
  useProduct,
  useUpdateProduct,
} from '@/features/products'
import { ROUTES } from '@/config/routes'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const justPublished = searchParams.get('published') === 'true'
  const { store, isLoading: storeLoading } = useActiveStore()
  const product = useProduct(id)
  const update = useUpdateProduct(store?.id ?? '', id ?? '')

  if (storeLoading || product.isLoading) {
    return <p className="text-sm text-z-text-muted">Carregando...</p>
  }
  if (!store) return <Navigate to={ROUTES.onboarding} replace />
  if (!product.data) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-z-text-muted">Produto não encontrado.</p>
        <Link
          to={ROUTES.dashboardProducts}
          className="text-sm font-medium text-z-green hover:underline"
        >
          Voltar
        </Link>
      </div>
    )
  }

  const p = product.data
  const initial = {
    name: p.name,
    description: p.description ?? undefined,
    category: p.category ?? undefined,
    subcategory: p.subcategory ?? undefined,
    brand: p.brand ?? undefined,
    unit: p.unit ?? undefined,
    barcode: p.barcode ?? undefined,
    barcode_type: p.barcode_type ?? null,
    sku: p.sku ?? undefined,
    auto_sku: p.auto_sku,
    condition: p.condition,
    purchase_recurrence: p.purchase_recurrence ?? null,
    has_no_brand: p.has_no_brand,
    cost_in_cents: p.cost_in_cents ?? null,
    price_in_cents: p.price_in_cents,
    promo_price_in_cents: p.promo_price_in_cents,
    is_active: p.is_active,
    stock: p.stock ?? null,
    images: p.images,
    has_variations: p.has_variations,
    variation_type: p.variation_type ?? null,
    variation_label: p.variation_label ?? null,
    variation_options: p.variation_options ?? null,
  }

  const catalogUrl = store.slug ? buildStoreUrl(store.slug) : undefined

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-2">
        <Link
          to={ROUTES.dashboardProducts}
          className="inline-flex items-center gap-1 text-sm text-z-text-muted hover:text-z-text"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={14} />
          Produtos
        </Link>
        <span className="text-z-text-hint">/</span>
        <span className="truncate max-w-xs text-sm font-medium text-z-text">
          {p.name}
        </span>
      </header>

      <ProductForm
        storeId={store.id}
        catalogUrl={catalogUrl}
        initialValues={initial}
        isSubmitting={update.isPending}
        justPublished={justPublished}
        onSubmit={async (values) => {
          await update.mutateAsync(values)
        }}
      />
    </div>
  )
}
