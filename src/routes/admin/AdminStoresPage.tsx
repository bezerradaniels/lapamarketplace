import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminStores } from '@/features/admin'
import { deleteAdminStore } from '@/features/admin/api/mutations'
import type { AdminStoreRow } from '@/features/admin'
import { ROUTES } from '@/config/routes'

const PLAN_LABELS: Record<string, string> = {
  basico: 'Básico',
  pro: 'Pro',
  premium: 'Premium',
}

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-emerald-50 text-emerald-700',
  trialing: 'bg-amber-50 text-amber-700',
  past_due: 'bg-red-50 text-red-700',
  canceled: 'bg-gray-100 text-gray-600',
  inactive: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  active:   'Ativo',
  trialing: 'Trial',
  past_due: 'Inadimplente',
  canceled: 'Cancelado',
  inactive: 'Inativo',
}

function trialDaysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null
  const diff = new Date(endsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(iso))
}

export default function AdminStoresPage() {
  const { data: stores, isLoading, error, refetch } = useAdminStores()
  const [search, setSearch] = useState('')

  const filtered = (stores ?? []).filter((s) => {
    const q = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      s.owner_email.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Lojas</h1>
          <p className="mt-1 text-sm text-gray-500">
            {stores ? `${stores.length} loja${stores.length !== 1 ? 's' : ''} cadastrada${stores.length !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <input
          type="search"
          placeholder="Buscar por nome, slug ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {isLoading && (
        <div className="flex h-48 items-center justify-center text-sm text-gray-500">
          Carregando lojas…
        </div>
      )}

      {error && (
        <div className="flex h-48 items-center justify-center text-sm text-red-400">
          Erro ao carregar lojas.
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Loja', 'Proprietário', 'Criada em', 'Plano', 'Status', 'Trial', 'Último pgto.', 'Produtos', 'Vendedores', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-600">
                    Nenhuma loja encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((store) => <StoreRow key={store.id} store={store} onDeleted={refetch} />)
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StoreRow({ store, onDeleted }: { store: AdminStoreRow; onDeleted: () => void }) {
  const days = trialDaysLeft(store.trial_ends_at)
  const statusKey = store.plan_status ?? 'inactive'
  const statusStyle = STATUS_STYLES[statusKey] ?? STATUS_STYLES.inactive
  const statusLabel = STATUS_LABELS[statusKey] ?? statusKey
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Excluir a loja "${store.name}"? Esta ação não pode ser desfeita.`)) return
    try {
      setIsDeleting(true)
      await deleteAdminStore(store.id)
      onDeleted()
    } catch (err) {
      alert('Erro ao excluir loja: ' + (err as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <tr className="transition-colors hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-950">{store.name}</div>
        <a
          href={`https://lapamarketplace.com.br/${store.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-emerald-600 hover:underline"
        >
          lapamarketplace.com.br/{store.slug}
        </a>
      </td>

      <td className="px-4 py-3">
        <div className="text-gray-800">{store.owner_name ?? '—'}</div>
        <div className="text-xs text-gray-500">{store.owner_email}</div>
      </td>

      <td className="px-4 py-3 text-gray-500">{formatDate(store.created_at)}</td>

      <td className="px-4 py-3 text-gray-700">
        {store.plan_id ? (PLAN_LABELS[store.plan_id] ?? store.plan_id) : '—'}
      </td>

      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle}`}>
          {statusLabel}
        </span>
      </td>

      <td className="px-4 py-3 text-gray-500">
        {days !== null ? (
          <span className={days === 0 ? 'text-red-600' : days <= 3 ? 'text-amber-600' : ''}>
            {days}d
          </span>
        ) : (
          '—'
        )}
      </td>

      <td className="px-4 py-3 text-gray-500">{formatDate(store.last_payment_at)}</td>

      <td className="px-4 py-3 text-center text-gray-700">{store.product_count}</td>

      <td className="px-4 py-3 text-center text-gray-700">{store.seller_count}</td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={ROUTES.adminStore.replace(':id', store.id)}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Ver
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </td>
    </tr>
  )
}
