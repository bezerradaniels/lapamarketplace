import type { ReactNode } from 'react'

type Props = {
  label: string
  value: string | number
  icon?: ReactNode
  color?: 'green' | 'blue' | 'purple' | 'amber' | 'rose' | 'default'
}

const colorMap = {
  green:   { bg: 'bg-emerald-50',  text: 'text-emerald-700',  icon: 'bg-emerald-100 text-emerald-600' },
  blue:    { bg: 'bg-sky-50',      text: 'text-sky-700',      icon: 'bg-sky-100 text-sky-600' },
  purple:  { bg: 'bg-violet-50',   text: 'text-violet-700',   icon: 'bg-violet-100 text-violet-600' },
  amber:   { bg: 'bg-amber-50',    text: 'text-amber-700',    icon: 'bg-amber-100 text-amber-600' },
  rose:    { bg: 'bg-rose-50',     text: 'text-rose-700',     icon: 'bg-rose-100 text-rose-600' },
  default: { bg: 'bg-white',       text: 'text-gray-900',     icon: 'bg-gray-100 text-gray-500' },
}

export function StatCard({ label, value, icon, color = 'default' }: Props) {
  const c = colorMap[color]
  return (
    <div className={`flex items-center gap-4 rounded-2xl border border-gray-100 ${c.bg} px-5 py-4 shadow-sm`}>
      {icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.icon}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className={`mt-0.5 text-2xl font-bold leading-none ${c.text}`}>{value}</p>
      </div>
    </div>
  )
}
