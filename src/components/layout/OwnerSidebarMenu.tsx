import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  HomeIcon,
  PlusSignIcon,
  PaintBrush01Icon,
  StoreLocationIcon,
  Cancel01Icon,
  Menu01Icon,
} from '@hugeicons/core-free-icons'
import { ROUTES } from '@/config/routes'
import { Logo } from '@/components/ui/Logo'
import { buildStoreUrl } from '@/lib/tenant'

type Props = {
  storeSlug?: string | null
  triggerClassName?: string
  triggerLabel?: string
}

type MenuItem = {
  icon: IconSvgElement
  label: string
  onClick: () => void
}

export function OwnerSidebarMenu({ storeSlug, triggerClassName, triggerLabel }: Props) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  function close() {
    setOpen(false)
  }

  function go(to: string) {
    close()
    navigate(to)
  }

  function visitStore() {
    close()
    if (storeSlug) {
      window.location.href = buildStoreUrl(storeSlug)
    } else {
      navigate(ROUTES.dashboard)
    }
  }

  const items: MenuItem[] = [
    { icon: HomeIcon, label: 'Ir para o dashboard', onClick: () => go(ROUTES.dashboard) },
    { icon: PlusSignIcon, label: 'Adicionar produto', onClick: () => go(ROUTES.dashboardProducts) },
    { icon: PaintBrush01Icon, label: 'Personalizar catálogo', onClick: () => go(ROUTES.dashboardCatalog) },
    { icon: StoreLocationIcon, label: 'Visitar minha loja', onClick: visitStore },
  ]

  const defaultTriggerClass =
    'flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5'

  const drawer =
    open && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[60] bg-white/35 backdrop-blur-sm"
              onClick={close}
            />

            <div
              className="fixed right-0 top-0 z-[70] flex h-screen w-72 flex-col bg-white [filter:drop-shadow(0_12px_24px_rgba(15,23,42,0.12))]"
              aria-modal="true"
              role="dialog"
            >
              <div className="flex items-center justify-between border-b border-z-border px-5 py-4">
                <Link to={ROUTES.home} onClick={close}>
                  <Logo variant="verde" />
                </Link>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-z-text-muted hover:bg-z-bg2"
                  aria-label="Fechar menu"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-1 p-4">
                {items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-z-text transition-colors hover:bg-z-bg2"
                  >
                    <HugeiconsIcon icon={item.icon} size={18} className="shrink-0 text-z-text-muted" />
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="relative overflow-hidden border-t border-z-border px-5 py-4">
                <div
                  className="sidebar-aurora pointer-events-none absolute inset-x-0 bottom-0 h-24 opacity-70 blur-xl"
                  aria-hidden="true"
                />
                <p className="relative text-[11px] text-z-text-hint">
                  Painel do lojista · <span className="font-semibold text-z-green">Lapa Marketplace</span>
                </p>
              </div>
            </div>
          </>,
          document.body,
        )
      : null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName ?? defaultTriggerClass}
        aria-label="Menu do lojista"
      >
        <HugeiconsIcon icon={Menu01Icon} size={18} />
        {triggerLabel && <span>{triggerLabel}</span>}
      </button>

      {drawer}
    </>
  )
}
