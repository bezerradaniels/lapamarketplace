import { type ReactNode, useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ShoppingBagIcon,
  ShareIcon,
  InformationCircleIcon,
  StoreLocationIcon,
  BankIcon,
  CashIcon,
  CreditCardIcon,
  CopyLinkIcon,
  TruckDeliveryIcon,
  DeliveryBoxIcon,
  HotelBellIcon,
  MailIcon,
  CallIcon,
  MapPinIcon,
  SecurityCheckIcon,
  GoogleIcon,
  Edit01Icon,
  EyeIcon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { buildStorePath, buildStoreUrl, useCurrentStore, useActiveStore } from '@/lib/tenant'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { useCartStore } from '@/features/cart'
import { useStoreCatalogStatus, canAccessCatalog } from '@/features/billing'
import { useSession } from '@/features/auth'
import { fromE164BR } from '@/lib/br'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { OwnerSidebarMenu } from '@/components/layout/OwnerSidebarMenu'
import { ROUTES } from '@/config/routes'
import type { Store, PaymentMethod, ShippingMethod } from '@/types/domain'
import { OwnerModeContext } from './storeOwnerMode'

const SHOW_HERO_PATHS = new Set(['/'])

function GtmScript({ gtmId }: { gtmId: string }) {
  useEffect(() => {
    const consentKey = 'lapa_cookie_consent'
    let idleId: number | undefined
    let timerId: number | undefined
    const scriptId = `gtm-${gtmId}`
    const load = () => {
      if (document.getElementById(scriptId)) return
      try {
        if (window.localStorage.getItem(consentKey) !== 'accepted') return
      } catch {
        return
      }
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
      const script = document.createElement('script')
      script.id = scriptId
      script.async = true
      script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`
      document.head.appendChild(script)
    }
    const schedule = () => {
      try {
        if (window.localStorage.getItem(consentKey) !== 'accepted') return
      } catch {
        return
      }
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(load, { timeout: 3500 })
        return
      }
      timerId = globalThis.setTimeout(load, 2500)
    }
    window.addEventListener('load', schedule, { once: true })
    window.addEventListener('lapa:cookie-consent-accepted', schedule)
    ;['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
      window.addEventListener(eventName, load, { once: true, passive: true })
    })
    return () => {
      window.removeEventListener('load', schedule)
      window.removeEventListener('lapa:cookie-consent-accepted', schedule)
      ;['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
        window.removeEventListener(eventName, load)
      })
      if (idleId) window.cancelIdleCallback(idleId)
      if (timerId) window.clearTimeout(timerId)
      document.getElementById(scriptId)?.remove()
    }
  }, [gtmId])
  return null
}

export default function StoreLayout() {
  const { data: store, isLoading, slug } = useCurrentStore()
  const catalogStatus = useStoreCatalogStatus(store?.id)
  const location = useLocation()
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0),
  )
  const scopeToStore = useCartStore((s) => s.scopeToStore)

  useEffect(() => {
    if (store?.id) scopeToStore(store.id)
  }, [store?.id, scopeToStore])
  const { session } = useSession()
  const { store: activeStore } = useActiveStore()
  const [ownerMode, setOwnerMode] = useState<'visitor' | 'lojista'>('lojista')

  const isOwner = !!(
    session &&
    activeStore &&
    store &&
    activeStore.slug === store.slug
  )

  if (isLoading || (store && catalogStatus.isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-z-bg text-sm text-z-text-muted">
        Carregando...
      </div>
    )
  }

  if (!store) {
    return (
      <UnavailableScreen
        title="Loja indisponível"
        message={
          slug
            ? `Não encontramos a loja "${slug}".`
            : 'Esta loja está temporariamente indisponível.'
        }
      />
    )
  }

  if (!canAccessCatalog(catalogStatus.data)) {
    const expired = catalogStatus.data?.status === 'trialing'
    return (
      <UnavailableScreen
        title="Loja indisponível"
        message={
          expired
            ? 'O período de avaliação desta loja terminou. Em breve estaremos de volta.'
            : 'Esta loja está temporariamente indisponível. Por favor, tente novamente mais tarde.'
        }
      />
    )
  }

  const showHero = SHOW_HERO_PATHS.has(
    location.pathname.replace(buildStorePath(store.slug), '') || '/',
  )
  const storeRoute = location.pathname.replace(buildStorePath(store.slug), '') || '/'
  const hideFloatingCartRoutes = new Set(['/carrinho', '/checkout'])
  const showFloatingCart = cartCount > 0 && !hideFloatingCartRoutes.has(storeRoute)

  return (
    <OwnerModeContext.Provider value={{ isOwner, ownerMode }}>
      <div
        className="flex min-h-screen flex-col bg-z-bg"
        style={
          {
            ['--store-primary' as string]: store.primary_color,
          } as React.CSSProperties
        }
      >
        {store.gtm_id && <GtmScript gtmId={store.gtm_id} />}
        <StoreHeader store={store} cartCount={cartCount} isOwner={isOwner} ownerMode={ownerMode} />
        {showHero && <StoreHero store={store} isOwner={isOwner} ownerMode={ownerMode} />}
        <main className="flex-1">
          <Outlet context={store} />
        </main>
        <StoreFooter store={store} isOwner={isOwner} ownerMode={ownerMode} />
        {showFloatingCart && (
          <FloatingCartButton count={cartCount} storeSlug={store.slug} />
        )}
        {isOwner && (
          <OwnerFloatingBar
            ownerMode={ownerMode}
            offsetForCart={showFloatingCart}
            onToggle={() =>
              setOwnerMode((m) => (m === 'lojista' ? 'visitor' : 'lojista'))
            }
          />
        )}
      </div>
    </OwnerModeContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

function StoreHeader({
  store,
  cartCount,
  isOwner,
  ownerMode,
}: {
  store: Store
  cartCount: number
  isOwner: boolean
  ownerMode: 'visitor' | 'lojista'
}) {
  const navigate = useNavigate()
  const homePath = buildStorePath(store.slug)
  const aboutPath = buildStorePath(store.slug, 'sobre')
  const cartPath = buildStorePath(store.slug, 'carrinho')
  const showEditOverlays = isOwner && ownerMode === 'lojista'
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const logoSize = isScrolled ? 28 : 55

  return (
    <header
      className="sticky top-0 z-30 transition-all duration-300"
      style={{
        background: 'var(--store-primary)',
        boxShadow: isScrolled ? '0 2px 12px rgba(15, 23, 42, 0.10)' : 'none',
      }}
    >
      <div
        className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 transition-all duration-300"
        style={{ height: isScrolled ? 64 : 80 }}
      >
        <div className="relative flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
          <Link to={homePath} className="flex min-w-0 flex-1 items-center gap-2 text-white sm:gap-2.5">
            <div
              className="relative shrink-0 overflow-hidden rounded-md bg-white/10 ring-1 ring-white/30 transition-all duration-300"
              style={{ width: logoSize, height: logoSize }}
            >
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  fetchPriority="high"
                  decoding="async"
                  className="object-cover transition-all duration-300"
                  style={{ width: logoSize, height: logoSize }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white">
                  <HugeiconsIcon icon={StoreLocationIcon} size={isScrolled ? 16 : 32} />
                </div>
              )}
            </div>
            <span className="truncate text-[15px] font-semibold tracking-tight sm:text-base">
              {store.name}
            </span>
          </Link>
          {showEditOverlays && (
            <button
              type="button"
              onClick={() => navigate(ROUTES.dashboardCatalog)}
              title="Editar logo"
              className="absolute left-14 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/10 hover:bg-z-bg2"
            >
              <HugeiconsIcon icon={Edit01Icon} size={10} className="text-z-ink" />
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <HeaderAction
            to={aboutPath}
            icon={InformationCircleIcon}
            label="Sobre"
            showLabel
          />
          <ShareButton store={store} />
          <Link
            to={cartPath}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 active:bg-white/30 sm:w-auto sm:px-3"
            aria-label="Carrinho"
          >
            <HugeiconsIcon icon={ShoppingBagIcon} size={16} />
            {cartCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold tabular-nums text-white animate-pulse sm:static sm:ml-1.5 sm:h-5 sm:min-w-5 sm:text-[11px]"
              >
                {cartCount}
              </span>
            )}
          </Link>
          {isOwner && (
            <OwnerSidebarMenu
              storeSlug={store.slug}
              triggerClassName="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 active:bg-white/30"
            />
          )}
        </div>
      </div>
    </header>
  )
}

function HeaderAction({
  to,
  icon,
  label,
  showLabel,
  onClick,
}: {
  to?: string
  icon: IconSvgElement
  label: string
  showLabel?: boolean
  onClick?: () => void
}) {
  // Mobile: 36×36 icon-only pill. Desktop (≥ sm): grows to show the label.
  const className =
    'flex h-9 w-9 items-center justify-center gap-1.5 rounded-full bg-white/15 text-[13px] font-medium text-white transition-colors hover:bg-white/25 active:bg-white/30 sm:w-auto sm:px-3'

  const content = (
    <>
      <HugeiconsIcon icon={icon} size={14} />
      {showLabel && <span className="hidden sm:inline">{label}</span>}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={className} aria-label={label}>
        {content}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className} aria-label={label}>
      {content}
    </button>
  )
}

function ShareButton({ store }: { store: Store }) {
  const handleShare = async () => {
    const url = buildStoreUrl(store.slug)
    const data = { title: store.name, text: store.slogan ?? store.name, url }
    try {
      if (navigator.share) {
        await navigator.share(data)
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado!')
    } catch {
      // user cancelled — silent
    }
  }
  return (
    <HeaderAction icon={ShareIcon} label="Compartilhar" showLabel onClick={handleShare} />
  )
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

function StoreHero({
  store,
  isOwner,
  ownerMode,
}: {
  store: Store
  isOwner: boolean
  ownerMode: 'visitor' | 'lojista'
}) {
  const showEditOverlays = isOwner && ownerMode === 'lojista'

  if (store.banner_url) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
        <div className="relative w-full overflow-hidden rounded-2xl bg-z-bg2" style={{ aspectRatio: '16/10', maxHeight: '480px' }}>
          <OptimizedImage
            src={store.banner_url}
            transform={{ width: 1400, quality: 85 }}
            alt={store.name}
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
          />
          {showEditOverlays && (
            <Link
              to={ROUTES.dashboardCatalog}
              className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-semibold text-z-ink shadow-sm ring-1 ring-black/10 backdrop-blur-sm hover:bg-white"
            >
              <HugeiconsIcon icon={Edit01Icon} size={12} />
              Editar banner
            </Link>
          )}
        </div>
      </div>
    )
  }
  // Fallback: subtle illustrative pattern using the store's primary color.
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
      <div
        className="relative h-40 w-full overflow-hidden rounded-2xl sm:h-48"
        style={{
          background: 'var(--store-primary)',
        }}
      >
        {/* Discreet pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
        {/* Abstract gradient shapes */}
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        
        {/* Small business illustration */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 120 120"
            fill="none"
            className="h-24 w-24 opacity-20 sm:h-32 sm:w-32"
          >
            {/* Storefront building */}
            <rect x="30" y="45" width="60" height="50" rx="2" fill="white" />
            {/* Roof/awning */}
            <path d="M25 45 L35 35 L85 35 L95 45" fill="white" />
            <rect x="25" y="42" width="70" height="6" fill="white" opacity="0.7" />
            {/* Door */}
            <rect x="50" y="65" width="20" height="30" rx="1" fill="currentColor" opacity="0.3" />
            {/* Windows */}
            <rect x="35" y="55" width="12" height="12" rx="1" fill="currentColor" opacity="0.2" />
            <rect x="73" y="55" width="12" height="12" rx="1" fill="currentColor" opacity="0.2" />
            {/* Door handle */}
            <circle cx="66" cy="82" r="2" fill="currentColor" opacity="0.4" />
            {/* Awning stripes */}
            <rect x="30" y="42" width="8" height="6" fill="currentColor" opacity="0.15" />
            <rect x="42" y="42" width="8" height="6" fill="currentColor" opacity="0.15" />
            <rect x="54" y="42" width="8" height="6" fill="currentColor" opacity="0.15" />
            <rect x="66" y="42" width="8" height="6" fill="currentColor" opacity="0.15" />
            <rect x="78" y="42" width="8" height="6" fill="currentColor" opacity="0.15" />
          </svg>
        </div>
        {showEditOverlays && (
          <Link
            to={ROUTES.dashboardCatalog}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-sm ring-1 ring-white/30 hover:bg-white/30"
          >
            <HugeiconsIcon icon={Edit01Icon} size={12} />
            Adicionar banner
          </Link>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

const PAYMENT_METHOD_MAP: Record<PaymentMethod, { icon: IconSvgElement; label: string }> = {
  cash:         { icon: CashIcon,       label: 'Dinheiro' },
  bank_transfer:{ icon: BankIcon,       label: 'Transferência bancária' },
  credit_card:  { icon: CreditCardIcon, label: 'Cartão de crédito' },
  debit_card:   { icon: CreditCardIcon, label: 'Cartão de débito' },
  pix:          { icon: BankIcon,       label: 'PIX' },
  boleto:       { icon: BankIcon,       label: 'Boleto' },
  payment_link: { icon: CopyLinkIcon,   label: 'Link de pagamento' },
}

const DAY_LABEL: Record<string, string> = {
  all:      'Todos os dias',
  weekdays: 'Seg–Sex',
  weekends: 'Sáb–Dom',
  monday:   'Segunda',
  tuesday:  'Terça',
  wednesday:'Quarta',
  thursday: 'Quinta',
  friday:   'Sexta',
  saturday: 'Sábado',
  sunday:   'Domingo',
}

const SHIPPING_METHOD_MAP: Record<ShippingMethod, { icon: IconSvgElement; label: string }> = {
  delivery:       { icon: TruckDeliveryIcon, label: 'Entrega em domicílio' },
  pickup_in_store:{ icon: DeliveryBoxIcon,   label: 'Retirada na loja' },
  room_service:   { icon: HotelBellIcon,     label: 'Serviço de Quarto' },
  digital:        { icon: DeliveryBoxIcon,   label: 'Entrega digital' },
}

function StoreFooter({
  store,
  isOwner,
  ownerMode,
}: {
  store: Store
  isOwner: boolean
  ownerMode: 'visitor' | 'lojista'
}) {
  const showEditOverlays = isOwner && ownerMode === 'lojista'
  const whatsappLink = store.whatsapp_phone
    ? buildWhatsAppLink(
        store.whatsapp_phone,
        `Olá! Vim do catálogo da ${store.name}.`,
      )
    : null

  return (
    <footer className="border-t border-z-border bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 sm:gap-8 sm:px-6 sm:py-10 lg:grid-cols-4">
        <FooterColumn title="Formas de pagamento">
          {(store.accepted_payment_methods?.length
            ? store.accepted_payment_methods
            : ['cash', 'pix', 'credit_card', 'debit_card']
          ).map((method) => {
            const m = PAYMENT_METHOD_MAP[method as PaymentMethod]
            if (!m) return null
            return <FooterRow key={method} icon={m.icon} label={m.label} />
          })}
        </FooterColumn>

        <FooterColumn title="Formas de entrega">
          {(store.accepted_shipping_methods?.length
            ? store.accepted_shipping_methods
            : ['delivery', 'pickup_in_store']
          ).map((method) => {
            const m = SHIPPING_METHOD_MAP[method as ShippingMethod]
            if (!m) return null
            return <FooterRow key={method} icon={m.icon} label={m.label} />
          })}
          {store.delivery_hours?.length > 0 && (
            <>
              <div className="my-1 border-t border-z-border" />
              <span className="text-[13px] font-semibold text-z-text">
                Horários de atendimento
              </span>
              {store.delivery_hours.map((slot, i) => (
                <div key={i} className="flex items-center gap-2 text-[13px] text-z-text-muted">
                  <HugeiconsIcon icon={Clock01Icon} size={15} className="shrink-0 text-z-text-hint" />
                  <span>{DAY_LABEL[slot.days] ?? slot.days} · {slot.start}–{slot.end}</span>
                </div>
              ))}
            </>
          )}
        </FooterColumn>

        <FooterColumn title="Contato">
          {store.contact_email && (
            <FooterRow
              icon={MailIcon}
              label={store.contact_email}
              href={`mailto:${store.contact_email}`}
            />
          )}
          {store.whatsapp_phone && (
            <FooterRow
              icon={CallIcon}
              label={fromE164BR(store.whatsapp_phone)}
              href={whatsappLink ?? undefined}
            />
          )}
          {store.address_city && store.address_state ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[13px] text-z-text-muted">
                <HugeiconsIcon icon={MapPinIcon} size={15} className="shrink-0 text-z-text-hint" />
                <span className="truncate">{store.address_city} - {store.address_state}</span>
              </div>
              {store.address_neighborhood && (
                <div className="pl-[23px] text-[13px] text-z-text-muted">
                  <span>Bairro:</span> {store.address_neighborhood}
                </div>
              )}
              {store.address_street && (
                <div className="pl-[23px] text-[13px] text-z-text-muted">
                  <span>Endereço:</span>{' '}
                  {store.address_street}{store.address_number && `, N° ${store.address_number}`}
                  {store.address_complement && ` - ${store.address_complement}`}
                </div>
              )}
            </div>
          ) : (
            <FooterRow icon={MapPinIcon} label="Endereço em breve" muted />
          )}
        </FooterColumn>

        <FooterColumn title="Segurança">
          <div className="flex items-center gap-3">
            <SecurityBadge
              icon={SecurityCheckIcon}
              top="SITE"
              bottom="SEGURO"
              tone="green"
            />
            <SecurityBadge
              icon={GoogleIcon}
              top="Google"
              bottom="Safe Browsing"
              tone="neutral"
            />
          </div>
          <p className="mt-2 text-[11px] leading-snug text-z-text-hint">
            Seus dados são protegidos por SSL 256 bits e enviados via WhatsApp.
          </p>
        </FooterColumn>
      </div>

      {showEditOverlays && (
        <div className="border-t border-z-border/50 bg-z-bg px-5 py-3 text-center">
          <Link
            to={ROUTES.dashboardCatalog}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-z-green hover:underline"
          >
            <HugeiconsIcon icon={Edit01Icon} size={13} />
            Editar informações da loja
          </Link>
        </div>
      )}

      <div className="border-t border-z-border px-5 py-4 text-center text-[11px] text-z-text-hint">
        @{new Date().getFullYear()} {store.name}. Todos os direitos reservados.
        {' · '}
        <span>
          Powered by <span className="font-semibold text-z-green">Lapa Marketplace</span>
        </span>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div>
      <h3 className="mb-3 text-[13px] font-semibold text-z-text">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function FooterRow({
  icon,
  label,
  href,
  muted,
}: {
  icon: IconSvgElement
  label: string
  href?: string
  muted?: boolean
}) {
  const className = `flex items-center gap-2 text-[13px] ${
    muted ? 'text-z-text-hint' : 'text-z-text-muted'
  }`
  const inner = (
    <>
      <HugeiconsIcon
        icon={icon}
        size={15}
        className="shrink-0 text-z-text-hint"
      />
      <span className="truncate">{label}</span>
    </>
  )
  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel="noopener noreferrer"
        className={`${className} hover:text-z-text`}
      >
        {inner}
      </a>
    )
  }
  return <div className={className}>{inner}</div>
}

function SecurityBadge({
  icon,
  top,
  bottom,
  tone,
}: {
  icon: IconSvgElement
  top: string
  bottom: string
  tone: 'green' | 'neutral'
}) {
  const accent = tone === 'green' ? 'text-z-green' : 'text-z-text-muted'
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-z-border bg-white px-2 py-1.5">
      <HugeiconsIcon icon={icon} size={20} className={accent} />
      <div className="leading-tight">
        <div className="text-[9px] font-bold uppercase tracking-wider text-z-text-hint">
          {top}
        </div>
        <div className={`text-[10px] font-bold uppercase tracking-wider ${accent}`}>
          {bottom}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Owner floating toolbar                                                     */
/* -------------------------------------------------------------------------- */

function FloatingCartButton({
  count,
  storeSlug,
}: {
  count: number
  storeSlug: string
}) {
  return (
    <Link
      to={buildStorePath(storeSlug, 'carrinho')}
      aria-label={`Abrir carrinho com ${count} ${count === 1 ? 'produto' : 'produtos'}`}
      className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg ring-4 ring-white/70 transition-all duration-200 hover:scale-105 active:scale-95 sm:right-6"
      style={{ background: 'var(--store-primary)' }}
    >
      <HugeiconsIcon icon={ShoppingBagIcon} size={24} />
      <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold tabular-nums text-white ring-2 ring-white">
        {count > 99 ? '99+' : count}
      </span>
    </Link>
  )
}

function OwnerFloatingBar({
  ownerMode,
  offsetForCart,
  onToggle,
}: {
  ownerMode: 'visitor' | 'lojista'
  offsetForCart: boolean
  onToggle: () => void
}) {
  const isLojista = ownerMode === 'lojista'

  return (
    <div
      className={`fixed right-4 z-40 sm:right-6 ${
        offsetForCart ? 'bottom-24' : 'bottom-6'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        title={isLojista ? 'Acessar como visitante' : 'Acessar como lojista'}
        className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold shadow-lg transition-all duration-200 hover:opacity-90 active:scale-95 ${
          isLojista
            ? 'bg-z-green text-white ring-2 ring-z-green/30'
            : 'bg-white text-z-text ring-1 ring-z-border'
        }`}
      >
        <HugeiconsIcon
          icon={isLojista ? StoreLocationIcon : EyeIcon}
          size={16}
          className="shrink-0"
        />
        {isLojista ? 'Modo lojista' : 'Modo visitante'}
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Unavailable screen                                                         */
/* -------------------------------------------------------------------------- */

function UnavailableScreen({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-z-bg p-6">
      <div className="max-w-sm text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-z-bg2 text-z-text-hint">
          <HugeiconsIcon icon={StoreLocationIcon} size={32} />
        </div>
        <h1 className="mb-2 text-xl font-bold tracking-tighter">{title}</h1>
        <p className="text-sm text-z-text-muted">{message}</p>
        <p className="mt-6 text-xs text-z-text-hint">
          Powered by <span className="font-semibold text-z-green">Lapa Marketplace</span>
        </p>
      </div>
    </div>
  )
}
