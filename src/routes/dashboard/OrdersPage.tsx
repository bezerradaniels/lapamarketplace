import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  InvoiceIcon,
  WhatsappIcon,
  CancelIcon,
  PlusSignIcon,
  EyeIcon,
  Delete02Icon,
  CheckmarkCircle01Icon,
  ShoppingBagCheckIcon,
} from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import {
  useOrders,
  useOrder,
  useUpdateOrderStatus,
  useDeleteOrder,
} from '@/features/orders'
import { ROUTES } from '@/config/routes'
import { formatMoney } from '@/lib/format'
import { fromE164BR } from '@/lib/br'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { OrderStatus, OrderWithItems } from '@/types/domain'

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const STATUS_TONE: Record<OrderStatus, React.ComponentProps<typeof Badge>['tone']> = {
  pending: 'amber',
  confirmed: 'lilac',
  completed: 'green',
  cancelled: 'rose',
}

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'completed', 'cancelled']

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export default function OrdersPage() {
  const { store } = useActiveStore()
  const orders = useOrders(store?.id)
  const [searchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder(store?.id)
  const orderFromSearch = searchParams.get('order')

  // Open the order referenced by the `?order=` param. Synced during render
  // (not in an effect) so it reacts to URL changes without an extra pass.
  const [prevOrderFromSearch, setPrevOrderFromSearch] = useState<string | null>(null)
  if (orderFromSearch && orderFromSearch !== prevOrderFromSearch) {
    setPrevOrderFromSearch(orderFromSearch)
    setSelectedId(orderFromSearch)
  }

  if (orders.isLoading) {
    return <p className="text-sm text-z-text-muted">Carregando...</p>
  }

  const list = orders.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold tracking-tighter">Pedidos</h1>
            <p className="text-sm text-z-text-muted">
              {list.length} {list.length === 1 ? 'pedido' : 'pedidos'}
            </p>
          </div>
          <Link
            to={ROUTES.dashboardOrdersNew}
            className="flex items-center gap-1.5 rounded-xl bg-z-green px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={14} />
            Novo pedido
          </Link>
        </header>

        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-z-border bg-white p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-z-bg2 text-z-text-hint">
              <HugeiconsIcon icon={InvoiceIcon} size={26} />
            </div>
            <div className="text-base font-semibold">Nenhum pedido ainda</div>
            <p className="max-w-sm text-sm text-z-text-muted">
              Quando um cliente finalizar o checkout, o pedido aparecerá aqui — mesmo
              que a mensagem do WhatsApp não seja enviada.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-z-border overflow-hidden rounded-2xl border border-z-border bg-white">
            {list.map((o) => {
              return (
                <li key={o.id}>
                  <div className="flex flex-col gap-3 p-4 transition-colors hover:bg-z-bg2/40 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedId(o.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="truncate font-semibold">{o.customer_name}</span>
                        <Badge tone={STATUS_TONE[o.status]}>
                          {STATUS_LABEL[o.status]}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3 text-xs text-z-text-muted sm:justify-start sm:gap-5">
                        <span>{formatDateTime(o.created_at)}</span>
                        <span className="text-sm font-bold tabular-nums text-z-text">
                          {formatMoney(o.total_in_cents)}
                        </span>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <QuickActionButton
                        label="Ver detalhes"
                        icon={EyeIcon}
                        onClick={() => setSelectedId(o.id)}
                      />
                      <QuickActionLink
                        label="Abrir WhatsApp"
                        icon={WhatsappIcon}
                        href={`https://wa.me/${o.customer_phone.replace('+', '')}`}
                      />
                      {o.status === 'pending' && (
                        <QuickActionButton
                          label="Confirmar pedido"
                          icon={CheckmarkCircle01Icon}
                          disabled={updateStatus.isPending}
                          onClick={() =>
                            updateStatus.mutate({
                              id: o.id,
                              status: 'confirmed',
                              oldStatus: o.status,
                            })
                          }
                        />
                      )}
                      {o.status !== 'completed' && o.status !== 'cancelled' && (
                        <QuickActionButton
                          label="Concluir pedido"
                          icon={ShoppingBagCheckIcon}
                          disabled={updateStatus.isPending}
                          onClick={() =>
                            updateStatus.mutate({
                              id: o.id,
                              status: 'completed',
                              oldStatus: o.status,
                            })
                          }
                        />
                      )}
                      <QuickActionButton
                        label="Excluir pedido"
                        icon={Delete02Icon}
                        tone="danger"
                        disabled={deleteOrder.isPending}
                        onClick={() => {
                          if (!confirm(`Excluir pedido de "${o.customer_name}"?`)) return
                          deleteOrder.mutate(o.id, {
                            onSuccess: () => {
                              if (selectedId === o.id) setSelectedId(null)
                            },
                          })
                        }}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {selectedId && (
        <OrderDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}

function OrderDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const order = useOrder(id)
  const updateStatus = useUpdateOrderStatus()

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-z-border bg-white shadow-xl">
        {order.isLoading ? (
          <p className="p-5 text-sm text-z-text-muted">Carregando...</p>
        ) : order.data ? (
          <OrderDetailContent
            order={order.data}
            updateStatus={updateStatus}
            onClose={onClose}
          />
        ) : (
          <div className="p-5">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Pedido não encontrado</h2>
              <CloseButton onClick={onClose} />
            </header>
            <p className="text-sm text-z-text-muted">
              Não foi possível carregar as informações do pedido.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function OrderDetailContent({
  order: o,
  updateStatus,
  onClose,
}: {
  order: OrderWithItems
  updateStatus: ReturnType<typeof useUpdateOrderStatus>
  onClose: () => void
}) {
  return (
    <div className="flex min-h-0 flex-col">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0 p-5 pb-3">
          <h2 className="truncate text-lg font-bold">{o.customer_name}</h2>
          <p className="text-xs text-z-text-muted">{formatDateTime(o.created_at)}</p>
        </div>
        <div className="p-4">
          <CloseButton onClick={onClose} />
        </div>
      </header>

      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 pb-5">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-z-text-muted">WhatsApp:</span>
            <a
              href={`https://wa.me/${o.customer_phone.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-z-green hover:underline"
            >
              <HugeiconsIcon icon={WhatsappIcon} size={14} />
              {fromE164BR(o.customer_phone)}
            </a>
          </div>
          {o.customer_notes && (
            <div className="rounded-lg bg-z-bg2 p-3">
              <div className="mb-1 text-xs font-medium text-z-text-hint">Observações</div>
              <p className="whitespace-pre-line text-sm">{o.customer_notes}</p>
            </div>
          )}
        </div>

      <div>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-z-text-hint">
          Itens
        </h3>
        <ul className="flex flex-col gap-1.5 text-sm">
          {o.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-2">
              <span className="truncate text-z-text-muted">
                {i.quantity}× {i.product_name}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatMoney(i.price_in_cents * i.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-z-border pt-3 font-bold">
          <span>Total</span>
          <span className="tabular-nums text-z-green">
            {formatMoney(o.total_in_cents)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-z-text-hint">
          Status do pedido
        </label>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              disabled={updateStatus.isPending || o.status === status}
              onClick={() =>
                updateStatus.mutate({ id: o.id, status, oldStatus: o.status })
              }
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition disabled:opacity-60',
                o.status === status
                  ? 'border-z-green bg-z-green text-white'
                  : 'border-z-border bg-white text-z-text-muted hover:bg-z-bg2',
              )}
            >
              {STATUS_LABEL[status]}
            </button>
          ))}
        </div>
      </div>
    </div>
    </div>
  )
}

function QuickActionButton({
  label,
  icon,
  tone = 'default',
  disabled,
  onClick,
}: {
  label: string
  icon: IconSvgElement
  tone?: 'default' | 'danger'
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'danger'
          ? 'border-z-primary/30 bg-z-primary/10 text-z-primary hover:bg-z-primary/15'
          : 'border-z-border bg-white text-z-text-muted hover:bg-z-bg2 hover:text-z-text',
      )}
    >
      <HugeiconsIcon icon={icon} size={16} />
    </button>
  )
}

function QuickActionLink({
  label,
  icon,
  href,
}: {
  label: string
  icon: IconSvgElement
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-z-border bg-white text-z-text-muted transition-colors hover:bg-z-bg2 hover:text-z-green"
    >
      <HugeiconsIcon icon={icon} size={16} />
    </a>
  )
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-bg2"
      aria-label="Fechar"
    >
      <HugeiconsIcon icon={CancelIcon} size={16} />
    </button>
  )
}
