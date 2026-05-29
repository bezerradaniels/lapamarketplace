import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  InvoiceIcon,
  CreditCardIcon,
  PackageIcon,
  UserGroupIcon,
  ArrowRightIcon,
  Add01Icon,
  Share01Icon,
  ArrowUpRight01Icon,
  ShoppingBag03Icon,
} from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import { useOrders } from '@/features/orders'
import { useProducts } from '@/features/products'
import { useSubscription, trialDaysLeft } from '@/features/billing'
import { useCategories } from '@/features/categories'
import { useCoupons } from '@/features/coupons'
import { useSession } from '@/features/auth'
import { SetupChecklist, buildChecklistState } from '@/features/onboarding'
import { formatMoney } from '@/lib/format'
import { buildStoreUrl } from '@/lib/tenant'
import { ROUTES } from '@/config/routes'
import { Badge, Button } from '@/components/ui'
import type { Order } from '@/types/domain'
import { cn } from '@/lib/utils'

function getGreeting(): string {
  const h = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
  )
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function WelcomeModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-z-border bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-z-green/10 text-z-green">
          <HugeiconsIcon icon={ShoppingBag03Icon} size={30} />
        </div>
        <h2 className="text-xl font-bold">Sua loja está pronta!</h2>
        <p className="mt-2 text-sm text-z-text-muted">
          Agora é hora de adicionar seus primeiros produtos para que seus
          clientes possam ver e comprar.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            fullWidth
            size="lg"
            onClick={() => {
              onClose()
              navigate(ROUTES.dashboardProducts + '/novo')
            }}
          >
            <HugeiconsIcon icon={Add01Icon} size={16} />
            Adicionar primeiro produto
          </Button>
          <Button variant="ghost" fullWidth onClick={onClose}>
            Explorar o dashboard primeiro
          </Button>
        </div>
      </div>
    </div>
  )
}

function startOfTodaySP(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return new Date(`${parts}T00:00:00-03:00`)
}

function startOfMonthSP(): Date {
  const today = startOfTodaySP()
  return new Date(today.getFullYear(), today.getMonth(), 1)
}

const STATUS_LABEL: Record<Order['status'], string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const STATUS_TONE: Record<Order['status'], React.ComponentProps<typeof Badge>['tone']> = {
  pending: 'amber',
  confirmed: 'lilac',
  completed: 'green',
  cancelled: 'rose',
}

export default function HomePage() {
  const { store } = useActiveStore()
  const { session } = useSession()
  const orders = useOrders(store?.id)
  const products = useProducts(store?.id)
  const subscription = useSubscription(store?.id)
  const categories = useCategories(store?.id)
  const coupons = useCoupons(store?.id)
  const [searchParams, setSearchParams] = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(searchParams.get('welcome') === '1')

  useEffect(() => {
    if (searchParams.get('welcome') === '1') {
      setSearchParams({}, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const firstName =
    (session?.user.user_metadata?.name as string | undefined)?.split(' ')[0] ??
    store?.name?.split(' ')[0] ??
    'você'

  const sub = subscription.data
  const trialDays =
    sub && sub.status === 'trialing'
      ? trialDaysLeft({ status: sub.status, trial_ends_at: sub.trial_ends_at })
      : null

  const list = orders.data ?? []
  const todayStart = startOfTodaySP().getTime()
  const monthStart = startOfMonthSP().getTime()

  const billable = list.filter((o) => o.status !== 'cancelled')
  const todayOrders = billable.filter((o) => new Date(o.created_at).getTime() >= todayStart)
  const monthOrders = billable.filter((o) => new Date(o.created_at).getTime() >= monthStart)
  const monthRevenue = monthOrders.reduce((sum, o) => sum + o.total_in_cents, 0)
  const pendingCount = list.filter((o) => o.status === 'pending').length
  const activeProducts = (products.data ?? []).filter((p) => p.is_active).length

  const recent = list.slice(0, 5)

  const checklistState = buildChecklistState({
    hasProducts: (products.data ?? []).length > 0,
    logoUrl: store?.logo_url,
    bannerUrl: store?.banner_url,
    primaryColor: store?.primary_color,
    addressCity: store?.address_city,
    hasCategories: (categories.data ?? []).length > 0,
    hasCoupons: (coupons.data ?? []).length > 0,
  })
  const checklistLoading = products.isLoading || categories.isLoading || coupons.isLoading

  return (
    <div className="flex flex-col gap-5">
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-z-text">
          {getGreeting()}, {firstName}!
        </h1>
      </div>

      {/* Trial banner */}
      {trialDays !== null && (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 text-xs leading-relaxed text-z-text-muted sm:text-sm">
            {trialDays > 0 ? (
              <>
                Seu período de trial termina em{' '}
                <strong className="text-z-text">
                  {trialDays} dia{trialDays === 1 ? '' : 's'}
                </strong>
                . Continue aproveitando todos os recursos.
              </>
            ) : (
              <>Seu período de trial terminou. Assine para continuar.</>
            )}
          </div>
          <Button
            size="sm"
            className="h-9 shrink-0 border border-z-green bg-z-green/10 px-3 text-xs text-z-green sm:px-4 sm:text-[13px]"
            asChild
          >
            <Link to={ROUTES.dashboardBilling}>
              <HugeiconsIcon icon={CreditCardIcon} size={15} />
              Assinar agora
            </Link>
          </Button>
        </div>
      )}

      <SetupChecklist state={checklistState} loading={checklistLoading} />

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Novo produto',   icon: Add01Icon,     href: '/dashboard/produtos/novo' },
          { label: 'Ver pedidos',    icon: InvoiceIcon,   href: ROUTES.dashboardOrders },
          { label: 'Personalizar',   icon: Share01Icon,   href: ROUTES.dashboardCatalog },
          { label: 'Ver catálogo',   icon: ArrowUpRight01Icon, href: store?.slug ? buildStoreUrl(store.slug) : '#', external: true },
        ].map((action) =>
          action.external ? (
            <a
              key={action.label}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg bg-z-green px-2 py-2 text-center text-[10px] font-semibold leading-tight text-white transition-opacity hover:opacity-85 sm:aspect-auto sm:min-h-14 sm:flex-row sm:gap-2 sm:px-3 sm:py-3 sm:text-sm"
            >
              <HugeiconsIcon icon={action.icon} size={18} className="shrink-0 sm:size-4" />
              <span className="min-w-0">{action.label}</span>
            </a>
          ) : (
            <Link
              key={action.label}
              to={action.href}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg bg-z-green px-2 py-2 text-center text-[10px] font-semibold leading-tight text-white transition-opacity hover:opacity-85 sm:aspect-auto sm:min-h-14 sm:flex-row sm:gap-2 sm:px-3 sm:py-3 sm:text-sm"
            >
              <HugeiconsIcon icon={action.icon} size={18} className="shrink-0 sm:size-4" />
              <span className="min-w-0">{action.label}</span>
            </Link>
          ),
        )}
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Pedidos hoje"
          value={todayOrders.length.toString()}
          sub={pendingCount > 0 ? `${pendingCount} pendente${pendingCount === 1 ? '' : 's'}` : 'Tudo em dia'}
          icon={InvoiceIcon}
          variant="green"
        />
        <StatCard
          label="Receita do mês"
          value={formatMoney(monthRevenue)}
          sub="Exclui cancelados"
          icon={CreditCardIcon}
          variant="dark"
        />
        <StatCard
          label="Produtos ativos"
          value={activeProducts.toString()}
          sub={`${(products.data ?? []).length} no total`}
          icon={PackageIcon}
          variant="sand"
        />
        <StatCard
          label="Pedidos no mês"
          value={monthOrders.length.toString()}
          sub="Acumulado"
          icon={UserGroupIcon}
          variant="sand"
        />
      </section>

      {/* Chart + recent orders */}
      <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-2xl border border-z-border bg-white p-5">
          <div className="mb-1 text-sm font-semibold text-z-text">Pedidos — últimos 7 dias</div>
          <div className="mb-4 text-xs text-z-text-muted">
            {billable.length} pedido{billable.length === 1 ? '' : 's'} no total
          </div>
          <WeeklyBars orders={list} />
        </div>

        <div className="rounded-2xl border border-z-border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold text-z-text">Últimos pedidos</div>
            <Link
              to={ROUTES.dashboardOrders}
              className="inline-flex items-center gap-1 text-xs font-medium text-z-text-muted hover:text-z-text"
            >
              Ver todos
              <HugeiconsIcon icon={ArrowRightIcon} size={12} />
            </Link>
          </div>
          {orders.isLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-z-bg2" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-z-border py-10 text-center">
              <HugeiconsIcon icon={PackageIcon} size={32} className="text-z-text-hint" />
              <p className="text-sm text-z-text-muted">Nenhum pedido ainda.</p>
              <Link
                to={ROUTES.dashboardCatalog}
                className="text-xs font-medium text-[#0ea5e9] hover:underline"
              >
                Compartilhar catálogo →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-z-border/60">
              {recent.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{o.customer_name}</p>
                    <p className="text-xs text-z-text-muted">
                      {new Intl.DateTimeFormat('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(o.created_at))}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[13px] font-semibold tabular-nums">
                      {formatMoney(o.total_in_cents)}
                    </span>
                    <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

const STAT_VARIANTS = {
  green: {
    wrap: 'bg-white border border-z-border text-z-text',
    label: 'text-z-text-muted',
    sub: 'text-z-text-muted',
    icon: 'bg-z-green text-white',
  },
  dark: {
    wrap: 'bg-white border border-z-border text-z-text',
    label: 'text-z-text-muted',
    sub: 'text-z-text-muted',
    icon: 'bg-z-green text-white',
  },
  sand: {
    wrap: 'bg-white border border-z-border text-z-text',
    label: 'text-z-text-muted',
    sub: 'text-z-text-muted',
    icon: 'bg-z-green text-white',
  },
}

function StatCard({
  label,
  value,
  sub,
  icon,
  variant,
}: {
  label: string
  value: string
  sub?: string
  icon: IconSvgElement
  variant: keyof typeof STAT_VARIANTS
}) {
  const v = STAT_VARIANTS[variant]
  return (
    <div className={cn('flex flex-col justify-between gap-3 rounded-2xl p-4 sm:p-5', v.wrap)}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn('text-xs font-medium', v.label)}>{label}</span>
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', v.icon)}>
          <HugeiconsIcon icon={icon} size={16} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold leading-none tracking-tighter sm:text-[28px]">
          {value}
        </div>
        {sub && <div className={cn('mt-1.5 text-xs', v.sub)}>{sub}</div>}
      </div>
    </div>
  )
}

function WeeklyBars({ orders }: { orders: Order[] }) {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const today = startOfTodaySP()
  const counts = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (6 - i))
    const start = day.getTime()
    const end = start + 24 * 60 * 60 * 1000
    return orders.filter((o) => {
      if (o.status === 'cancelled') return false
      const t = new Date(o.created_at).getTime()
      return t >= start && t < end
    }).length
  })

  const labels = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (6 - i))
    const dow = day.getDay()
    return days[(dow + 6) % 7]
  })

  const max = Math.max(...counts, 1)

  return (
    <div className="flex h-28 items-end gap-1.5 px-1">
      {counts.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div
              className={cn(
              'w-full rounded-t-lg',
              i === counts.length - 1 ? 'bg-[#0ea5e9]' : 'bg-z-bg2',
            )}
            style={{ height: `${(v / max) * 88 + 4}px` }}
            title={`${v} pedido${v === 1 ? '' : 's'}`}
          />
          <span className={cn(
            'text-[10px]',
            i === counts.length - 1 ? 'font-semibold text-[#0ea5e9]' : 'text-z-text-hint',
          )}>
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  )
}
