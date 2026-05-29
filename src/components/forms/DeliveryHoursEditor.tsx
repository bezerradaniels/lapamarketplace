import type { DeliverySlot } from '@/types/domain'

const DAY_OPTIONS = [
  { value: 'all', label: 'Todos os dias' },
  { value: 'weekdays', label: 'De segunda a sexta' },
  { value: 'weekends', label: 'Sábados e domingos' },
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
]

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4)
  const m = (i % 4) * 15
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

type Props = {
  value: DeliverySlot[]
  onChange: (value: DeliverySlot[]) => void
}

export function DeliveryHoursEditor({ value, onChange }: Props) {
  const update = (index: number, field: keyof DeliverySlot, val: string) => {
    const next = value.map((slot, i) => (i === index ? { ...slot, [field]: val } : slot))
    onChange(next)
  }

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const add = () => {
    onChange([...value, { days: 'all', start: '08:00', end: '18:00' }])
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((slot, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={slot.days}
                onChange={(e) => update(index, 'days', e.target.value)}
                className="h-10 flex-1 rounded-lg border border-z-border bg-white px-2.5 text-sm text-z-text outline-none focus:border-z-green"
              >
                {DAY_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>

              <select
                value={slot.start}
                onChange={(e) => update(index, 'start', e.target.value)}
                className="h-10 w-[84px] rounded-lg border border-z-border bg-white px-2 text-sm text-z-text outline-none focus:border-z-green"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <span className="shrink-0 text-sm text-z-text-muted">a</span>

              <select
                value={slot.end}
                onChange={(e) => update(index, 'end', e.target.value)}
                className="h-10 w-[84px] rounded-lg border border-z-border bg-white px-2 text-sm text-z-text outline-none focus:border-z-green"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => remove(index)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-z-text-hint transition-colors hover:bg-z-primary/10 hover:text-z-primary"
                aria-label="Remover horário"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-z-green hover:underline"
      >
        + Adicionar horário
      </button>
    </div>
  )
}
