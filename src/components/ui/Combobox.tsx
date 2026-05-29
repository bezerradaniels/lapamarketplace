import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export type ComboboxOption = {
  value: string
  label: string
}

type ComboboxProps = {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  className?: string
  emptyMessage?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  loading,
  className,
  emptyMessage = 'Nenhum resultado encontrado',
}: ComboboxProps) {
  const selectedLabel = options.find((o) => o.value === value)?.label ?? ''
  const [query, setQuery] = useState(selectedLabel)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered =
    query.trim().length === 0
      ? []
      : options
          .filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 12)

  // Sync display label when `value` changes externally. Done during render
  // (not in an effect) to avoid an extra render pass and a dependency on the
  // `options` array identity.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setQuery(selectedLabel)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        // Restore label if user typed something invalid
        const found = options.find((o) => o.value === value)
        setQuery(found?.label ?? '')
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [value, options])

  const select = (option: ComboboxOption) => {
    onChange(option.value)
    setQuery(option.label)
    setOpen(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setQuery(next)
    setOpen(true)
    setHighlighted(0)
    if (next === '') onChange('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[highlighted]) select(filtered[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => {
          if (query.trim().length > 0) setOpen(true)
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={loading ? 'Carregando...' : placeholder}
        autoComplete="off"
        className={cn(
          'h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm outline-none',
          'placeholder:text-z-text-hint focus:border-z-green',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      />

      {open && !loading && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-lg border border-z-border bg-white shadow-md">
          {filtered.length === 0 ? (
            <li className="px-3.5 py-2.5 text-sm text-z-text-hint">{emptyMessage}</li>
          ) : (
            filtered.map((option, i) => (
              <li
                key={option.value}
                onMouseDown={() => select(option)}
                className={cn(
                  'cursor-pointer px-3.5 py-2.5 text-sm',
                  i === highlighted
                    ? 'bg-z-green/10 text-z-text'
                    : 'text-z-text hover:bg-z-bg',
                )}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
