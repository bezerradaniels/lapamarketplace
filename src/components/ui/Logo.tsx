import { cn } from '@/lib/utils'

type LogoVariant = 'ambos' | 'verde' | 'branca'

interface LogoProps {
  variant?: LogoVariant
  /** Use the white version (for dark backgrounds like the sidebar) */
  dark?: boolean
  size?: 'sm' | 'md' | 'lg'
  height?: number
  className?: string
}

const heights: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 28,
  md: 36,
  lg: 48,
}

const srcs: Record<LogoVariant, string> = {
  ambos: '/logos/lapamarket-logo.svg',
  verde: '/logos/lapamarket-logo.svg',
  branca: '/logos/lapamarket-logo-branca.svg',
}

export function Logo({ dark = false, variant, size = 'md', height: heightProp, className }: LogoProps) {
  const h = heightProp ?? heights[size]
  const src = srcs[variant ?? (dark ? 'branca' : 'ambos')]

  return (
    <img
      src={src}
      alt="Lapa Marketplace"
      height={h}
      style={{ height: h, width: 'auto' }}
      className={cn('block', className)}
    />
  )
}
