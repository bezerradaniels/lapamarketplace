import { createBrowserClient } from '@/lib/supabase'
import type { Customer, CustomerSocialLink } from '../types'

export type CustomerInput = {
  name: string
  whatsapp_phone: string
  secondary_phone?: string | null
  cpf_cnpj_type: 'cpf' | 'cnpj'
  cpf_cnpj?: string | null
  birthday?: string | null
  email?: string | null
  website?: string | null
  social_links?: CustomerSocialLink[]
  avatar_url?: string | null
  profile_notes?: string | null
  seller_id?: string | null
  tags?: string[]
  category_interests?: string[]
  product_interests?: string[]
}

export async function createCustomer(
  storeId: string,
  input: CustomerInput,
): Promise<Customer> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('customers')
    .insert({ store_id: storeId, ...input })
    .select()
    .single()

  if (error) throw error
  return data as Customer
}

export async function updateCustomer(
  id: string,
  input: Partial<CustomerInput>,
): Promise<Customer> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('customers')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Customer
}

export async function deleteCustomer(id: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
}

export async function deleteAllCustomers(storeId: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase.from('customers').delete().eq('store_id', storeId)
  if (error) throw error
}
