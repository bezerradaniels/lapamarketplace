import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsKeys } from '../api/keys'
import { getUnreadCount, listNotifications } from '../api/queries'
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/mutations'
import { createBrowserClient } from '@/lib/supabase'

export function useNotifications(storeId: string | undefined) {
  return useQuery({
    queryKey: storeId
      ? notificationsKeys.list(storeId)
      : notificationsKeys.all,
    queryFn: () => listNotifications(storeId!),
    enabled: !!storeId,
  })
}

export function useUnreadCount(storeId: string | undefined) {
  return useQuery({
    queryKey: storeId
      ? notificationsKeys.unread(storeId)
      : notificationsKeys.all,
    queryFn: () => getUnreadCount(storeId!),
    enabled: !!storeId,
    // Cache stays warm via realtime invalidation, but a 60s background refetch
    // keeps things sane if a websocket message is missed.
    refetchInterval: 60_000,
  })
}

export function useMarkNotificationRead(storeId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      if (!storeId) return
      qc.invalidateQueries({ queryKey: notificationsKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: notificationsKeys.unread(storeId) })
    },
  })
}

export function useMarkAllNotificationsRead(storeId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNotificationsRead(storeId!),
    onSuccess: () => {
      if (!storeId) return
      qc.invalidateQueries({ queryKey: notificationsKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: notificationsKeys.unread(storeId) })
    },
  })
}

/**
 * Subscribes to live INSERT events on `notifications` for the given store and
 * invalidates the React Query cache so the bell badge + dropdown refresh
 * automatically. Mount once at the dashboard shell level.
 */
export function useNotificationRealtime(storeId: string | undefined) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!storeId) return
    const supabase = createBrowserClient()
    const channel = supabase
      .channel(`notifications:${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `store_id=eq.${storeId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: notificationsKeys.list(storeId) })
          qc.invalidateQueries({ queryKey: notificationsKeys.unread(storeId) })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, qc])
}
