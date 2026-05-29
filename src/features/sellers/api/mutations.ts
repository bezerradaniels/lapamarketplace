import { createBrowserClient } from '@/lib/supabase'

export class SellerNotFoundError extends Error {
  constructor() {
    super('Nenhum usuário Lapa Marketplace encontrado com esse e-mail. Peça para a pessoa criar a conta primeiro.')
    this.name = 'SellerNotFoundError'
  }
}

export class NotOwnerError extends Error {
  constructor() {
    super('Apenas o dono da loja pode adicionar vendedores.')
    this.name = 'NotOwnerError'
  }
}

export async function addSellerByEmail(
  storeId: string,
  email: string,
): Promise<string> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.rpc('add_seller_by_email', {
    target_store: storeId,
    target_email: email.trim(),
  })
  if (error) {
    if (error.code === 'P0002') throw new SellerNotFoundError()
    if (error.code === '42501') throw new NotOwnerError()
    throw error
  }
  return data as string
}

export async function removeSeller(storeId: string, userId: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase
    .from('store_members')
    .delete()
    .eq('store_id', storeId)
    .eq('user_id', userId)
    .eq('role', 'seller') // never remove an owner via this path

  if (error) throw error
}
