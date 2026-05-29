import { forwardRef, useEffect, useRef, useState } from 'react'
import { formatMoney } from '@/lib/format'

type Props = {
  /** Initial value in cents. Updates from outside re-sync when the value changes externally. */
  valueInCents?: number | null
  /** Emits the integer cents value (or null when empty + allowEmpty). */
  onChange: (cents: number | null) => void
  /** When true, an empty input emits null. Otherwise it emits 0. */
  allowEmpty?: boolean
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
  inputMode?: 'numeric' | 'decimal'
  autoFocus?: boolean
  onBlur?: React.FocusEventHandler<HTMLInputElement>
}

/**
 * Banking-style money input: each typed digit pushes right-to-left.
 * Typing "1" → "R$ 0,01", typing "12" → "R$ 0,12", "1234" → "R$ 12,34".
 * Backspace removes the rightmost digit.
 */
export const MoneyInput = forwardRef<HTMLInputElement, Props>(function MoneyInput(
  {
    valueInCents,
    onChange,
    allowEmpty,
    placeholder = 'R$ 0,00',
    className,
    id,
    disabled,
    inputMode = 'numeric',
    autoFocus,
    onBlur,
  },
  ref,
) {
  const lastEmittedRef = useRef<number | null>(
    valueInCents ?? (allowEmpty ? null : 0),
  )
  const [text, setText] = useState<string>(() =>
    valueInCents != null && valueInCents > 0 ? formatMoney(valueInCents) : '',
  )

  // Sync text when external value changes (e.g. resets / loads from server)
  useEffect(() => {
    const norm = valueInCents ?? (allowEmpty ? null : 0)
    if (norm !== lastEmittedRef.current) {
      lastEmittedRef.current = norm
      setText(norm != null && norm > 0 ? formatMoney(norm) : '')
    }
  }, [valueInCents, allowEmpty])

  const handleChange = (raw: string) => {
    // Keep digits only — banking style fills cents from the right.
    const digits = raw.replace(/\D/g, '').replace(/^0+/, '')
    if (!digits) {
      setText('')
      const next = allowEmpty ? null : 0
      lastEmittedRef.current = next
      onChange(next)
      return
    }
    // Cap at 12 digits → up to R$ 9.999.999.999,99 (avoids overflow).
    const capped = digits.slice(0, 12)
    const cents = parseInt(capped, 10)
    setText(formatMoney(cents))
    lastEmittedRef.current = cents
    onChange(cents)
  }

  return (
    <input
      ref={ref}
      id={id}
      type="text"
      inputMode={inputMode}
      placeholder={placeholder}
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      autoFocus={autoFocus}
      className={className}
    />
  )
})
