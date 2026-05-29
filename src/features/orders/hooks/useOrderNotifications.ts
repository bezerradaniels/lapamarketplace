import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createBrowserClient } from '@/lib/supabase'
import { formatMoney } from '@/lib/format'
import { ROUTES } from '@/config/routes'
import { ordersKeys } from '../api/keys'
import type { Order } from '@/types/domain'

/**
 * Subscribes to live INSERT events on `orders` for the given store and:
 *   - invalidates the React Query cache so the orders list refreshes
 *   - shows a toast with a link to /dashboard/pedidos
 *
 * Mount once at the dashboard shell level (`DashboardLayout`).
 *
 * The first payload after channel subscription is suppressed to avoid spamming
 * the user when they navigate to the dashboard for the first time after a
 * realtime backlog flush.
 */
export function useOrderNotifications(storeId: string | undefined) {
  const queryClient = useQueryClient()
  // Track when the channel finished subscribing so we can ignore stale events
  // that may have buffered during connection.
  const subscribedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (!storeId) return

    const supabase = createBrowserClient()
    subscribedAtRef.current = null

    const channel = supabase
      .channel(`orders:${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          // Drop events that fired before we finished subscribing.
          if (subscribedAtRef.current === null) return

          const order = payload.new as Order
          queryClient.invalidateQueries({ queryKey: ordersKeys.list(storeId) })

          toast.success('Novo pedido recebido', {
            description: `${order.customer_name} · ${formatMoney(order.total_in_cents)}`,
            action: {
              label: 'Ver pedido',
              onClick: () => {
                window.location.assign(ROUTES.dashboardOrders)
              },
            },
          })
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          subscribedAtRef.current = Date.now()
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, queryClient])
}
