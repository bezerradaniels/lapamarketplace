import { NavLink, Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  HomeIcon,
  PackageIcon,
  PlusSignIcon,
  StoreLocationIcon,
  HeadphonesIcon,
} from '@hugeicons/core-free-icons'
import { ROUTES } from '@/config/routes'
import { useActiveStore, buildStoreUrl } from '@/lib/tenant'
import { cn } from '@/lib/utils'

export function BottomBar() {
  const { store } = useActiveStore()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-z-border bg-white lg:hidden">
      <NavLink
        to={ROUTES.dashboard}
        end
        className={({ isActive }) =>
          cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
            isActive ? 'text-z-green' : 'text-z-text-hint',
          )
        }
      >
        <HugeiconsIcon icon={HomeIcon} size={22} />
        Início
      </NavLink>

      <NavLink
        to={ROUTES.dashboardProducts}
        className={({ isActive }) =>
          cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
            isActive ? 'text-z-green' : 'text-z-text-hint',
          )
        }
      >
        <HugeiconsIcon icon={PackageIcon} size={22} />
        Produtos
      </NavLink>

      {/* Center add button */}
      <div className="flex flex-1 items-center justify-center">
        <Link
          to={`${ROUTES.dashboardProducts}/novo`}
          aria-label="Adicionar produto"
          className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-z-green text-white shadow-lg transition-transform active:scale-95"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={24} />
        </Link>
      </div>

      <a
        href={store ? buildStoreUrl(store.slug) : '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-z-text-hint transition-colors active:text-z-green"
      >
        <HugeiconsIcon icon={StoreLocationIcon} size={22} />
        Loja
      </a>

      <NavLink
        to={ROUTES.dashboardSupport}
        className={({ isActive }) =>
          cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
            isActive ? 'text-z-green' : 'text-z-text-hint',
          )
        }
      >
        <HugeiconsIcon icon={HeadphonesIcon} size={22} />
        Suporte
      </NavLink>
    </nav>
  )
}
