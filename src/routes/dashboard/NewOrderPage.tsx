import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft02Icon,
  UserGroupIcon,
  UserCircleIcon,
  ShoppingCart01Icon,
  PlusSignIcon,
  Delete02Icon,
  MinusSignIcon,
} from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import { useCustomers } from '@/features/customers'
import { useMembers } from '@/features/sellers'
import { useProducts } from '@/features/products'
import { useCreateManualOrder } from '@/features/orders'
import { usePlanLimits } from '@/features/billing'
import { ProductPickerModal } from '@/features/orders/components/ProductPickerModal'
import type { PickedItem } from '@/features/orders/components/ProductPickerModal'
import { formatMoney } from '@/lib/format'
import { fromE164BR } from '@/lib/br'
import { effectivePrice } from '@/features/products/utils/price'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/config/routes'

type CustomerType = 'registered' | 'new'

function avatarInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

const AVATAR_COLORS = [
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
]

function avatarColor(name: string): string {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) ?? 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

export default function NewOrderPage() {
  const navigate = useNavigate()
  const { store, isLoading } = useActiveStore()

  const customers = useCustomers(store?.id)
  const members = useMembers(store?.id)
  const products = useProducts(store?.id)
  const limits = usePlanLimits(store?.id)
  const create = useCreateManualOrder(store?.id ?? '')

  const [customerType, setCustomerType] = useState<CustomerType>('registered')
  const [selectedPhone, setSelectedPhone] = useState('')
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [selectedSellerId, setSelectedSellerId] = useState('')
  const [orderItems, setOrderItems] = useState<PickedItem[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)

  if (isLoading) return <p className="text-sm text-z-text-muted">Carregando...</p>
  if (!store) return <Navigate to={ROUTES.onboarding} replace />

  const customerList = customers.data ?? []
  const memberList = (members.data ?? []).filter((m) => m.role === 'seller')
  const productList = (products.data ?? []).filter((p) => p.is_active)

  const selectedCustomer = customerList.find((c) => c.whatsapp_phone === selectedPhone) ?? null
  const canAssignSeller = limits.sellerLimit !== 1 // Pro/Premium allow multiple sellers

  const total = orderItems.reduce(
    (sum, i) => sum + effectivePrice(i.product) * i.quantity,
    0,
  )

  const updateQty = (productId: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((i) =>
          i.product.id === productId
            ? { ...i, quantity: Math.max(1, i.quantity + delta) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    )
  }

  const removeItem = (productId: string) =>
    setOrderItems((prev) => prev.filter((i) => i.product.id !== productId))

  const handleSubmit = async () => {
    const customerName =
      customerType === 'registered'
        ? (selectedCustomer?.name ?? '')
        : newName.trim()

    const customerPhone =
      customerType === 'registered' ? (selectedCustomer?.whatsapp_phone ?? '') : newPhone.trim()

    if (!customerName) {
      toast.error('Informe o nome do cliente.')
      return
    }
    if (!customerPhone) {
      toast.error('Informe o telefone/WhatsApp do cliente.')
      return
    }
    if (orderItems.length === 0) {
      toast.error('Adicione pelo menos um produto ao pedido.')
      return
    }

    try {
      await create.mutateAsync({
        storeId: store.id,
        customerName,
        customerPhone,
        sellerId: selectedSellerId || null,
        items: orderItems.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          priceInCents: effectivePrice(i.product),
          quantity: i.quantity,
        })),
      })
      toast.success('Pedido criado com sucesso!')
      navigate(ROUTES.dashboardOrders)
    } catch {
      toast.error('Erro ao criar o pedido. Tente novamente.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-2">
        <Link
          to={ROUTES.dashboardOrders}
          className="inline-flex items-center gap-1 text-sm text-z-text-muted hover:text-z-text"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={14} />
          Pedidos
        </Link>
        <span className="text-z-text-hint">/</span>
        <span className="text-sm font-medium text-z-text">Novo pedido</span>
      </header>

      <div className="flex flex-col gap-0 rounded-2xl border border-z-border bg-white">
        {/* Page title */}
        <div className="border-b border-z-border px-6 py-5">
          <h1 className="text-lg font-bold text-z-text">Novo pedido</h1>
          <p className="text-sm text-z-text-muted">
            Para começar, preencha as informações básicas do novo pedido
          </p>
        </div>

        <div className="flex flex-col divide-y divide-z-border">
          {/* ─── Cliente do pedido ─── */}
          <section className="px-6 py-6">
            <div className="mb-4 flex items-center gap-2">
              <HugeiconsIcon icon={UserGroupIcon} size={18} className="text-z-text-muted" />
              <h2 className="font-semibold text-z-text">Cliente do pedido</h2>
            </div>

            {/* Radio */}
            <div className="mb-4 flex gap-4">
              {(['registered', 'new'] as const).map((type) => (
                <label key={type} className="flex cursor-pointer items-center gap-2 text-sm">
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors',
                      customerType === type
                        ? 'border-z-green bg-z-green'
                        : 'border-z-border',
                    )}
                  >
                    {customerType === type && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomerType(type)}
                    className="font-medium text-z-text"
                  >
                    {type === 'registered' ? 'Cliente cadastrado' : 'Novo cliente'}
                  </button>
                </label>
              ))}
            </div>

            {customerType === 'registered' ? (
              <div className="max-w-xs">
                <label className="mb-1.5 block text-xs font-semibold text-z-text-hint">
                  Selecione ou busque o cliente
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCustomerDropdownOpen((v) => !v)}
                    className={cn(
                      'flex h-11 w-full items-center justify-between rounded-lg border px-3.5 text-sm transition-colors',
                      customerDropdownOpen
                        ? 'border-z-green ring-2 ring-z-green/20'
                        : 'border-z-border',
                    )}
                  >
                    {selectedCustomer ? (
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold',
                            avatarColor(selectedCustomer.name),
                          )}
                        >
                          {avatarInitials(selectedCustomer.name)}
                        </span>
                        <span className="text-z-text">
                          {selectedCustomer.name} –{' '}
                          {fromE164BR(selectedCustomer.whatsapp_phone)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-z-text-hint">Clientes registrados</span>
                    )}
                    <span className="text-rose-500">▾</span>
                  </button>

                  {customerDropdownOpen && (
                    <div className="absolute left-0 top-12 z-20 w-full overflow-hidden rounded-xl border border-z-border bg-white shadow-z-lg">
                      <div className="px-3 py-2 text-xs text-z-text-hint">
                        Selecione uma opção
                      </div>
                      {customerList.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-z-text-muted">
                          Nenhum cliente encontrado
                        </p>
                      ) : (
                        customerList.map((c) => (
                          <button
                            key={c.whatsapp_phone}
                            type="button"
                            onClick={() => {
                              setSelectedPhone(c.whatsapp_phone)
                              setCustomerDropdownOpen(false)
                            }}
                            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-z-bg2"
                          >
                            <span
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                                avatarColor(c.name),
                              )}
                            >
                              {avatarInitials(c.name)}
                            </span>
                            <span className="text-z-text">
                              {c.name}{' '}
                              <span className="text-z-text-muted">
                                – {fromE164BR(c.whatsapp_phone)}
                              </span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-z-text-hint">
                    Nome do novo cliente
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o nome do cliente aqui..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-11 w-full rounded-lg border border-z-border px-3.5 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-z-text-hint">
                    WhatsApp
                    <HugeiconsIcon
                      icon={UserCircleIcon}
                      size={11}
                      className="ml-1 inline"
                    />
                  </label>
                  <div className="flex">
                    <span className="flex h-11 items-center rounded-l-lg border border-r-0 border-z-border bg-z-bg px-3 text-sm font-medium text-z-text-muted">
                      +55
                    </span>
                    <input
                      type="tel"
                      placeholder="Digite o telefone aqui..."
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="h-11 flex-1 rounded-r-lg border border-z-border px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ─── Vendedor ─── */}
          <section className="px-6 py-6">
            <div className="mb-4 flex items-center gap-2">
              <HugeiconsIcon icon={UserCircleIcon} size={18} className="text-z-text-muted" />
              <h2 className="font-semibold text-z-text">Vendedor</h2>
              {!canAssignSeller && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Premium 👑
                </span>
              )}
            </div>

            <div className="max-w-xs">
              <label className="mb-1.5 block text-xs font-semibold text-z-text-hint">
                Vendedor
                <HugeiconsIcon
                  icon={UserCircleIcon}
                  size={11}
                  className="ml-1 inline"
                />
              </label>
              <select
                disabled={!canAssignSeller}
                value={selectedSellerId}
                onChange={(e) => setSelectedSellerId(e.target.value)}
                className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm text-z-text focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20 disabled:bg-z-bg disabled:text-z-text-hint"
              >
                <option value="">Selecione o vendedor</option>
                {memberList.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.name ?? m.email}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* ─── Produtos do pedido ─── */}
          <section className="px-6 py-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={ShoppingCart01Icon}
                  size={18}
                  className="text-z-text-muted"
                />
                <h2 className="font-semibold text-z-text">Produtos do pedido</h2>
              </div>
              {orderItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-z-border px-3 py-1.5 text-sm text-z-text-muted transition-colors hover:border-z-green hover:text-z-green"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={14} />
                  Adicionar mais
                </button>
              )}
            </div>
            <p className="mb-4 text-sm text-z-text-muted">
              Clique no botão ao lado para adicionar mais produtos ao pedido
            </p>

            {orderItems.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-z-border bg-z-bg py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-rose-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 64 64"
                    className="h-10 w-10"
                    fill="none"
                  >
                    <rect x="8" y="12" width="36" height="44" rx="4" fill="#fee2e2" />
                    <rect x="14" y="20" width="24" height="4" rx="2" fill="#fca5a5" />
                    <rect x="14" y="30" width="20" height="4" rx="2" fill="#fca5a5" />
                    <circle cx="48" cy="48" r="12" fill="#f87171" />
                    <path d="M44 48h8M48 44v8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-z-text">
                    Ainda não há produtos neste pedido
                  </p>
                  <p className="mt-1 max-w-xs text-sm text-z-text-muted">
                    Clique no botão "Adicionar produtos" abaixo para incluir produtos ao
                    pedido
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="mt-1 flex items-center gap-1.5 rounded-full bg-z-green/10 px-5 py-2 text-sm font-medium text-z-green transition-colors hover:bg-z-green/15"
                >
                  Adicionar produtos
                  <HugeiconsIcon icon={PlusSignIcon} size={14} />
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-z-border">
                <ul className="divide-y divide-z-border">
                  {orderItems.map((item) => {
                    const price = effectivePrice(item.product)
                    const cover = item.product.images[0]
                    return (
                      <li
                        key={item.product.id}
                        className="flex items-center gap-3 p-3"
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-z-border bg-z-bg">
                          {cover ? (
                            <img
                              src={cover}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-z-text-hint">
                              ?
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-z-text">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-z-text-muted">
                            {formatMoney(price)} × {item.quantity} ={' '}
                            <strong>{formatMoney(price * item.quantity)}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQty(item.product.id, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-z-border text-z-text-muted hover:bg-z-bg2"
                          >
                            <HugeiconsIcon icon={MinusSignIcon} size={12} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.product.id, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-z-border text-z-text-muted hover:bg-z-bg2"
                          >
                            <HugeiconsIcon icon={PlusSignIcon} size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.product.id)}
                            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted transition-colors hover:bg-z-primary/10 hover:text-z-primary"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={14} />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {/* Order total */}
                <div className="flex items-center justify-between border-t border-z-border bg-z-bg px-4 py-3">
                  <span className="text-sm font-medium text-z-text-muted">
                    Total do pedido
                  </span>
                  <span className="text-base font-bold text-z-text">
                    {formatMoney(total)}
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="flex items-center justify-center rounded-2xl bg-z-text px-6 py-4">
        <button
          type="button"
          disabled={create.isPending}
          onClick={handleSubmit}
          className="rounded-full bg-z-green px-8 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {create.isPending ? 'Criando...' : 'Criar novo pedido'}
        </button>
      </div>

      {/* Product picker modal */}
      <ProductPickerModal
        open={pickerOpen}
        products={productList}
        alreadyPicked={orderItems}
        onConfirm={setOrderItems}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  )
}
