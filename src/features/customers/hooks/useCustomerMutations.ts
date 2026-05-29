import { useMutation, useQueryClient } from '@tanstack/react-query'
import { track } from '@/features/analytics'
import { createCustomer, updateCustomer, deleteCustomer, deleteAllCustomers } from '../api/mutations'
import { customersKeys } from '../api/keys'
import type { CustomerInput } from '../api/mutations'

export function useCreateCustomer(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CustomerInput) => createCustomer(storeId, input),
    onSuccess: (customer) => {
      track('customer_created', { store_id: storeId, customer_id: customer.id })
      qc.invalidateQueries({ queryKey: customersKeys.list(storeId) })
    },
  })
}

export function useUpdateCustomer(id: string, storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<CustomerInput>) => updateCustomer(id, input),
    onSuccess: () => {
      track('customer_updated', { store_id: storeId, customer_id: id })
      qc.invalidateQueries({ queryKey: customersKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: customersKeys.detail(id) })
    },
  })
}

export function useDeleteCustomer(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: (_data, id) => {
      track('customer_deleted', { store_id: storeId, customer_id: id })
      qc.invalidateQueries({ queryKey: customersKeys.list(storeId) })
    },
  })
}

export function useDeleteAllCustomers(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => deleteAllCustomers(storeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customersKeys.list(storeId) })
    },
  })
}
