import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { CookieIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui'
import { ROUTES } from '@/config/routes'

const COOKIE_CONSENT_KEY = 'lapa_cookie_consent'

type CookieConsent = 'accepted' | 'rejected'

function shouldShowCookieBanner() {
  try {
    const consent = window.localStorage.getItem(COOKIE_CONSENT_KEY)
    return consent !== 'accepted' && consent !== 'rejected'
  } catch {
    return true
  }
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => shouldShowCookieBanner())

  useEffect(() => {
    setVisible(shouldShowCookieBanner())
    const openPreferences = () => setVisible(true)
    window.addEventListener('lapa:cookie-consent-open', openPreferences)
    return () => {
      window.removeEventListener('lapa:cookie-consent-open', openPreferences)
    }
  }, [])

  const saveConsent = (consent: CookieConsent) => {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, consent)
    } catch {
      // Browsers can block storage; the choice still applies for this session.
    }
    if (consent === 'accepted') {
      window.dispatchEvent(new CustomEvent('lapa:cookie-consent-accepted'))
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <section
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[100] mx-auto max-h-[calc(100dvh-1.5rem)] max-w-4xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 text-slate-700 shadow-sm md:inset-x-4 md:bottom-6 md:flex md:items-center md:gap-4 md:p-5"
    >
      <div className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-z-primary md:mb-0">
        <HugeiconsIcon icon={CookieIcon} size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold text-z-text">Cookies no Lapa Marketplace</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Usamos cookies essenciais para manter o site funcionando e, com sua permissao,
          cookies de analise para melhorar a experiencia. Voce pode aceitar ou recusar
          os cookies nao essenciais.
          {' '}
          <Link to={ROUTES.privacy} className="font-semibold text-z-primary hover:underline">
            Saiba mais
          </Link>
          .
        </p>
      </div>
      <div className="mt-4 flex shrink-0 flex-col gap-2 sm:flex-row md:mt-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="border border-slate-300 bg-white text-slate-700 hover:text-slate-950"
          onClick={() => saveConsent('rejected')}
        >
          Recusar
        </Button>
        <Button type="button" size="sm" onClick={() => saveConsent('accepted')}>
          Aceitar
        </Button>
      </div>
    </section>
  )
}
