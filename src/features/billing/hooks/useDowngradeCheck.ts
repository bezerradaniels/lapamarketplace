import { useMemo } from 'react'
import { useProducts } from '@/features/products'
import { PLANS } from '@/config/plans'
import type { PlanId } from '@/types/domain'

export type DowngradeCheckResult = {
  needsProductSelection: boolean
  currentCount: number
  newLimit: number | null
  isLoading: boolean
}

export function useDowngradeCheck(
  storeId: string | undefined,
  currentPlanId: PlanId | null,
  targetPlanId: PlanId | null,
): DowngradeCheckResult {
  const products = useProducts(storeId)

  return useMemo<DowngradeCheckResult>(() => {
    if (!currentPlanId || !targetPlanId || currentPlanId === targetPlanId) {
      return { needsProductSelection: false, currentCount: 0, newLimit: null, isLoading: false }
    }

    const currentPlan = PLANS[currentPlanId]
    const targetPlan = PLANS[targetPlanId]

    // Only check if moving to a more restrictive product limit
    const targetLimit = targetPlan.maxProducts
    const currentLimit = currentPlan.maxProducts

    // Not a downgrade in terms of products
    if (targetLimit === null) {
      return { needsProductSelection: false, currentCount: 0, newLimit: null, isLoading: products.isLoading }
    }
    if (currentLimit !== null && targetLimit >= currentLimit) {
      return { needsProductSelection: false, currentCount: 0, newLimit: targetLimit, isLoading: products.isLoading }
    }

    const activeProducts = (products.data ?? []).filter((p) => p.is_active && !p.deleted_at)
    const currentCount = activeProducts.length

    return {
      needsProductSelection: currentCount > targetLimit,
      currentCount,
      newLimit: targetLimit,
      isLoading: products.isLoading,
    }
  }, [currentPlanId, targetPlanId, products.data, products.isLoading])
}
