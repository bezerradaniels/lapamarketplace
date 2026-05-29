import { Suspense } from 'react'
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useSession } from '@/features/auth'
import { createBrowserClient } from '@/lib/supabase'
import { ROUTES } from '@/config/routes'
import { isAdminEmail, PRIMARY_ADMIN_EMAIL } from '@/config/admin'

const navItems = [
  { to: ROUTES.admin, label: 'Visão Geral', end: true },
  { to: ROUTES.adminStores, label: 'Lojas' },
]

export default function AdminLayout() {
  const { session, isLoading } = useSession()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Carregando...
      </div>
    )
  }

  if (!session) {
    return <Navigate to={ROUTES.login} replace />
  }

  if (!isAdminEmail(session.user.email)) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  async function handleSignOut() {
    await createBrowserClient().auth.signOut()
    navigate(ROUTES.login)
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-6 shadow-sm">
        <Link to={ROUTES.admin} className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-xs font-bold text-white">
            L
          </span>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-gray-900">Lapa Marketplace</p>
            <p className="text-[10px] text-emerald-600">Admin</p>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          Sair
        </button>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
          <span className="text-xs font-medium uppercase tracking-widest text-gray-500">
            Painel Administrativo
          </span>
          <span className="text-xs text-gray-500">{PRIMARY_ADMIN_EMAIL}</span>
        </header>

        <main className="flex-1 overflow-auto px-6 py-6">
          <Suspense
            fallback={
              <div className="flex h-48 items-center justify-center text-sm text-gray-500">
                Carregando...
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
