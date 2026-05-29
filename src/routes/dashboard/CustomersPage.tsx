import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon, UserGroupIcon, Add01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import { useCustomers, useDeleteCustomer } from '@/features/customers'
import { CustomerRow } from '@/features/customers/components/CustomerRow'
import { IntelligenceCards, type IntelligenceFilter } from '@/features/customers/components/IntelligenceCards'
import { AIPanel } from '@/features/customers/components/AIPanel'
import { ROUTES } from '@/config/routes'
import type { Customer } from '@/features/customers/types'

export default function CustomersPage() {
  const navigate = useNavigate()
  const { store } = useActiveStore()
  const customers = useCustomers(store?.id)
  const deleteCustomer = useDeleteCustomer(store?.id ?? '')

  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [sellerFilter, setSellerFilter] = useState('')
  const [intelligenceFilter, setIntelligenceFilter] = useState<IntelligenceFilter | null>(null)

  // Memoize so the `?? []` fallback keeps a stable reference and the
  // dependent useMemos below don't recompute on every render.
  const list = useMemo(() => customers.data ?? [], [customers.data])

  // Collect all unique tags across customers
  const allTags = useMemo(
    () => Array.from(new Set(list.flatMap((c) => c.tags))).sort(),
    [list],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return list.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.whatsapp_phone.includes(q.replace(/\D/g, ''))) {
        return false
      }
      if (tagFilter && !c.tags.includes(tagFilter)) return false
      if (sellerFilter && c.seller_id !== sellerFilter) return false
      return true
    })
  }, [list, search, tagFilter, sellerFilter])

  function handleEdit(customer: Customer) {
    navigate(`${ROUTES.dashboardCustomers}/${customer.id}`)
  }

  async function handleDelete(customer: Customer) {
    if (!confirm(`Excluir o cliente "${customer.name}"? Esta ação não pode ser desfeita.`)) return
    await deleteCustomer.mutateAsync(customer.id)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Intelligence cards */}
      <IntelligenceCards
        customers={list}
        activeFilter={intelligenceFilter}
        onFilterChange={(f) => setIntelligenceFilter(intelligenceFilter === f ? null : f)}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Main list panel */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-2xl border border-z-border bg-white p-5">
          {/* Filters row */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-z-primary"
                />
                <input
                  type="search"
                  placeholder="Pesquisar nos dados do cliente"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-z-border bg-white pl-9 pr-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none"
                />
              </div>

              {/* Filtrar por */}
              <div className="relative">
                <select
                  value=""
                  onChange={() => {}}
                  className="h-10 appearance-none rounded-xl border border-z-border bg-white pl-3 pr-8 text-sm text-z-text-muted focus:border-z-green focus:outline-none"
                >
                  <option value="">Filtrar por</option>
                </select>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={14}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-z-primary"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Tag filter */}
              <div className="relative">
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="h-10 appearance-none rounded-xl border border-z-border bg-white pl-3 pr-8 text-sm text-z-text-muted focus:border-z-green focus:outline-none"
                >
                  <option value="">Tag</option>
                  {allTags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={14}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-z-primary"
                />
              </div>

              {/* Seller filter (free-text for now) */}
              <input
                type="text"
                placeholder="Vendedor responsável"
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="h-10 flex-1 rounded-xl border border-z-border bg-white px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none"
              />

              {/* Crown (premium feature indicator) */}
              <span title="Recurso premium" className="text-amber-400">
                👑
              </span>

              {/* New customer */}
              <button
                type="button"
                onClick={() => navigate(ROUTES.dashboardCustomersNew)}
                className="flex h-10 items-center gap-2 rounded-full bg-z-green px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <HugeiconsIcon icon={Add01Icon} size={16} />
                Novo cliente
              </button>
            </div>
          </div>

          {/* Count */}
          {!customers.isLoading && (
            <p className="text-sm font-medium text-z-text-muted">
              {filtered.length} {filtered.length === 1 ? 'encontrado' : 'encontrados'}
            </p>
          )}

          {/* List */}
          {customers.isLoading ? (
            <p className="py-6 text-center text-sm text-z-text-muted">Carregando...</p>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-z-bg2 text-z-text-hint">
                <HugeiconsIcon icon={UserGroupIcon} size={26} />
              </div>
              <p className="text-base font-semibold">Ainda não há clientes</p>
              <p className="max-w-xs text-sm text-z-text-muted">
                Cadastre o primeiro cliente ou aguarde pedidos chegarem pelo catálogo.
              </p>
              <button
                type="button"
                onClick={() => navigate(ROUTES.dashboardCustomersNew)}
                className="mt-1 flex h-9 items-center gap-2 rounded-full bg-z-green px-5 text-sm font-semibold text-white"
              >
                <HugeiconsIcon icon={Add01Icon} size={15} />
                Novo cliente
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((c) => (
                <CustomerRow
                  key={c.id}
                  customer={c}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
              {filtered.length === 0 && (
                <p className="py-6 text-center text-sm text-z-text-muted">
                  Nenhum cliente encontrado para "{search}".
                </p>
              )}
            </div>
          )}
        </div>

        {/* AI panel — hidden on mobile, sidebar on desktop */}
        <div className="hidden lg:block lg:w-72 lg:shrink-0">
          <AIPanel />
        </div>
      </div>
    </div>
  )
}
