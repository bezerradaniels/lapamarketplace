import { cn } from '@/lib/utils'

type Option = { value: string; label: string }

type Props = {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
}

export function RoundMultiCheck({ options, value, onChange }: Props) {
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const checked = value.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors',
              checked
                ? 'border-z-green bg-z-green/5'
                : 'border-z-border bg-white hover:border-z-ink/20',
            )}
          >
            <span
              className={cn(
                'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                checked ? 'border-z-green bg-z-green' : 'border-z-border',
              )}
            >
              {checked && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4L3.5 6.5L9 1.5"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className="text-sm font-medium text-z-text">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
