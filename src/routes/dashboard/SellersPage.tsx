import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Search01Icon,
  UserGroupIcon,
  Edit02Icon,
  Copy01Icon,
  CopyCheckIcon,
  Delete02Icon,
  ShoppingCart01Icon,
  LinkSquare01Icon,
} from '@hugeicons/core-free-icons'
import { useActiveStore, buildStoreUrl } from '@/lib/tenant'
import { useSession } from '@/features/auth'
import {
  useMembers,
  useRemoveSeller,
  type StoreMemberWithProfile,
} from '@/features/sellers'
import { usePlanLimits } from '@/features/billing'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'
import { NewSellerModal } from './NewSellerModal'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
]

function avatarColor(name: string) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ─── Seller row ──────────────────────────────────────────────────────────────

type SellerRowProps = {
  member: StoreMemberWithProfile
  catalogUrl: string
  isSelected: boolean
  isOwner: boolean
  onSelect: () => void
  onRemove: () => void
}

function SellerRow({ member, catalogUrl, isSelected, isOwner, onSelect, onRemove }: SellerRowProps) {
  const [copied, setCopied] = useState(false)
  const displayName = member.name ?? member.email
  const colorClass = avatarColor(displayName)

  function copyLink() {
    navigator.clipboard.writeText(catalogUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all',
        isSelected
          ? 'border-indigo-200 bg-indigo-50/60 shadow-sm'
          : 'border-z-border bg-white hover:bg-z-bg2/40',
      )}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${colorClass}`}>
        {initials(displayName)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-z-text">{displayName}</p>
        <a
          href={catalogUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="truncate text-xs text-z-text-muted hover:underline"
        >
          {catalogUrl.replace(/^https?:\/\//, '')}
        </a>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
          <span className="hidden sm:inline">Catálogo ativo</span>
          <button
            type="button"
            title="Copiar link do catálogo"
            onClick={(e) => { e.stopPropagation(); copyLink() }}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <HugeiconsIcon icon={copied ? CopyCheckIcon : Copy01Icon} size={12} />
          </button>
        </span>

        {/* Secondary actions hidden on mobile — visible via detail panel tap */}
        <a
          href={catalogUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Ver catálogo"
          onClick={(e) => e.stopPropagation()}
          className="hidden h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-bg2 hover:text-z-text sm:flex"
        >
          <HugeiconsIcon icon={LinkSquare01Icon} size={15} />
        </a>
        <button
          type="button"
          title="Editar cadastro"
          onClick={(e) => e.stopPropagation()}
          className="hidden h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-bg2 hover:text-z-text sm:flex"
        >
          <HugeiconsIcon icon={Edit02Icon} size={15} />
        </button>
        {isOwner && member.role === 'seller' && (
          <button
            type="button"
            title="Remover vendedor"
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-primary/10 hover:text-z-primary"
          >
            <HugeiconsIcon icon={Delete02Icon} size={15} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Seller detail panel ─────────────────────────────────────────────────────

type DetailPanelProps = {
  member: StoreMemberWithProfile
  catalogUrl: string
  isOwner: boolean
  onRemove: () => void
}

function SellerDetailPanel({ member, catalogUrl, isOwner, onRemove }: DetailPanelProps) {
  const [copied, setCopied] = useState(false)
  const displayName = member.name ?? member.email
  const colorClass = avatarColor(displayName)
  const firstName = displayName.split(' ')[0]

  function copyLink() {
    navigator.clipboard.writeText(catalogUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 border-b border-z-border px-5 pb-5 pt-6 text-center">
        <div className={`flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold ${colorClass}`}>
          {initials(displayName)}
        </div>
        <p className="text-base font-bold text-z-text">{displayName}</p>

        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Catálogo ativo
          <button type="button" onClick={copyLink} className="ml-0.5 text-emerald-500 hover:text-emerald-700">
            <HugeiconsIcon icon={copied ? CopyCheckIcon : Copy01Icon} size={12} />
          </button>
        </span>

        <a href={catalogUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-z-text-muted hover:underline">
          {catalogUrl.replace(/^https?:\/\//, '')}
        </a>

        <div className="mt-1 flex items-center gap-1">
          <button type="button" title="Editar cadastro" className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-bg2 hover:text-z-text">
            <HugeiconsIcon icon={Edit02Icon} size={15} />
          </button>
          <a href={catalogUrl} target="_blank" rel="noopener noreferrer" title="Ver catálogo" className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-bg2 hover:text-z-text">
            <HugeiconsIcon icon={LinkSquare01Icon} size={15} />
          </a>
          <button type="button" title="Copiar link" onClick={copyLink} className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-bg2 hover:text-z-text">
            <HugeiconsIcon icon={copied ? CopyCheckIcon : Copy01Icon} size={15} />
          </button>
          <Link to={`${ROUTES.dashboardOrders}?seller=${member.user_id}`} title="Ver pedidos" className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-bg2 hover:text-z-text">
            <HugeiconsIcon icon={ShoppingCart01Icon} size={15} />
          </Link>
          {isOwner && member.role === 'seller' && (
            <button type="button" title="Remover vendedor" onClick={onRemove} className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-primary/10 hover:text-z-primary">
              <HugeiconsIcon icon={Delete02Icon} size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 divide-x divide-z-border border-b border-z-border">
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-z-text">0 vendas</p>
          <p className="text-xs text-z-text-hint">Mês passado</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-z-text">Última venda</p>
          <p className="text-xs text-z-text-hint">—</p>
        </div>
      </div>

      {/* Catalog visits */}
      <div className="border-b border-z-border px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Visitas no catálogo</p>
          <button type="button" className="text-xs font-medium text-z-primary hover:underline">Ver tudo</button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-z-text-muted">
            <HugeiconsIcon icon={UserGroupIcon} size={14} />
            <span>0 visitas</span>
            <div className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-z-bg2">
              <div className="h-full w-full rounded-full bg-z-green" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-z-text-muted">
            <HugeiconsIcon icon={ShoppingCart01Icon} size={14} />
            <span>0 contatos</span>
            <span className="ml-auto text-z-text-hint">Últimos 30 dias</span>
          </div>
        </div>
      </div>

      {/* Most visited products */}
      <div className="flex-1 px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Produtos mais visitados</p>
          <button type="button" className="flex items-center gap-1 text-xs font-medium text-z-text-hint">
            Ver tudo <span>👑</span>
          </button>
        </div>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <div className="text-4xl opacity-40">📊</div>
          <p className="text-xs font-semibold text-z-text">
            {firstName} não teve visitas em seu catálogo nos últimos 30 dias
          </p>
          <p className="max-w-[260px] text-xs leading-relaxed text-z-text-muted">
            As visitas aos produtos do vendedor são registradas quando um cliente acessa o catálogo do
            vendedor e visualiza os produtos. Assim que houver visitas, elas serão exibidas aqui.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-z-border px-5 py-3">
        <Link to={`${ROUTES.dashboardOrders}?seller=${member.user_id}`} className="text-xs font-semibold text-z-primary hover:underline">
          Ver pedidos
        </Link>
        <button type="button" className="text-xs font-semibold text-z-primary hover:underline">
          Editar cadastro
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SellersPage() {
  const { user } = useSession()
  const { store } = useActiveStore()
  const members = useMembers(store?.id)
  const removeSeller = useRemoveSeller(store?.id ?? '')
  const limits = usePlanLimits(store?.id)

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<StoreMemberWithProfile | null>(null)
  const [showNewSellerModal, setShowNewSellerModal] = useState(false)

  if (!store) return <p className="text-sm text-z-text-muted">Carregando...</p>

  const isOwner = store.owner_id === user?.id
  const list = members.data ?? []
  const sellerLimit = limits.sellerLimit
  const atLimit = sellerLimit !== null && list.length >= sellerLimit

  const filtered = search.trim()
    ? list.filter((m) => (m.name ?? m.email).toLowerCase().includes(search.toLowerCase()))
    : list

  const storeBaseUrl = buildStoreUrl(store.slug)

  function getCatalogUrl(member: StoreMemberWithProfile) {
    return `${storeBaseUrl}/s/${nameToSlug(member.name ?? member.email)}`
  }

  function handleRemove(member: StoreMemberWithProfile) {
    if (!confirm(`Remover ${member.name ?? member.email} da equipe?`)) return
    removeSeller.mutate(member.user_id)
    if (selected?.user_id === member.user_id) setSelected(null)
  }

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Left panel */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-z-border bg-white p-4">
          {/* Search + button */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <HugeiconsIcon icon={Search01Icon} size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-z-primary" />
              <input
                type="search"
                placeholder="Pesquise por vendedores"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-z-border bg-white pl-9 pr-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none"
              />
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowNewSellerModal(true)}
                disabled={atLimit}
                className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-z-green px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Cadastrar vendedor
              </button>
            )}
          </div>

          {isOwner && atLimit && (
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs">
              <span className="text-amber-800">
                Limite de {sellerLimit} {sellerLimit === 1 ? 'vendedor' : 'vendedores'} atingido.
              </span>
              <Link to={ROUTES.dashboardBilling} className="font-semibold text-z-green hover:underline">
                Ver planos →
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-z-text-muted">
            <span>Gerencie os seus catálogos de vendedores</span>
            <span>{list.length}/{sellerLimit ?? '∞'} vendedores</span>
          </div>

          {members.isLoading ? (
            <p className="py-6 text-center text-sm text-z-text-muted">Carregando...</p>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-z-bg2 text-z-text-hint">
                <HugeiconsIcon icon={UserGroupIcon} size={26} />
              </div>
              <p className="text-base font-semibold">Sua equipe está vazia</p>
              <p className="max-w-sm text-sm text-z-text-muted">
                Adicione vendedores para que eles acessem os pedidos da loja.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((m) => (
                <SellerRow
                  key={m.user_id}
                  member={m}
                  catalogUrl={getCatalogUrl(m)}
                  isSelected={selected?.user_id === m.user_id}
                  isOwner={isOwner}
                  onSelect={() => setSelected(selected?.user_id === m.user_id ? null : m)}
                  onRemove={() => handleRemove(m)}
                />
              ))}
              {filtered.length === 0 && search && (
                <p className="py-6 text-center text-sm text-z-text-muted">
                  Nenhum vendedor encontrado para "{search}".
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right panel — full width on mobile, fixed sidebar on desktop */}
        {selected && (
          <div className="overflow-hidden rounded-2xl border border-z-border bg-white lg:w-[360px] lg:shrink-0">
            <SellerDetailPanel
              member={selected}
              catalogUrl={getCatalogUrl(selected)}
              isOwner={isOwner}
              onRemove={() => handleRemove(selected)}
            />
          </div>
        )}
      </div>

      {/* New Seller Modal */}
      <NewSellerModal
        open={showNewSellerModal}
        onClose={() => setShowNewSellerModal(false)}
        storeId={store?.id ?? ''}
        storeSlug={store?.slug ?? ''}
        storeWhatsapp={store?.whatsapp_phone ?? ''}
      />
    </>
  )
}
