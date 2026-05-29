import { Suspense, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useSession } from '@/features/auth'
import { useMyStores } from '@/features/catalog'
import { useActiveStore } from '@/lib/tenant'
import { useOrderNotifications } from '@/features/orders'
import { useNotificationRealtime } from '@/features/notifications'
import { ROUTES } from '@/config/routes'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { BottomBar } from '@/components/layout/BottomBar'

export default function DashboardLayout() {
  const { session, isLoading } = useSession()
  const myStores = useMyStores(!!session)
  const { store } = useActiveStore()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const hideBottomBar = pathname.startsWith('/dashboard/produtos/')

  // Live toast for new orders + bell-icon badge realtime invalidation.
  useOrderNotifications(store?.id)
  useNotificationRealtime(store?.id)

  // 1. Initial auth check - only block the whole screen here
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-z-bg text-sm text-z-text-muted">
        Carregando...
      </div>
    )
  }

  // 2. Redirect if no session
  if (!session) {
    return <Navigate to={ROUTES.login} replace />
  }

  // 3. Keep layout visible while myStores loads
  return (
    <div className="flex min-h-screen bg-z-bg">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuToggle={() => setIsMobileSidebarOpen((v) => !v)} />
        <main className="flex-1 px-4 py-4 pb-24 lg:px-6 lg:py-6 lg:pb-6">
          {myStores.isLoading ? (
            <div className="flex h-64 items-center justify-center text-sm text-z-text-muted">
              Carregando dados da loja...
            </div>
          ) : myStores.data && myStores.data.length === 0 ? (
            <Navigate to={ROUTES.onboarding} replace />
          ) : (
            <Suspense
              fallback={
                <div className="flex h-64 items-center justify-center text-sm text-z-text-muted">
                  Carregando...
                </div>
              }
            >
              <Outlet />
            </Suspense>
          )}
        </main>
      </div>
      {!hideBottomBar && <BottomBar />}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast:
              'rounded-2xl border border-z-border bg-white shadow-z-lg font-sans',
          },
        }}
      />
    </div>
  )
}
