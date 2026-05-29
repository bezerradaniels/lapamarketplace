import { Fragment } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '@/features/auth'
import { useMyStores } from '@/features/catalog'
import { loadOnboardingSession } from '@/features/onboarding/utils/onboardingSession'
import { ROUTES } from '@/config/routes'
import { Logo } from '@/components/ui'
import { cn } from '@/lib/utils'

const STEPS = [
  { path: ROUTES.onboardingStep1, label: 'Sua loja' },
  { path: ROUTES.onboardingStep2, label: 'Sobre o negócio' },
  { path: ROUTES.onboardingStep3, label: 'Pagamento e entrega' },
  { path: ROUTES.onboardingStep4, label: 'Visual' },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center">
        {STEPS.map((step, i) => (
          <Fragment key={step.path}>
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors',
                i + 1 < current
                  ? 'border-z-green bg-z-green text-white'
                  : i + 1 === current
                    ? 'border-z-green bg-white text-z-green'
                    : 'border-z-border bg-z-border text-z-text-hint',
              )}
            >
              {i + 1 < current ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-10 transition-colors sm:w-16',
                  i + 1 < current ? 'bg-z-green' : 'bg-z-border',
                )}
              />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

export default function OnboardingLayout() {
  const { session, isLoading } = useSession()
  const myStores = useMyStores(!!session)
  const location = useLocation()

  if (isLoading || myStores.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-z-bg text-sm text-z-text-muted">
        Carregando...
      </div>
    )
  }

  if (!session) return <Navigate to={ROUTES.login} replace />

  // Redirect to dashboard only if user already has a store AND there's no
  // active onboarding session (which means they're mid-flow after step 1).
  const hasActiveSession = !!loadOnboardingSession()
  if (!hasActiveSession && myStores.data && myStores.data.length > 0) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  const currentStep = STEPS.findIndex((s) => location.pathname === s.path) + 1

  return (
    <div className="flex min-h-screen flex-col bg-z-bg">
      <header className="flex justify-center px-4 py-6">
        <Logo height={62} />
      </header>

      <div className="mx-auto w-full max-w-lg px-4 pb-16">
        {currentStep > 0 && (
          <div className="mb-8">
            <StepIndicator current={currentStep} />
          </div>
        )}
        <Outlet />
      </div>
    </div>
  )
}
