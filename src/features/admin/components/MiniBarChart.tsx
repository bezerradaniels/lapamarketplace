type DataPoint = { label: string; value: number }

type Props = {
  data: DataPoint[]
  color?: string
  formatValue?: (v: number) => string
  height?: number
}

export function MiniBarChart({ data, color = '#10b981', formatValue, height = 140 }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        Sem dados
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.value), 1)
  const barWidth = Math.max(24, Math.floor(400 / data.length) - 6)

  return (
    <div className="flex items-end gap-1.5 overflow-x-auto pb-2" style={{ height }}>
      {data.map((d) => {
        const pct = d.value / max
        const barH = Math.max(4, Math.round(pct * (height - 36)))
        return (
          <div key={d.label} className="group flex flex-col items-center gap-1">
            <span className="hidden text-[10px] font-medium text-gray-500 group-hover:block">
              {formatValue ? formatValue(d.value) : d.value}
            </span>
            <div
              className="rounded-t-sm transition-all"
              style={{ width: barWidth, height: barH, backgroundColor: color, opacity: 0.85 }}
              title={`${d.label}: ${formatValue ? formatValue(d.value) : d.value}`}
            />
            <span className="max-w-[40px] truncate text-center text-[9px] text-gray-400">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}
