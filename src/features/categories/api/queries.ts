import { createBrowserClient } from '@/lib/supabase'
import type { Category } from '../types'

export async function listCategories(storeId: string): Promise<Category[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('store_id', storeId)
    .is('deleted_at', null)
    .order('position', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Category[]
}
