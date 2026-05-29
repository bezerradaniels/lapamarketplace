import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

interface AuthShellProps {
  children: ReactNode
  title: string
  subtitle?: ReactNode
  width?: number
  contentClassName?: string
}

export function AuthShell({
  children,
  title,
  subtitle,
  width = 420,
  contentClassName,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-z-bg p-6">
      <div
        className={cn('w-full rounded-2xl border border-z-border bg-white p-9 shadow-z', contentClassName)}
        style={{ maxWidth: width }}
      >
        <div className="mb-7 flex flex-col items-center text-center">
          <Link to={ROUTES.home} aria-label="Início">
            <Logo size="lg" />
          </Link>
          <h1 className="mt-5 text-[22px] font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-z-text-muted">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </main>
  )
}
