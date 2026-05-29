import { useMemo } from 'react'
import type { PlanFeatures, Subscription } from '@/types/domain'
import { useSubscription } from '../hooks/useSubscription'
import { usePlanFeatures } from '../hooks/usePlanFeatures'

export type PlanLimits = {
  /** Effective plan in use right now (subscription's plan_id, or null if no sub yet). */
  plan: PlanFeatures | null
  subscription: Subscription | null
  isLoading: boolean
  /** True when the feature is allowed under the current plan. */
  canUse: (feature: 'pdf' | 'theme' | 'ai' | 'featured' | 'gallery') => boolean
  /** Number of products allowed; null = unlimited. */
  productLimit: number | null
  /** Number of sellers allowed; null = unlimited. */
  sellerLimit: number | null
  /** Number of coupons allowed; null = unlimited. */
  couponLimit: number | null
}

/**
 * Single source of truth for plan-gated UI. Components should read from this
 * instead of hardcoding plan IDs.
 */
export function usePlanLimits(storeId: string | undefined): PlanLimits {
  const sub = useSubscription(storeId)
  const plans = usePlanFeatures()

  return useMemo<PlanLimits>(() => {
    const subscription = sub.data ?? null
    const planId = subscription?.plan_id
    const plan =
      (planId && plans.data?.find((p) => p.plan_id === planId)) ?? null

    return {
      plan,
      subscription,
      isLoading: sub.isLoading || plans.isLoading,
      canUse: (feature) => {
        if (!plan) return false
        if (feature === 'pdf') return plan.has_pdf_export
        if (feature === 'theme') return plan.has_custom_theme
        if (feature === 'ai') return plan.has_ai_helpers
        if (feature === 'featured') return plan.has_featured_products
        if (feature === 'gallery') return plan.has_gallery
        return false
      },
      productLimit: plan?.max_products ?? null,
      sellerLimit: plan?.max_sellers ?? null,
      couponLimit: plan?.max_coupons ?? null,
    }
  }, [sub.data, sub.isLoading, plans.data, plans.isLoading])
}
