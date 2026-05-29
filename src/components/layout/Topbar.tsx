import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  SearchIcon,
  ArrowUpRight01Icon,
  ArrowDown01Icon,
  Menu01Icon,
  User02Icon,
  Logout01Icon,
  Cancel01Icon,
  PackageIcon,
  UserGroupIcon,
  InvoiceIcon,
} from '@hugeicons/core-free-icons'
import { useSession, useSignOut } from '@/features/auth'
import { useActiveStore, buildStoreUrl } from '@/lib/tenant'
import { NotificationsBell } from '@/features/notifications'
import { ROUTES } from '@/config/routes'
import { useProducts } from '@/features/products'
import { useCustomers } from '@/features/customers'
import { useOrders } from '@/features/orders'
import { useSubscription } from '@/features/billing'
import { formatMoney } from '@/lib/format'
import { Badge } from '@/components/ui'

function initialsFrom(name?: string | null): string {
  if (!name) return 'Z'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface TopbarProps {
  onMenuToggle?: () => void
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const navigate = useNavigate()
  const { user } = useSession()
  const { store } = useActiveStore()
  const signOut = useSignOut()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const products = useProducts(store?.id)
  const customers = useCustomers(store?.id)
  const orders = useOrders(store?.id)
  const subscription = useSubscription(store?.id)

  const name = (user?.user_metadata?.name as string | undefined) ?? user?.email
  const initials = initialsFrom(name)
  const query = search.trim().toLowerCase()
  const isTrialing = subscription.data?.status === 'trialing'

  const searchResults = useMemo(() => {
    if (!query) return []

    const productResults = (products.data ?? [])
      .filter((product) =>
        [product.name, product.sku, product.category, product.brand]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      )
      .slice(0, 4)
      .map((product) => ({
        id: `product-${product.id}`,
        icon: PackageIcon,
        title: product.name,
        description: [
          product.category,
          formatMoney(product.promo_price_in_cents ?? product.price_in_cents),
        ]
          .filter(Boolean)
          .join(' · '),
        href: `${ROUTES.dashboardProducts}/${product.id}`,
      }))

    const customerResults = (customers.data ?? [])
      .filter((customer) =>
        [customer.name, customer.email, customer.whatsapp_phone, customer.secondary_phone]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      )
      .slice(0, 4)
      .map((customer) => ({
        id: `customer-${customer.id}`,
        icon: UserGroupIcon,
        title: customer.name,
        description: customer.email ?? customer.whatsapp_phone,
        href: `${ROUTES.dashboardCustomers}/${customer.id}`,
      }))

    const orderResults = (orders.data ?? [])
      .filter((order) =>
        [order.customer_name, order.customer_phone, order.coupon_code, order.id]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      )
      .slice(0, 4)
      .map((order) => ({
        id: `order-${order.id}`,
        icon: InvoiceIcon,
        title: `Pedido de ${order.customer_name}`,
        description: formatMoney(order.total_in_cents),
        href: `${ROUTES.dashboardOrders}?order=${order.id}`,
      }))

    return [...productResults, ...customerResults, ...orderResults].slice(0, 8)
  }, [customers.data, orders.data, products.data, query])

  useEffect(() => {
    if (!isSearchOpen) return
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 0)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSearchOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isSearchOpen])

  const handleSignOut = async () => {
    await signOut.mutateAsync()
    window.location.href = ROUTES.home
  }

  return (
    <>
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-z-border bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Abrir menu"
          className="flex h-9 w-9 items-center justify-center rounded-full text-z-text-muted transition-colors hover:bg-z-bg2 lg:hidden"
        >
          <HugeiconsIcon icon={Menu01Icon} size={20} />
        </button>

        <div className="flex items-center gap-3 text-sm text-z-text-muted">
          <span className="font-medium text-z-text">{store?.name ?? 'Sua loja'}</span>
          {isTrialing && <Badge tone="lilac">Trial</Badge>}
          {store && (
            <>
              <span className="hidden text-z-text-hint sm:inline">·</span>
              <a
                href={buildStoreUrl(store.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-1 font-medium text-z-primary hover:underline sm:inline-flex"
              >
                Ver catálogo
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} />
              </a>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <button
          type="button"
          aria-label="Buscar"
          onClick={() => setIsSearchOpen(true)}
          className="hidden h-9 w-9 items-center justify-center rounded-full text-z-text-muted transition-colors hover:bg-z-bg2 sm:flex"
        >
          <HugeiconsIcon icon={SearchIcon} size={18} />
        </button>

        <NotificationsBell storeId={store?.id} />

        {/* User profile section */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 rounded-full py-1 pl-2 pr-1 transition-colors hover:bg-z-bg2 lg:gap-2.5"
          >
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={14}
              className="hidden text-z-text-hint lg:block"
            />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-z-ink text-[11px] font-semibold text-white">
              {initials}
            </div>
          </button>

          {/* User dropdown menu */}
          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-z-border bg-white shadow-z-lg py-1">
                <Link
                  to={ROUTES.dashboardProfile}
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-z-text hover:bg-z-bg"
                >
                  <HugeiconsIcon icon={User02Icon} size={16} />
                  Meu perfil
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={signOut.isPending}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-z-text hover:bg-z-bg disabled:opacity-50"
                >
                  <HugeiconsIcon icon={Logout01Icon} size={16} />
                  {signOut.isPending ? 'Saindo...' : 'Sair'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
    {isSearchOpen && (
      <div className="fixed inset-0 z-50 bg-z-ink/20 px-4 py-20 backdrop-blur-sm">
        <div
          className="absolute inset-0"
          onClick={() => setIsSearchOpen(false)}
        />
        <div className="relative mx-auto w-full max-w-xl rounded-xl border border-z-border bg-white">
          <div className="flex items-center gap-3 border-b border-z-border px-4 py-3">
            <HugeiconsIcon icon={SearchIcon} size={18} className="text-z-text-hint" />
            <input
              ref={inputRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && searchResults[0]) {
                  navigate(searchResults[0].href)
                  setIsSearchOpen(false)
                }
              }}
              placeholder="Buscar produtos, clientes ou pedidos"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-z-text outline-none placeholder:text-z-text-hint"
            />
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              aria-label="Fechar busca"
              className="flex h-8 w-8 items-center justify-center rounded-full text-z-text-muted hover:bg-z-bg2"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {!query ? (
              <div className="px-3 py-8 text-center text-sm text-z-text-muted">
                Digite para pesquisar no dashboard.
              </div>
            ) : searchResults.length > 0 ? (
              <div className="flex flex-col gap-1">
                {searchResults.map((result) => (
                  <SearchResultLink
                    key={result.id}
                    result={result}
                    onClick={() => setIsSearchOpen(false)}
                  />
                ))}
              </div>
            ) : (
              <div className="px-3 py-8 text-center text-sm text-z-text-muted">
                Nenhum resultado encontrado.
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}

type SearchResult = {
  id: string
  icon: IconSvgElement
  title: string
  description: string
  href: string
}

function SearchResultLink({
  result,
  onClick,
}: {
  result: SearchResult
  onClick: () => void
}) {
  return (
    <Link
      to={result.href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-z-bg"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-z-bg text-z-primary">
        <HugeiconsIcon icon={result.icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-z-text">
          {result.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-z-text-muted">
          {result.description}
        </span>
      </span>
    </Link>
  )
}
