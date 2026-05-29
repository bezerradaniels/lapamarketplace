import { useMemo } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Clock01Icon,
  GiftIcon,
  ShoppingCart02Icon,
  ShoppingBasket01Icon,
} from '@hugeicons/core-free-icons'
import type { Customer } from '../types'

type Props = {
  customers: Customer[]
  onFilterChange: (filter: IntelligenceFilter) => void
  activeFilter: IntelligenceFilter | null
}

export type IntelligenceFilter =
  | 'overdue_repurchase'
  | 'birthday_this_week'
  | 'possible_repurchase'
  | 'complementary_purchases'

function isBirthdayThisWeek(birthday: string | null): boolean {
  if (!birthday) return false
  const [dayStr, monthStr] = birthday.split('/')
  const day = parseInt(dayStr, 10)
  const month = parseInt(monthStr, 10)
  if (!day || !month) return false

  const now = new Date()
  const year = now.getFullYear()
  const bday = new Date(year, month - 1, day)

  // If birthday already passed this year, check next year
  if (bday < now) bday.setFullYear(year + 1)

  const diff = (bday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 7
}

const CARDS = [
  {
    id: 'overdue_repurchase' as IntelligenceFilter,
    label: 'Com recompra em atraso',
    icon: Clock01Icon,
    bg: 'bg-orange-50',
    iconBg: 'bg-orange-400',
    count: (_customers: Customer[]) => 0, // requires purchase_recurrence logic
  },
  {
    id: 'birthday_this_week' as IntelligenceFilter,
    label: 'Com aniversário esta semana',
    icon: GiftIcon,
    bg: 'bg-rose-50',
    iconBg: 'bg-rose-400',
    count: (customers: Customer[]) =>
      customers.filter((c) => isBirthdayThisWeek(c.birthday)).length,
  },
  {
    id: 'possible_repurchase' as IntelligenceFilter,
    label: 'Com possível recompra',
    icon: ShoppingCart02Icon,
    bg: 'bg-teal-50',
    iconBg: 'bg-teal-500',
    count: (_customers: Customer[]) => 0,
  },
  {
    id: 'complementary_purchases' as IntelligenceFilter,
    label: 'Com compras complementares',
    icon: ShoppingBasket01Icon,
    bg: 'bg-violet-50',
    iconBg: 'bg-violet-500',
    count: (_customers: Customer[]) => 0,
  },
]

export function IntelligenceCards({ customers, onFilterChange, activeFilter }: Props) {
  const counts = useMemo(
    () => CARDS.map((card) => card.count(customers)),
    [customers],
  )

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARDS.map((card, i) => {
        const isActive = activeFilter === card.id
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onFilterChange(isActive ? (null as unknown as IntelligenceFilter) : card.id)}
            className={`flex flex-col gap-2 rounded-2xl border p-3 text-left transition-all sm:p-4 ${
              isActive
                ? 'border-z-green bg-z-green/5 shadow-sm'
                : 'border-z-border bg-white hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-z-text-muted leading-snug">{card.label}</p>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${card.iconBg} text-white`}
              >
                <HugeiconsIcon icon={card.icon} size={16} />
              </div>
            </div>
            <p className="text-base font-bold text-z-text sm:text-lg">
              {counts[i]} {counts[i] === 1 ? 'cliente' : 'clientes'}
            </p>
            <p className="text-xs font-medium text-z-green">Ver tudo</p>
          </button>
        )
      })}
    </div>
  )
}
