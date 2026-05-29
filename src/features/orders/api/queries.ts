import { createBrowserClient } from '@/lib/supabase'
import type { Order, OrderItem, OrderWithItems } from '@/types/domain'

export async function listOrdersForStore(storeId: string): Promise<Order[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Order[]
}

export async function getOrderById(id: string): Promise<OrderWithItems | null> {
  const supabase = createBrowserClient()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (orderError) throw orderError
  if (!order) return null

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id)
    .order('created_at', { ascending: true })

  if (itemsError) throw itemsError

  return { ...(order as Order), items: (items ?? []) as OrderItem[] }
}
