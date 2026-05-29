import { createBrowserClient } from '@/lib/supabase'
import type { Notification } from '@/types/domain'

const DEFAULT_LIMIT = 20

export async function listNotifications(
  storeId: string,
  limit = DEFAULT_LIMIT,
): Promise<Notification[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as Notification[]
}

export async function getUnreadCount(storeId: string): Promise<number> {
  const supabase = createBrowserClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .is('read_at', null)

  if (error) throw error
  return count ?? 0
}
