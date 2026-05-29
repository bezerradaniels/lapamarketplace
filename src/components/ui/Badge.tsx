import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap',
  {
    variants: {
      tone: {
        green: 'bg-z-green text-white',
        lime: 'bg-z-lime text-z-lime-fg',
        lilac: 'bg-z-lilac text-z-lilac-fg',
        neutral: 'bg-z-bg2 text-z-text-muted',
        amber: 'bg-[#fff3cd] text-[#7a5800]',
        rose: 'bg-[#ffe0e0] text-[#8b0000]',
        ink: 'bg-z-ink text-white',
        outline: 'border border-z-border bg-transparent text-z-text-muted',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, className }))} {...props} />
}
