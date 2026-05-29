import { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo, Button } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { AuthContext } from '@/providers/AuthContext'

const links = [
  { id: 'how', label: 'Como funciona', href: '#como-funciona', htmlId: 'lp-nav-link-como-funciona' },
  { id: 'features', label: 'Funcionalidades', href: '#funcionalidades', htmlId: 'lp-nav-link-funcionalidades' },
  { id: 'pricing', label: 'Preços', href: '#precos', htmlId: 'lp-nav-link-precos' },
  { id: 'faq', label: 'Dúvidas', href: '#faq', htmlId: 'lp-nav-link-faq' },
]

export function MarketingNavbar() {
  const navigate = useNavigate()
  const auth = useContext(AuthContext)
  const isLoggedIn = Boolean(auth?.session)

  return (
    <nav className="sticky top-0 z-40 border-b border-z-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6 py-3">
        <Link id="lp-nav-logo" to={ROUTES.home} aria-label="Lapa Marketplace">
          <Logo variant="verde" height={58} className="h-[10px] md:h-[58px]" />
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) =>
            l.href.startsWith('#') ? (
              <a
                key={l.id}
                id={l.htmlId}
                href={l.href}
                className="text-sm font-medium text-z-text-muted transition-colors hover:text-z-text"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.id}
                id={l.htmlId}
                to={l.href}
                className="text-sm font-medium text-z-text-muted transition-colors hover:text-z-text"
              >
                {l.label}
              </Link>
            ),
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            id="lp-nav-btn-login"
            variant={isLoggedIn ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => navigate(isLoggedIn ? ROUTES.dashboard : ROUTES.login)}
          >
            {isLoggedIn ? 'Dashboard' : 'Login'}
          </Button>
          {!isLoggedIn && (
            <Button
              id="lp-nav-btn-signup"
              variant="primary"
              size="sm"
              onClick={() => navigate(ROUTES.signup)}
            >
              Teste grátis
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
