import { createBrowserClient } from '@/lib/supabase'
import type { AdminPlatformStats, AdminStoreRow, AdminStoreDetail } from '../types'

export async function getPlatformStats(): Promise<AdminPlatformStats> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.rpc('admin_get_platform_stats')
  if (error) throw error
  return data as AdminPlatformStats
}

export async function getStoresList(): Promise<AdminStoreRow[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.rpc('admin_get_stores_list')
  if (error) throw error
  return (data ?? []) as AdminStoreRow[]
}

export async function getStoreDetail(storeId: string): Promise<AdminStoreDetail> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.rpc('admin_get_store_detail', { p_store_id: storeId })
  if (error) throw error
  return data as AdminStoreDetail
}
