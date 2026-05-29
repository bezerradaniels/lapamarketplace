import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  HomeIcon,
  InvoiceIcon,
  PackageIcon,
  UserGroupIcon,
  UserMultipleIcon,
  StoreLocationIcon,
  DiscountTagIcon,
  CreditCardIcon,
  HeadphonesIcon,
  LogoutIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  FolderOpenIcon,
} from '@hugeicons/core-free-icons'
import { ROUTES } from '@/config/routes'
import { useSignOut } from '@/features/auth'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: IconSvgElement
  end?: boolean
}

interface NavGroup {
  id: 'catalog' | 'products' | 'people' | 'admin'
  label: string
  items: NavItem[]
}

const HOME_ITEM: NavItem = { to: ROUTES.dashboard, label: 'Início', icon: HomeIcon, end: true }

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'catalog',
    label: 'Catálogo',
    items: [
      { to: ROUTES.dashboardCatalog, label: 'Personalizar', icon: StoreLocationIcon },
    ],
  },
  {
    id: 'products',
    label: 'Produtos',
    items: [
      { to: ROUTES.dashboardOrders, label: 'Pedidos', icon: InvoiceIcon },
      { to: ROUTES.dashboardProducts, label: 'Produtos', icon: PackageIcon },
      { to: ROUTES.dashboardCoupons, label: 'Cupons', icon: DiscountTagIcon },
    ],
  },
  {
    id: 'people',
    label: 'Pessoas',
    items: [
      { to: ROUTES.dashboardCustomers, label: 'Clientes', icon: UserGroupIcon },
      { to: ROUTES.dashboardSellers, label: 'Vendedores', icon: UserMultipleIcon },
    ],
  },
  {
    id: 'admin',
    label: 'Adm',
    items: [
      { to: ROUTES.dashboardCategories, label: 'Categorias', icon: FolderOpenIcon },
      { to: ROUTES.dashboardBilling, label: 'Assinatura', icon: CreditCardIcon },
      { to: ROUTES.dashboardSupport, label: 'Suporte', icon: HeadphonesIcon },
    ],
  },
]

interface SidebarProps {
  isMobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
  const signOut = useSignOut()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<NavGroup['id'], boolean>>({
    catalog: false,
    products: false,
    people: false,
    admin: false,
  })

  const toggleGroup = (groupId: NavGroup['id']) => {
    setCollapsedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }))
  }

  const renderNavItem = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      title={isCollapsed ? item.label : undefined}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
          isActive
            ? 'bg-white text-z-text'
            : 'text-z-text-muted hover:bg-white/70 hover:text-z-text',
          isCollapsed && 'lg:justify-center lg:px-0',
        )
      }
    >
      <HugeiconsIcon icon={item.icon} size={20} className="shrink-0 text-z-primary" />
      <span className={cn('truncate', isCollapsed && 'lg:hidden')}>
        {item.label}
      </span>
    </NavLink>
  )

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col overflow-visible bg-[#e2e8f0] text-z-text transition-all duration-300 ease-in-out',
          // Mobile: slide in/out
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
          // Desktop: sticky in layout, always visible
          'lg:sticky lg:top-0 lg:z-30 lg:translate-x-0 lg:shadow-none',
          // Width: always 240px on mobile; collapsible on desktop
          isCollapsed ? 'w-[240px] lg:w-[72px]' : 'w-[240px]',
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap pl-1 pt-3 font-bold text-z-text">
              <Logo height={50} className="w-[150px] max-w-[150px]" />
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto flex items-center justify-center pt-3">
              <img
                src="/logos/logo-market.svg"
                alt="Lapa Marketplace"
                className="h-8 w-8"
              />
            </div>
          )}

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted transition-colors hover:bg-white/60 hover:text-z-text lg:hidden"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              'absolute -right-3 top-4 z-50 hidden h-6 w-6 items-center justify-center rounded-full border border-z-border bg-[#e2e8f0] text-z-text-muted transition-transform hover:text-z-text lg:flex',
            )}
          >
            <HugeiconsIcon
              icon={isCollapsed ? ArrowRight01Icon : ArrowLeft01Icon}
              size={14}
            />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-4">
          {renderNavItem(HOME_ITEM)}

          {NAV_GROUPS.map((group) => {
            const groupIsCollapsed = collapsedGroups[group.id]
            return (
              <div key={group.id} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    'mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-z-text-muted transition-colors hover:bg-white/50 hover:text-z-text',
                    isCollapsed && 'lg:hidden',
                  )}
                  aria-expanded={!groupIsCollapsed}
                >
                  <span>{group.label}</span>
                  <HugeiconsIcon
                    icon={groupIsCollapsed ? ArrowRight01Icon : ArrowLeft01Icon}
                    size={14}
                    className={cn(
                      'transition-transform',
                      !groupIsCollapsed && '-rotate-90',
                    )}
                  />
                </button>

                <div
                  className={cn(
                    'flex flex-col gap-1',
                    groupIsCollapsed && 'hidden lg:flex',
                    groupIsCollapsed && !isCollapsed && 'lg:hidden',
                  )}
                >
                  {group.items.map(renderNavItem)}
                </div>
              </div>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={() => signOut.mutate()}
          title={isCollapsed ? 'Sair' : undefined}
          className={cn(
            'mx-3 mb-6 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-z-text-muted transition-colors hover:bg-white/70 hover:text-z-text',
            isCollapsed && 'lg:justify-center lg:px-0',
          )}
        >
          <HugeiconsIcon icon={LogoutIcon} size={20} className="shrink-0 text-z-primary" />
          <span className={cn(isCollapsed && 'lg:hidden')}>Sair</span>
        </button>
      </aside>
    </>
  )
}
