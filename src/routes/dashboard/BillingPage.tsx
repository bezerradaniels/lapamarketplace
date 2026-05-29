import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Tick02Icon,
  CreditCardIcon,
  InvoiceIcon,
  ArrowRightIcon,
} from '@hugeicons/core-free-icons'
import { Badge, BillingToggle, Button } from '@/components/ui'
import {
  useInvoices,
  usePlanFeatures,
  useSubscription,
  useStartCheckout,
  useOpenPortal,
  useDowngradeCheck,
  trialDaysLeft,
  DowngradeProductSelector,
} from '@/features/billing'
import { useProducts } from '@/features/products'
import { useActiveStore } from '@/lib/tenant'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PLANS, TRIAL_DAYS } from '@/config/plans'
import type { PlanId, SubscriptionStatus } from '@/types/domain'

const PLAN_FEATURE_TEXT: Record<PlanId, string[]> = {
  basico: [
    'Até 10 produtos',
    '0 vendedores',
    '1 cupom de desconto',
    'Catálogo público',
    'Pedidos via WhatsApp',
  ],
  pro: [
    'Até 100 produtos',
    '3 vendedores',
    '5 cupons de desconto',
    'Exportação em PDF',
    'Suporte presencial',
  ],
  premium: [
    'Produtos ilimitados',
    'Vendedores ilimitados',
    'Cupons ilimitados',
    '4 produtos em destaque',
    'Exportação em PDF',
    'Suporte presencial',
  ],
}

const PLAN_SUBTITLE: Record<PlanId, string> = {
  basico: 'Mais flexibilidade',
  pro: 'Crescimento avançado',
  premium: 'Crescimento sem limites',
}

const STATUS_TONE: Record<
  SubscriptionStatus,
  { tone: React.ComponentProps<typeof Badge>['tone']; label: string }
> = {
  none: { tone: 'neutral', label: 'Sem assinatura' },
  trialing: { tone: 'lilac', label: 'Trial' },
  active: { tone: 'green', label: 'Ativa' },
  past_due: { tone: 'amber', label: 'Pagamento pendente' },
  canceled: { tone: 'rose', label: 'Cancelada' },
  unpaid: { tone: 'rose', label: 'Inadimplente' },
  incomplete: { tone: 'amber', label: 'Incompleta' },
  incomplete_expired: { tone: 'rose', label: 'Expirada' },
  paused: { tone: 'neutral', label: 'Pausada' },
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
  }).format(new Date(iso))
}

export default function BillingPage() {
  const { store } = useActiveStore()
  const subscription = useSubscription(store?.id)
  const plans = usePlanFeatures()
  const invoices = useInvoices(store?.id)

  const sub = subscription.data
  const status = sub?.status ?? 'none'
  const statusUi = STATUS_TONE[status]
  const days = trialDaysLeft(
    sub
      ? { status: sub.status, trial_ends_at: sub.trial_ends_at }
      : null,
  )
  const isTrial = status === 'trialing'
  const planList = plans.data ?? []
  const currentPlanId = sub?.plan_id ?? null

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual')
  const [pendingPlanId, setPendingPlanId] = useState<PlanId | null>(null)
  const startCheckout = useStartCheckout()
  const openPortal = useOpenPortal()
  const products = useProducts(store?.id)
  const downgradeCheck = useDowngradeCheck(store?.id, currentPlanId, pendingPlanId)

  const proceedToCheckout = (planId: PlanId) => {
    if (!store) return
    startCheckout.mutate({ storeId: store.id, planId, billingPeriod })
    setPendingPlanId(null)
  }

  const handleStartCheckout = (planId: PlanId) => {
    if (!store) return
    // Check if this is a downgrade that requires product selection
    if (downgradeCheck.needsProductSelection && planId === pendingPlanId) return
    setPendingPlanId(planId)
    const check = { ...downgradeCheck }
    // Re-evaluate synchronously with the target plan
    const PLANS_CONFIG = { basico: 10, pro: 100, premium: null } as const
    const targetLimit = PLANS_CONFIG[planId] ?? null
    const activeCount = (products.data ?? []).filter((p) => p.is_active && !p.deleted_at).length
    if (targetLimit !== null && activeCount > targetLimit) {
      // Show the selector modal
      return
    }
    // No excess — go straight to checkout
    proceedToCheckout(planId)
    void check
  }

  const handleOpenPortal = () => {
    if (!store) return
    openPortal.mutate(store.id)
  }

  const isPending = startCheckout.isPending || openPortal.isPending

  const activeProducts = (products.data ?? []).filter((p) => p.is_active && !p.deleted_at)
  const showDowngradeModal = pendingPlanId !== null && (() => {
    const PLANS_CONFIG = { basico: 10, pro: 100, premium: null } as const
    const targetLimit = PLANS_CONFIG[pendingPlanId] ?? null
    return targetLimit !== null && activeProducts.length > targetLimit
  })()

  return (
    <>
    {showDowngradeModal && pendingPlanId && (
      <DowngradeProductSelector
        storeId={store!.id}
        activeProducts={activeProducts}
        newLimit={({ basico: 10, pro: 100, premium: Infinity } as const)[pendingPlanId] as number}
        onConfirm={() => proceedToCheckout(pendingPlanId)}
        onCancel={() => setPendingPlanId(null)}
      />
    )}
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[22px] font-bold tracking-tighter">Assinatura</h1>
        <p className="text-sm text-z-text-muted">
          Gerencie seu plano, métodos de pagamento e notas fiscais.
        </p>
      </header>

      {/* Current state */}
      <div className="flex flex-col gap-4 rounded-2xl border border-z-border bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge tone={statusUi.tone}>{statusUi.label}</Badge>
            {isTrial && days !== null && (
              <span className="text-sm text-z-text-muted">
                Termina em <strong className="text-z-text">{days} dia{days === 1 ? '' : 's'}</strong>
              </span>
            )}
            {!isTrial && sub?.current_period_end && (
              <span className="text-sm text-z-text-muted">
                {sub.cancel_at_period_end ? 'Encerra em' : 'Próxima cobrança em'}{' '}
                <strong className="text-z-text">
                  {formatDate(sub.current_period_end)}
                </strong>
              </span>
            )}
          </div>
          <div className="text-lg font-semibold">
            Plano atual:{' '}
            <span className="text-z-green">
              {planList.find((p) => p.plan_id === currentPlanId)?.name ?? '—'}
            </span>
          </div>
          <div className="text-sm text-z-text-muted">
            {isTrial
              ? 'Adicione um método de pagamento para continuar após o trial.'
              : status === 'active'
                ? 'Sua assinatura está em dia.'
                : 'Reative sua assinatura para voltar a publicar o catálogo.'}
          </div>
        </div>
        {sub?.stripe_customer_id ? (
          <Button onClick={handleOpenPortal} disabled={isPending}>
            <HugeiconsIcon icon={CreditCardIcon} size={16} />
            {openPortal.isPending ? 'Abrindo...' : 'Gerenciar cobranças'}
          </Button>
        ) : (
          <Button
            onClick={() => handleStartCheckout(currentPlanId ?? 'pro')}
            disabled={isPending}
          >
            <HugeiconsIcon icon={CreditCardIcon} size={16} />
            {startCheckout.isPending
              ? 'Redirecionando...'
              : 'Adicionar método de pagamento'}
          </Button>
        )}
      </div>

      {/* Plans */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Planos</h2>
        <BillingToggle value={billingPeriod} onChange={setBillingPeriod} />
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        {plans.isLoading ? (
          <div className="text-sm text-z-text-muted md:col-span-3">
            Carregando planos...
          </div>
        ) : (
          planList.map((plan) => {
            const isCurrent = plan.plan_id === currentPlanId
            const features = PLAN_FEATURE_TEXT[plan.plan_id]
            return (
              <div
                key={plan.plan_id}
                className={cn(
                  'flex flex-col gap-4 rounded-2xl border bg-white p-6',
                  isCurrent
                    ? 'border-z-green ring-2 ring-z-green/20'
                    : 'border-z-border',
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-black">
                      Plano {plan.name}
                    </h2>
                    {billingPeriod === 'annual' && (
                      <span className="rounded-full bg-z-green/10 px-2 py-0.5 text-[11px] font-bold text-z-green">
                        -{Math.round((PLANS[plan.plan_id].priceInCents * 12 - PLANS[plan.plan_id].priceInCentsAnnual) / (PLANS[plan.plan_id].priceInCents * 12) * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-z-text-muted">
                    {PLAN_SUBTITLE[plan.plan_id]}
                  </p>
                  {isCurrent && <Badge tone="green" className="mt-2 inline-block">Atual</Badge>}
                </div>
                <div>
                  <span className="text-3xl font-bold tracking-tighter">
                    {billingPeriod === 'annual'
                      ? formatMoney(Math.round(PLANS[plan.plan_id].priceInCentsAnnual / 12))
                      : formatMoney(plan.price_in_cents)}
                  </span>
                  <span className="text-sm text-z-text-muted">/mês</span>
                  <p className="mt-1 text-xs text-z-text-hint">
                    + {TRIAL_DAYS} dias grátis
                  </p>
                  {billingPeriod === 'annual' && (
                    <>
                      <p className="mt-0.5 text-xs font-semibold text-z-green">
                        Economize {formatMoney(plan.price_in_cents * 12 - PLANS[plan.plan_id].priceInCentsAnnual)}
                      </p>
                      <p className="mt-1 text-xs font-medium text-black">
                        Pagamento único por ano {formatMoney(PLANS[plan.plan_id].priceInCentsAnnual)}
                      </p>
                    </>
                  )}
                  {billingPeriod === 'monthly' && (
                    <p className="mt-0.5 text-xs text-z-text-muted">
                      Cancele sem multa
                    </p>
                  )}
                </div>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-z-text-muted"
                    >
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={14}
                        className="mt-0.5 shrink-0 text-z-green"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? 'outline' : 'primary'}
                  fullWidth
                  disabled={isCurrent || isPending}
                  onClick={() => handleStartCheckout(plan.plan_id)}
                  className={cn(!isCurrent && 'bg-green-100 text-green-800 hover:bg-green-200')}
                >
                  {isCurrent ? 'Plano atual' : 'Mudar para este plano'}
                </Button>
              </div>
            )
          })
        )}
      </section>

      {/* Invoices */}
      <section className="rounded-2xl border border-z-border bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <HugeiconsIcon icon={InvoiceIcon} size={18} />
          Notas fiscais
        </h2>
        {invoices.isLoading ? (
          <p className="text-sm text-z-text-muted">Carregando...</p>
        ) : !invoices.data || invoices.data.length === 0 ? (
          <p className="text-sm text-z-text-muted">
            Suas NFSe aparecerão aqui assim que a primeira fatura for paga.
          </p>
        ) : (
          <ul className="divide-y divide-z-border">
            {invoices.data.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    {formatMoney(inv.amount_in_cents)}
                  </div>
                  <div className="text-xs text-z-text-muted">
                    {formatDate(inv.created_at)} · {inv.status}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {inv.hosted_invoice_url && (
                    <a
                      href={inv.hosted_invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-z-green hover:underline"
                    >
                      Stripe
                    </a>
                  )}
                  {inv.nfse_url && (
                    <a
                      href={inv.nfse_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-z-green hover:underline"
                    >
                      NFSe
                      <HugeiconsIcon icon={ArrowRightIcon} size={11} />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
    </>
  )
}
