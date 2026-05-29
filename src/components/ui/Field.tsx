import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from './Label'
import { Input, type InputProps } from './Input'

export interface FieldProps extends InputProps {
  label?: string
  error?: string
  hint?: string
  containerClassName?: string
}

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, hint, containerClassName, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <Input
          id={inputId}
          ref={ref}
          aria-invalid={!!error || undefined}
          {...props}
        />
        {error ? (
          <span className="text-xs text-destructive">{error}</span>
        ) : hint ? (
          <span className="text-xs text-z-text-hint">{hint}</span>
        ) : null}
      </div>
    )
  },
)
Field.displayName = 'Field'
