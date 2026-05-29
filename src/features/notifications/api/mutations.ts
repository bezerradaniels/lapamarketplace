import { createBrowserClient } from '@/lib/supabase'

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase
    .from('notifications')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ read_at: new Date().toISOString() } as any)
    .eq('id', id)
    .is('read_at', null)
  if (error) throw error
}

export async function markAllNotificationsRead(storeId: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase
    .from('notifications')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ read_at: new Date().toISOString() } as any)
    .eq('store_id', storeId)
    .is('read_at', null)
  if (error) throw error
}
