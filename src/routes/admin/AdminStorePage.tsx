import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAdminStore, StatCard, useGrantComplimentary } from '@/features/admin'
import { deleteAdminStore } from '@/features/admin/api/mutations'
import { deleteAllCustomers } from '@/features/customers'
import { ROUTES } from '@/config/routes'
import { buildStoreUrl } from '@/lib/tenant/resolveStore'
import type { PlanId } from '@/types/domain'

const PLAN_LABELS: Record<string, string> = { basico: 'Básico', pro: 'Pro', premium: 'Premium' }

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-emerald-50 text-emerald-700 border-emerald-100',
  trialing: 'bg-amber-50 text-amber-700 border-amber-100',
  past_due: 'bg-red-50 text-red-700 border-red-100',
  canceled: 'bg-gray-100 text-gray-600 border-gray-200',
  inactive: 'bg-gray-100 text-gray-500 border-gray-200',
}

const STATUS_LABELS: Record<string, string> = {
  active:   'Ativo',
  trialing: 'Em trial',
  past_due: 'Inadimplente',
  canceled: 'Cancelado',
  inactive: 'Inativo',
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending:   'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{value || '—'}</p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>
      {children}
    </div>
  )
}

export default function AdminStorePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error } = useAdminStore(id ?? '')
  const [isDeleting, setIsDeleting] = useState(false)
  const [grantPlan, setGrantPlan] = useState<PlanId>('premium')
  const [grantExpiry, setGrantExpiry] = useState('')
  const [grantNotes, setGrantNotes] = useState('')
  const grantComplimentary = useGrantComplimentary()

  async function handleDeleteCustomers() {
    if (!id) return
    if (!confirm('Tem certeza que deseja excluir TODOS os clientes desta loja? Esta ação não pode ser desfeita.')) return
    try {
      setIsDeleting(true)
      await deleteAllCustomers(id)
      alert('Todos os clientes foram excluídos com sucesso.')
      window.location.reload()
    } catch (err) {
      alert('Erro ao excluir clientes: ' + (err as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleDeleteStore() {
    if (!id) return
    if (!confirm('Tem certeza que deseja excluir esta loja? Esta ação NÃO pode ser desfeita e excluirá todos os dados da loja.')) return
    try {
      setIsDeleting(true)
      await deleteAdminStore(id)
      alert('Loja excluída com sucesso.')
      navigate(ROUTES.adminStores)
    } catch (err) {
      alert('Erro ao excluir loja: ' + (err as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-500">
        Carregando loja…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-red-400">
        Erro ao carregar dados da loja.
      </div>
    )
  }

  const store = data.store as Record<string, string | null | undefined>
  const owner = data.owner as Record<string, string | null | undefined> | null
  const sub = data.subscription as Record<string, string | null | undefined> | null
  const statusKey = (sub?.status ?? 'inactive') as string
  const orders = data.recent_orders as Record<string, unknown>[]

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        to={ROUTES.adminStores}
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"
      >
        ← Todas as lojas
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        {store.logo_url ? (
          <img
            src={store.logo_url}
            alt={store.name ?? ''}
            className="h-16 w-16 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-2xl font-bold text-gray-500">
            {(store.name ?? '?')[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-950">{store.name}</h1>
          <a
            href={buildStoreUrl(store.slug ?? '')}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-emerald-600 hover:underline"
          >
            {buildStoreUrl(store.slug ?? '')} ↗
          </a>
          {store.slogan && (
            <p className="mt-1 text-sm italic text-gray-500">"{store.slogan}"</p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[statusKey] ?? STATUS_STYLES.inactive}`}
          >
            {STATUS_LABELS[statusKey] ?? statusKey}
          </span>
          <button
            type="button"
            onClick={handleDeleteCustomers}
            disabled={isDeleting}
            className="rounded-lg border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir clientes'}
          </button>
          <button
            type="button"
            onClick={handleDeleteStore}
            disabled={isDeleting}
            className="rounded-lg border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir loja'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Produtos" value={data.product_count} color="purple" />
        <StatCard label="Vendedores" value={data.seller_count} color="amber" />
        <StatCard label="Pedidos" value={data.order_count} color="blue" />
        <StatCard label="Receita total" value={formatBRL(data.total_revenue_cents)} color="green" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Produtos ativos" value={data.active_product_count} />
        <StatCard label="Checkouts" value={data.checkout_count} />
        <StatCard label="Clientes" value={data.customer_count} />
      </div>

      {/* Detail cards */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Store info */}
        <Card title="Dados da loja">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria" value={store.category} />
            <Field label="Criada em" value={formatDate(store.created_at)} />
            <Field label="WhatsApp" value={store.whatsapp_phone} />
            <Field label="E-mail de contato" value={store.contact_email} />
            <Field label="Instagram" value={store.instagram ? `@${store.instagram}` : null} />
            <Field label="CNPJ" value={store.cnpj} />
          </div>
        </Card>

        {/* Address */}
        <Card title="Endereço">
          <div className="grid grid-cols-2 gap-3">
            <Field label="CEP" value={store.address_cep} />
            <Field label="UF" value={store.address_state} />
            <Field label="Cidade" value={store.address_city} />
            <Field label="Bairro" value={store.address_neighborhood} />
            <Field label="Rua" value={store.address_street} />
            <Field label="Número" value={store.address_number} />
          </div>
        </Card>

        {/* Owner */}
        <Card title="Lojista">
          <div className="grid grid-cols-1 gap-3">
            <Field label="Nome" value={owner?.name} />
            <Field label="E-mail" value={owner?.email} />
            <Field label="ID do usuário" value={store.owner_id} />
          </div>
        </Card>

        {/* Subscription */}
        <Card title="Assinatura">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Plano"
              value={sub?.plan_id ? (PLAN_LABELS[sub.plan_id] ?? sub.plan_id) : '—'}
            />
            <Field label="Status" value={STATUS_LABELS[statusKey] ?? statusKey} />
            <Field label="Fim do trial" value={formatDate(sub?.trial_ends_at)} />
            <Field label="Fim do ciclo" value={formatDate(sub?.current_period_end)} />
            <Field label="Stripe customer" value={sub?.stripe_customer_id} />
            <Field label="Stripe subscription" value={sub?.stripe_subscription_id} />
          </div>
        </Card>

        {/* Catalog settings */}
        <Card title="Configurações do catálogo">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cor primária" value={
              store.primary_color
                ? <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-gray-200"
                      style={{ background: store.primary_color }}
                    />
                    {store.primary_color}
                  </span>
                : null
            } />
            <Field label="Carrinho" value={String(store.cart_enabled) === 'true' ? 'Ativado' : 'Desativado'} />
            <Field label="Moeda" value={store.currency} />
            <Field label="GTM ID" value={store.gtm_id} />
          </div>
        </Card>
      </div>

      {/* Conceder gratuidade */}
      <Card title="Conceder gratuidade">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!id || !grantExpiry) return
            grantComplimentary.mutate({ storeId: id, planId: grantPlan, expiresAt: grantExpiry, notes: grantNotes || undefined })
          }}
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Plano</label>
              <select
                value={grantPlan}
                onChange={(e) => setGrantPlan(e.target.value as PlanId)}
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm"
              >
                <option value="basico">Básico</option>
                <option value="pro">Pro</option>
                <option value="premium">Ilimitado</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Válido até</label>
              <input
                type="date"
                value={grantExpiry}
                onChange={(e) => setGrantExpiry(e.target.value)}
                required
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Observações (opcional)</label>
            <input
              type="text"
              value={grantNotes}
              onChange={(e) => setGrantNotes(e.target.value)}
              placeholder="Ex: parceria, cortesia, influencer..."
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={grantComplimentary.isPending || !grantExpiry}
            className="self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {grantComplimentary.isPending ? 'Concedendo...' : 'Conceder gratuidade'}
          </button>
        </form>
      </Card>

      {/* Recent orders */}
      <Card title={`Últimos pedidos (${orders.length})`}>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum pedido ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {['Cliente', 'Telefone', 'Total', 'Status', 'Data'].map((h) => (
                  <th key={h} className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={String(order.id)}>
                  <td className="py-2 text-gray-800">{String(order.customer_name ?? '—')}</td>
                  <td className="py-2 text-gray-500">{String(order.customer_phone ?? '—')}</td>
                  <td className="py-2 text-gray-800">{formatBRL(Number(order.total_in_cents ?? 0))}</td>
                  <td className="py-2">
                    <span className="text-xs text-gray-500">
                      {ORDER_STATUS_LABELS[String(order.status)] ?? String(order.status)}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500">{formatDate(String(order.created_at ?? ''))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
