import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { maskPhoneBR } from '@/lib/br'
import { Input } from '@/components/ui/Input'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value?: string
  defaultValue?: string
  onChange?: (masked: string) => void
}

/**
 * Input telefone BR com máscara progressiva `(DD) 9XXXX-XXXX`.
 * Emite sempre a string mascarada; use `toE164BR` antes de persistir.
 */
export const PhoneInput = forwardRef<HTMLInputElement, Props>(function PhoneInput(
  { value, defaultValue, onChange, ...rest },
  ref,
) {
  const isControlled = value !== undefined
  const [internal, setInternal] = useState(() => maskPhoneBR(defaultValue ?? ''))
  const current = isControlled ? maskPhoneBR(value ?? '') : internal

  return (
    <Input
      ref={ref}
      inputMode="tel"
      autoComplete="tel-national"
      placeholder="(11) 99999-9999"
      maxLength={16}
      value={current}
      onChange={(e) => {
        const masked = maskPhoneBR(e.target.value)
        if (!isControlled) setInternal(masked)
        onChange?.(masked)
      }}
      {...rest}
    />
  )
})
