import { cn } from '@/lib/utils'

type Props = {
  value: 'monthly' | 'annual'
  onChange: (value: 'monthly' | 'annual') => void
  className?: string
}

export function BillingToggle({ value, onChange, className }: Props) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-full border border-z-border bg-z-bg p-1', className)}>
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={cn(
          'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
          value === 'monthly'
            ? 'bg-white text-z-text shadow-sm'
            : 'text-z-text-muted hover:text-z-text',
        )}
      >
        Mensal
      </button>
      <button
        type="button"
        onClick={() => onChange('annual')}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
          value === 'annual'
            ? 'bg-white text-z-text shadow-sm'
            : 'text-z-text-muted hover:text-z-text',
        )}
      >
        Anual
        <span className="rounded-full bg-z-green/10 px-1.5 py-0.5 text-[11px] font-bold text-z-green">
          até -30%
        </span>
      </button>
    </div>
  )
}
