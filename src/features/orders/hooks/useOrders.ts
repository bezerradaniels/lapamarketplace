import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { track } from '@/features/analytics'
import type { OrderStatus } from '@/types/domain'
import { listOrdersForStore, getOrderById } from '../api/queries'
import {
  createOrder,
  createManualOrder,
  updateOrderStatus,
  deleteOrder,
} from '../api/mutations'
import { ordersKeys } from '../api/keys'

export function useOrders(storeId: string | undefined) {
  return useQuery({
    queryKey: ordersKeys.list(storeId ?? ''),
    queryFn: () => listOrdersForStore(storeId as string),
    enabled: !!storeId,
  })
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ordersKeys.byId(id ?? ''),
    queryFn: () => getOrderById(id as string),
    enabled: !!id,
  })
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: createOrder,
    onSuccess: (order, variables) => {
      track('order_created', {
        store_id: variables.storeId,
        order_id: order.id,
        total_value: order.total_in_cents / 100,
        item_count: order.items.length,
        has_coupon: !!variables.coupon,
      })
    },
  })
}

export function useCreateManualOrder(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createManualOrder,
    onSuccess: (order) => {
      track('order_created', {
        store_id: storeId,
        order_id: order.id,
        total_value: order.total_in_cents / 100,
        item_count: order.items.length,
        has_coupon: false,
      })
      qc.invalidateQueries({ queryKey: ordersKeys.list(storeId) })
    },
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: OrderStatus
      /** Previous status, passed by the caller so we can report the transition. */
      oldStatus: OrderStatus
    }) => updateOrderStatus(id, status),
    onSuccess: (order, { oldStatus }) => {
      track('order_status_changed', {
        store_id: order.store_id,
        order_id: order.id,
        old_status: oldStatus,
        new_status: order.status,
      })
      qc.invalidateQueries({ queryKey: ordersKeys.list(order.store_id) })
      qc.invalidateQueries({ queryKey: ordersKeys.byId(order.id) })
    },
  })
}

export function useDeleteOrder(storeId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: (_data, id) => {
      if (storeId) qc.invalidateQueries({ queryKey: ordersKeys.list(storeId) })
      qc.removeQueries({ queryKey: ordersKeys.byId(id) })
    },
  })
}
