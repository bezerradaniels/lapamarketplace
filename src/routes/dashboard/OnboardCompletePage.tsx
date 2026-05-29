import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  ArrowUpRight01Icon,
  CheckmarkBadge01Icon,
  PaintBrush02Icon,
  PackageIcon,
} from '@hugeicons/core-free-icons'
import { Logo } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { buildStoreUrl, useActiveStore } from '@/lib/tenant'
import { track } from '@/features/analytics'
import { clearAllDrafts } from '@/features/onboarding/utils/onboardingDraft'
import {
  clearOnboardingSession,
  getOnboardingElapsedSeconds,
} from '@/features/onboarding/utils/onboardingSession'

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

export default function OnboardCompletePage() {
  const navigate = useNavigate()
  const { store } = useActiveStore()

  useEffect(() => {
    // Send conversion event to GTM dataLayer
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'event_onboard_complete',
      })
    }
    track('onboarding_completed', {
      total_time_seconds: getOnboardingElapsedSeconds(),
    })
    clearOnboardingSession()
    clearAllDrafts()
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-z-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-z-green/10 text-z-green">
            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={30} />
          </div>
          <h1 className="mb-2 text-xl font-semibold text-z-text">Sua loja está no ar!</h1>
          <p className="text-sm text-z-text-muted">
            O que você quer fazer agora?
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <ActionCard
            icon={PackageIcon}
            badgeIcon={Add01Icon}
            title="Adicionar primeiro produto"
            description="Cadastre fotos, preço e estoque para começar."
            onClick={() => navigate('/dashboard/produtos/novo')}
          />
          <ActionCard
            icon={PaintBrush02Icon}
            title="Personalizar catálogo"
            description="Ajuste aparência, contatos, links e configurações."
            onClick={() => navigate(ROUTES.dashboardCatalog)}
          />
          <ActionCard
            icon={ArrowUpRight01Icon}
            title="Ir para o catálogo"
            description="Veja sua loja publicada como seus clientes verão."
            onClick={() => {
              if (store?.slug) {
                window.open(buildStoreUrl(store.slug), '_blank', 'noopener,noreferrer')
              } else {
                navigate(`${ROUTES.dashboard}?welcome=1`)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

function ActionCard({
  icon,
  badgeIcon,
  title,
  description,
  onClick,
}: {
  icon: typeof PackageIcon
  badgeIcon?: typeof PackageIcon
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-lg border border-z-border bg-white p-4 text-left transition-colors hover:border-z-primary hover:bg-white"
    >
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-z-primary text-white">
        <HugeiconsIcon icon={icon} size={24} />
        {badgeIcon && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-z-green text-white">
            <HugeiconsIcon icon={badgeIcon} size={12} strokeWidth={3} />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-z-text">{title}</span>
        <span className="mt-1 block text-xs leading-snug text-z-text-muted">{description}</span>
      </span>
      <HugeiconsIcon
        icon={ArrowUpRight01Icon}
        size={18}
        className="shrink-0 text-z-text-hint transition-colors group-hover:text-z-primary"
      />
    </button>
  )
}
