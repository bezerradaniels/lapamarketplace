import { Navigate, useNavigate } from 'react-router-dom'
import { useActiveStore } from '@/lib/tenant'
import { NewProductFullModal, useCreateProduct, useProducts } from '@/features/products'
import { usePlanLimits } from '@/features/billing'
import { ROUTES } from '@/config/routes'

export default function NewProductPage() {
  const navigate = useNavigate()
  const { store, isLoading } = useActiveStore()
  const create = useCreateProduct(store?.id ?? '')
  const products = useProducts(store?.id)
  const limits = usePlanLimits(store?.id)

  if (isLoading) {
    return <p className="text-sm text-z-text-muted">Carregando...</p>
  }
  if (!store) return <Navigate to={ROUTES.onboarding} replace />

  const count = products.data?.length ?? 0
  const limit = limits.productLimit
  const atLimit = limit !== null && count >= limit
  if (atLimit) {
    return <Navigate to={ROUTES.dashboardProducts} replace />
  }

  return (
    <NewProductFullModal
        storeId={store.id}
        storeSlug={store.slug}
        onClose={() => navigate(ROUTES.dashboardProducts)}
        onSubmit={async (values) => {
          const created = await create.mutateAsync(values)
          navigate(`/dashboard/produtos/${created.id}?published=true`)
          return created.id
        }}
      />
  )
}
