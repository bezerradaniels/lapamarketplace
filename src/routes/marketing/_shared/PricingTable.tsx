import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon, StarIcon } from '@hugeicons/core-free-icons'
import { Badge, BillingToggle, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { PLANS, TRIAL_DAYS } from '@/config/plans'
import { formatMoney } from '@/lib/format/money'
import { ROUTES } from '@/config/routes'

type PlanCard = {
  id: 'basico' | 'pro' | 'premium'
  tone: 'neutral' | 'lime' | 'lilac'
  features: string[]
  highlight?: boolean
}

const cards: PlanCard[] = [
  {
    id: 'basico',
    tone: 'neutral',
    features: [
      'Até 10 produtos',
      '0 vendedores',
      '1 cupom de desconto',
      'Catálogo online',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'pro',
    tone: 'lime',
    features: [
      'Até 100 produtos',
      '3 vendedores',
      '5 cupons de desconto',
      'IA integrada (Gemini)',
      'PDF do catálogo',
      'Tema personalizado',
      'Suporte prioritário',
    ],
    highlight: true,
  },
  {
    id: 'premium',
    tone: 'lilac',
    features: [
      'Produtos ilimitados',
      'Vendedores ilimitados',
      'Cupons ilimitados',
      '4 produtos em destaque',
      'IA avançada',
      'Tema personalizado',
      'PDF do catálogo',
      'Suporte prioritário',
    ],
  },
]

export function PricingTable() {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly')

  return (
    <div>
      <div className="mb-8 flex justify-center">
        <BillingToggle value={period} onChange={setPeriod} />
      </div>
    <div className="grid gap-5 md:grid-cols-3">
      {cards.map((card) => {
        const plan = PLANS[card.id]
        const highlight = card.highlight
        return (
          <div
            key={card.id}
            className={cn(
              'relative rounded-2xl bg-white p-7 transition-all',
              highlight
                ? 'border-2 border-z-ink shadow-z-pop md:-translate-y-2'
                : 'border border-z-border',
            )}
          >
            {highlight && (
              <div className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-z-ink px-4 py-1 text-[11px] font-bold text-z-lime">
                <HugeiconsIcon icon={StarIcon} size={12} />
                Mais popular
              </div>
            )}
            <Badge tone={card.tone}>{plan.name}</Badge>
            <div className="mt-4">
              <span className="text-4xl font-extrabold tracking-tighter">
                {period === 'annual'
                  ? formatMoney(Math.round(plan.priceInCentsAnnual / 12))
                  : formatMoney(plan.priceInCents)}
              </span>
              <span className="ml-1 text-sm text-z-text-muted">/mês</span>
            </div>
            {period === 'annual' && (
              <p className="mt-0.5 text-xs font-medium text-z-green">
                {formatMoney(plan.priceInCentsAnnual)}/ano
              </p>
            )}
            <p className="mt-1 text-xs text-z-text-hint">
              + {TRIAL_DAYS} dias grátis
            </p>
            <ul className="mt-6 flex flex-col gap-2.5">
              {card.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-z-text-muted"
                >
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    size={16}
                    className="shrink-0 text-z-green"
                    strokeWidth={2.5}
                  />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              asChild
              variant={highlight ? 'primary' : 'ghost'}
              fullWidth
              className="mt-7"
            >
              <Link id={`lp-pricing-btn-${card.id}`} to={`${ROUTES.signup}?period=${period}&plan=${card.id}`}>Começar grátis</Link>
            </Button>
          </div>
        )
      })}
    </div>
    </div>
  )
}
