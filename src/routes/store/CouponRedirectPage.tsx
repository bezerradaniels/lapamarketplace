import { useEffect, useState } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { createBrowserClient } from '@/lib/supabase'
import { buildStorePath } from '@/lib/tenant'
import type { Store } from '@/types/domain'

export default function CouponRedirectPage() {
  const { slug } = useParams<{ slug: string }>()
  const store = useOutletContext<Store>()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const homePath = buildStorePath(store.slug)

  useEffect(() => {
    async function lookupCoupon() {
      if (!slug || !store) return

      try {
        const supabase = createBrowserClient()
        const { data, error: lookupError } = await supabase
          .from('store_coupons')
          .select('code, is_active')
          .eq('store_id', store.id)
          .eq('custom_url', slug.toLowerCase())
          .single()

        if (lookupError || !data) {
          setError('Cupom não encontrado')
          setTimeout(() => navigate(homePath), 3000)
          return
        }

        if (!data.is_active) {
          setError('Este cupom não está ativo')
          setTimeout(() => navigate(homePath), 3000)
          return
        }

        // Redirect to cart with coupon code in URL
        navigate(`${buildStorePath(store.slug, 'carrinho')}?coupon=${data.code}`)
      } catch {
        setError('Erro ao buscar cupom')
        setTimeout(() => navigate(homePath), 3000)
      }
    }

    lookupCoupon()
  }, [slug, store, navigate, homePath])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      {error ? (
        <div className="text-center">
          <p className="text-lg text-z-text-muted">{error}</p>
          <p className="mt-2 text-sm text-z-text-hint">
            Redirecionando para a loja...
          </p>
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-z-border border-t-z-green" />
          <p className="text-sm text-z-text-muted">Carregando cupom...</p>
        </div>
      )}
    </div>
  )
}
