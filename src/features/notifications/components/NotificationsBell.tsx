import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  BellDotIcon,
  InvoiceIcon,
  CreditCardIcon,
  PackageIcon,
  UserMultipleIcon,
  DiscountTagIcon,
} from '@hugeicons/core-free-icons'
import {
  useNotifications,
  useUnreadCount,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '../hooks/useNotifications'
import { cn } from '@/lib/utils'
import type { Notification, NotificationType } from '@/types/domain'

const TYPE_ICON: Record<NotificationType, IconSvgElement> = {
  order_new: InvoiceIcon,
  payment_failed: CreditCardIcon,
  low_stock: PackageIcon,
  seller_added: UserMultipleIcon,
  subscription_event: DiscountTagIcon,
}

const TYPE_TINT: Record<NotificationType, string> = {
  order_new: 'bg-z-green/12 text-z-green',
  payment_failed: 'bg-rose-100 text-rose-700',
  low_stock: 'bg-amber-100 text-amber-700',
  seller_added: 'bg-z-lilac text-z-lilac-fg',
  subscription_event: 'bg-sky-100 text-sky-700',
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'agora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `há ${days} d`
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
  }).format(new Date(iso))
}

export function NotificationsBell({ storeId }: { storeId: string | undefined }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const unread = useUnreadCount(storeId)
  const list = useNotifications(open ? storeId : undefined)
  const markOne = useMarkNotificationRead(storeId)
  const markAll = useMarkAllNotificationsRead(storeId)

  // Close on click-outside.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  const count = unread.data ?? 0

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={count > 0 ? `${count} notificações não lidas` : 'Notificações'}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-z-border text-z-text-muted hover:bg-z-bg2"
      >
        <HugeiconsIcon icon={BellDotIcon} size={16} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-z-green px-1 text-[10px] font-bold text-white tabular-nums">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-[360px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-z-border bg-white shadow-z-lg">
          <header className="flex items-center justify-between border-b border-z-border px-4 py-3">
            <div className="text-sm font-bold">Notificações</div>
            {count > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="text-xs font-medium text-z-green hover:underline disabled:opacity-60"
              >
                Marcar todas como lidas
              </button>
            )}
          </header>

          <div className="max-h-[420px] overflow-y-auto">
            {list.isLoading ? (
              <p className="px-4 py-8 text-center text-sm text-z-text-muted">
                Carregando...
              </p>
            ) : !list.data || list.data.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-z-text-muted">
                Nenhuma notificação ainda.
              </p>
            ) : (
              <ul className="divide-y divide-z-border">
                {list.data.map((n) => (
                  <NotificationItem
                    key={n.id}
                    n={n}
                    onClick={(notification) => {
                      if (!notification.read_at) {
                        markOne.mutate(notification.id)
                      }
                      setOpen(false)
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({
  n,
  onClick,
}: {
  n: Notification
  onClick: (n: Notification) => void
}) {
  const navigate = useNavigate()
  const Icon = TYPE_ICON[n.type] ?? BellDotIcon
  const tint = TYPE_TINT[n.type] ?? 'bg-z-bg2 text-z-text-muted'

  const handleClick = () => {
    onClick(n)
    if (n.link) navigate(n.link)
  }

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-z-bg2/50',
          !n.read_at && 'bg-z-bg2/30',
        )}
      >
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            tint,
          )}
        >
          <HugeiconsIcon icon={Icon} size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-z-text">{n.title}</span>
            {!n.read_at && (
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-z-green"
                aria-label="Não lida"
              />
            )}
          </div>
          {n.body && (
            <p className="mt-0.5 truncate text-xs text-z-text-muted">{n.body}</p>
          )}
          <p className="mt-1 text-[11px] text-z-text-hint">
            {timeAgo(n.created_at)}
          </p>
        </div>
      </button>
    </li>
  )
}
