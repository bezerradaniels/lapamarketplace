import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { track } from '@/features/analytics'
import { couponsKeys } from '../api/keys'
import { listCoupons } from '../api/queries'
import {
  createCoupon,
  deleteCoupon,
  recordCouponUsage,
  updateCoupon,
  type UpsertCouponInput,
} from '../api/mutations'

export function useCoupons(storeId: string | undefined) {
  return useQuery({
    queryKey: storeId ? couponsKeys.list(storeId) : couponsKeys.all,
    queryFn: () => listCoupons(storeId!),
    enabled: !!storeId,
  })
}

export function useCreateCoupon(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertCouponInput) => createCoupon(storeId, input),
    onSuccess: (coupon) => {
      track('coupon_created', {
        store_id: storeId,
        coupon_id: coupon.id,
        coupon_code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      })
      qc.invalidateQueries({ queryKey: couponsKeys.list(storeId) })
    },
  })
}

export function useUpdateCoupon(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<UpsertCouponInput> }) =>
      updateCoupon(id, input),
    onSuccess: (coupon) => {
      track('coupon_updated', { store_id: storeId, coupon_id: coupon.id })
      qc.invalidateQueries({ queryKey: couponsKeys.list(storeId) })
    },
  })
}

export function useDeleteCoupon(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: (_data, id) => {
      track('coupon_deleted', { store_id: storeId, coupon_id: id })
      qc.invalidateQueries({ queryKey: couponsKeys.list(storeId) })
    },
  })
}

export { recordCouponUsage }
