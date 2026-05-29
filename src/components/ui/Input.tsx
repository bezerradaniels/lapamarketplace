import * as React from 'react'
import { cn } from '@/lib/utils'

import { HugeiconsIcon } from '@hugeicons/react'
import { ViewIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isPassword = type === 'password'
    const finalType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type={finalType}
          className={cn(
            'flex h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm outline-none transition-colors',
            'placeholder:text-z-text-hint',
            'focus:border-z-green focus:ring-0',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isPassword && 'pr-11',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-z-text-hint hover:text-z-text focus:outline-none"
            tabIndex={-1}
          >
            <HugeiconsIcon
              icon={showPassword ? ViewOffSlashIcon : ViewIcon}
              size={18}
            />
          </button>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
