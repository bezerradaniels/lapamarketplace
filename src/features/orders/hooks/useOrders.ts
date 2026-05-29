import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  return useMutation({ mutationFn: createOrder })
}

export function useCreateManualOrder(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createManualOrder,
    onSuccess: () => {
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
      status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
    }) => updateOrderStatus(id, status),
    onSuccess: (order) => {
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
