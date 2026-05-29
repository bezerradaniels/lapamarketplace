import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui'
import { HugeiconsIcon } from '@hugeicons/react'
import { HeartCheckIcon } from '@hugeicons/core-free-icons'
import { ROUTES } from '@/config/routes'

type FooterLink =
  | { kind: 'route'; label: string; id: string; to: string }
  | { kind: 'external'; label: string; id: string; href: string }

const links: FooterLink[] = [
  { kind: 'route', label: 'Termos de uso', id: 'lp-footer-link-terms', to: ROUTES.terms },
  { kind: 'route', label: 'Privacidade', id: 'lp-footer-link-privacy', to: ROUTES.privacy },
  {
    kind: 'external',
    label: 'Contato',
    id: 'lp-footer-link-contact',
    href: 'mailto:contato@lapamarketplace.com.br',
  },
]

export function MarketingFooter() {
  return (
    <footer className="bg-[#e2e8f0] px-8 py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <Logo variant="verde" height={47} />
        <div className="flex flex-wrap gap-6">
          {links.map((l) =>
            l.kind === 'route' ? (
              <Link
                key={l.label}
                id={l.id}
                to={l.to}
                className="text-[13px] font-medium text-slate-600 transition-colors hover:text-slate-950"
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.label}
                id={l.id}
                href={l.href}
                className="text-[13px] font-medium text-slate-600 transition-colors hover:text-slate-950"
              >
                {l.label}
              </a>
            ),
          )}
          <button
            type="button"
            id="lp-footer-link-cookies"
            className="bg-transparent text-[13px] font-medium text-slate-600 transition-colors hover:text-slate-950"
            onClick={() => window.dispatchEvent(new CustomEvent('lapa:cookie-consent-open'))}
          >
            Cookies
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <span>© 2026 Lapa Marketplace · Feito com</span>
          <HugeiconsIcon icon={HeartCheckIcon} size={14} className="text-z-primary" />
          <span>no Brasil</span>
        </div>
      </div>
    </footer>
  )
}
