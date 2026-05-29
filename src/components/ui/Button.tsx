import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-opacity disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-z-primary focus-visible:ring-offset-2 hover:opacity-85',
  {
    variants: {
      variant: {
        primary: 'bg-z-green text-white',
        lime: 'bg-z-lime text-z-lime-fg',
        ghost: 'bg-z-bg2 text-z-text',
        outline:
          'bg-transparent text-z-text border-[1.5px] border-z-ink',
        outlineW:
          'bg-transparent text-white border-[1.5px] border-white/50',
        whatsapp: 'bg-[#25d366] text-white',
        ink: 'bg-z-ink text-white',
        store: 'bg-store-primary text-store-primary-fg',
        link: 'bg-transparent text-z-primary hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-9 px-4 text-[13px]',
        md: 'h-10 px-5 text-sm',
        lg: 'h-12 px-7 text-base',
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

// eslint-disable-next-line react-refresh/only-export-components
export { buttonVariants }
