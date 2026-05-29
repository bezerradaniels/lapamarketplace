import { createBrowserClient } from '@/lib/supabase'
import type { Customer } from '../types'

export async function listCustomersForStore(storeId: string): Promise<Customer[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Customer[]
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Customer
}
