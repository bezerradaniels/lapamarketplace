import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PlusSignIcon,
  DiscountTagIcon,
  EditIcon,
  DeleteIcon,
  Tick02Icon,
  CancelIcon,
} from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import {
  useCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useUpdateCoupon,
  couponFormSchema,
  type CouponFormInput,
} from '@/features/coupons'
import { useCategories } from '@/features/categories'
import { Badge, Button, Field } from '@/components/ui'
import { formatMoney, parseMoneyToCents } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { StoreCoupon } from '@/types/domain'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
  }).format(new Date(iso))
}

function isExpired(coupon: StoreCoupon): boolean {
  if (!coupon.expires_at) return false
  return new Date(coupon.expires_at).getTime() < Date.now()
}

export default function CouponsPage() {
  const { store } = useActiveStore()
  const coupons = useCoupons(store?.id)
  const del = useDeleteCoupon(store?.id ?? '')

  const [editing, setEditing] = useState<StoreCoupon | null>(null)
  const [showForm, setShowForm] = useState(false)

  const list = coupons.data ?? []

  const handleOpenCreate = () => {
    setEditing(null)
    setShowForm(true)
  }
  const handleOpenEdit = (c: StoreCoupon) => {
    setEditing(c)
    setShowForm(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tighter">Cupons</h1>
          <p className="text-sm text-z-text-muted">
            Crie códigos de desconto que seus clientes podem usar no checkout.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <HugeiconsIcon icon={PlusSignIcon} size={16} />
          Novo cupom
        </Button>
      </header>

      {coupons.isLoading ? (
        <p className="text-sm text-z-text-muted">Carregando...</p>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-z-border bg-white p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-z-bg2 text-z-text-hint">
            <HugeiconsIcon icon={DiscountTagIcon} size={26} />
          </div>
          <div className="text-base font-semibold">Nenhum cupom criado</div>
          <p className="max-w-sm text-sm text-z-text-muted">
            Crie cupons percentuais ou de valor fixo para incentivar pedidos.
          </p>
          <Button onClick={handleOpenCreate}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            Criar primeiro cupom
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-z-border bg-white">
          {/* Mobile card list */}
          <div className="flex flex-col divide-y divide-z-border sm:hidden">
            {list.map((c) => {
              const expired = isExpired(c)
              const exhausted = c.max_uses !== null && c.used_count >= c.max_uses
              return (
                <div key={c.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold">{c.code}</span>
                      {!c.is_active ? (
                        <Badge tone="neutral">Inativo</Badge>
                      ) : expired ? (
                        <Badge tone="rose">Expirado</Badge>
                      ) : exhausted ? (
                        <Badge tone="amber">Esgotado</Badge>
                      ) : (
                        <Badge tone="green">Ativo</Badge>
                      )}
                    </div>
                    {c.description && (
                      <p className="mt-0.5 text-xs text-z-text-muted">{c.description}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-z-text-muted">
                      <span className="font-semibold text-z-text">
                        {c.discount_type === 'percent'
                          ? `${c.discount_value}% off`
                          : `${formatMoney(c.discount_value)} off`}
                      </span>
                      {c.min_subtotal_in_cents > 0 && (
                        <span>Mín. {formatMoney(c.min_subtotal_in_cents)}</span>
                      )}
                      <span>
                        {c.used_count} uso{c.used_count !== 1 ? 's' : ''}
                        {c.max_uses !== null && ` / ${c.max_uses}`}
                      </span>
                      {c.expires_at && <span>Até {formatDate(c.expires_at)}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      aria-label="Editar"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-z-text-muted hover:bg-z-bg2 hover:text-z-text"
                    >
                      <HugeiconsIcon icon={EditIcon} size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (confirm(`Excluir o cupom ${c.code}?`)) del.mutate(c.id) }}
                      aria-label="Excluir"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-z-text-muted hover:bg-z-primary/10 hover:text-z-primary"
                    >
                      <HugeiconsIcon icon={DeleteIcon} size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <table className="hidden w-full text-sm sm:table">
            <thead>
              <tr className="border-b border-z-border bg-z-bg2/60 text-left text-[11px] font-semibold text-z-text-hint">
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Desconto</th>
                <th className="px-4 py-3 font-semibold">Mín. pedido</th>
                <th className="px-4 py-3 text-right font-semibold">Usos</th>
                <th className="px-4 py-3 font-semibold">Validade</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-z-border">
              {list.map((c) => {
                const expired = isExpired(c)
                const exhausted =
                  c.max_uses !== null && c.used_count >= c.max_uses
                return (
                  <tr key={c.id} className="hover:bg-z-bg2/40">
                    <td className="px-4 py-3">
                      <div className="font-mono text-[13px] font-bold">{c.code}</div>
                      {c.description && (
                        <div className="text-xs text-z-text-muted">{c.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.discount_type === 'percent'
                        ? `${c.discount_value}%`
                        : formatMoney(c.discount_value)}
                    </td>
                    <td className="px-4 py-3 text-z-text-muted">
                      {c.min_subtotal_in_cents > 0
                        ? formatMoney(c.min_subtotal_in_cents)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.used_count}
                      {c.max_uses !== null && (
                        <span className="text-z-text-hint"> / {c.max_uses}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-z-text-muted">
                      {formatDate(c.expires_at)}
                    </td>
                    <td className="px-4 py-3">
                      {!c.is_active ? (
                        <Badge tone="neutral">Inativo</Badge>
                      ) : expired ? (
                        <Badge tone="rose">Expirado</Badge>
                      ) : exhausted ? (
                        <Badge tone="amber">Esgotado</Badge>
                      ) : (
                        <Badge tone="green">Ativo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          aria-label="Editar"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-z-text-muted hover:bg-z-bg2 hover:text-z-text"
                        >
                          <HugeiconsIcon icon={EditIcon} size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Excluir o cupom ${c.code}?`)) del.mutate(c.id)
                          }}
                          aria-label="Excluir"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-z-text-muted hover:bg-z-primary/10 hover:text-z-primary"
                        >
                          <HugeiconsIcon icon={DeleteIcon} size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && store && (
        <CouponFormDialog
          storeId={store.id}
          coupon={editing}
          onClose={() => {
            setShowForm(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Form dialog                                                                */
/* -------------------------------------------------------------------------- */

function CouponFormDialog({
  storeId,
  coupon,
  onClose,
}: {
  storeId: string
  coupon: StoreCoupon | null
  onClose: () => void
}) {
  const create = useCreateCoupon(storeId)
  const update = useUpdateCoupon(storeId)
  const isEdit = !!coupon
  const categories = useCategories(storeId)
  const allCategories = categories.data ?? []

  const initial = useMemo<CouponFormInput>(
    () => ({
      code: coupon?.code ?? '',
      description: coupon?.description ?? undefined,
      discount_type: coupon?.discount_type ?? 'percent',
      discount_value: coupon?.discount_value ?? 10,
      min_subtotal_in_cents: coupon?.min_subtotal_in_cents ?? 0,
      max_uses: coupon?.max_uses ?? null,
      is_active: coupon?.is_active ?? true,
      expires_at: coupon?.expires_at
        ? coupon.expires_at.slice(0, 10)
        : undefined,
      category_id: coupon?.category_id ?? undefined,
      custom_url: coupon?.custom_url ?? undefined,
    }),
    [coupon],
  )

  const form = useForm<CouponFormInput>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: initial,
  })

  // Re-sync when switching between create/edit without remounting.
  useEffect(() => {
    form.reset(initial)
  }, [initial, form])

  const discountType = form.watch('discount_type')
  const minSubtotalCents = form.watch('min_subtotal_in_cents') ?? 0

  const submit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        code: values.code,
        description: values.description ?? null,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        min_subtotal_in_cents: values.min_subtotal_in_cents ?? 0,
        max_uses: values.max_uses ?? null,
        is_active: values.is_active,
        expires_at: values.expires_at
          ? new Date(`${values.expires_at}T23:59:59-03:00`).toISOString()
          : null,
        category_id: values.category_id ?? null,
        custom_url: values.custom_url ?? null,
      }
      if (isEdit && coupon) {
        await update.mutateAsync({ id: coupon.id, input: payload })
      } else {
        await create.mutateAsync(payload)
      }
      onClose()
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes('duplicate key')
          ? 'Já existe um cupom com este código ou URL personalizada.'
          : 'Não foi possível salvar o cupom. Tente novamente.'
      form.setError('root', { message })
    }
  })

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-0 py-0 sm:items-center sm:px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-z-lg sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-z-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold">
              {isEdit ? 'Editar cupom' : 'Novo cupom'}
            </h2>
            <p className="text-xs text-z-text-muted">
              Cupons ativos podem ser usados no checkout pelos seus clientes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-z-text-muted hover:bg-z-bg2"
          >
            <HugeiconsIcon icon={CancelIcon} size={16} />
          </button>
        </header>

        <form onSubmit={submit} className="flex flex-col gap-4 overflow-y-auto px-5 py-5">
          <Field
            label="Código"
            placeholder="Ex: PROMO10"
            hint="Letras maiúsculas, números, _ ou -"
            error={form.formState.errors.code?.message}
            {...form.register('code')}
          />

          <Field
            label="Descrição (opcional)"
            placeholder="Ex: 10% off em pedidos acima de R$ 100"
            error={form.formState.errors.description?.message}
            {...form.register('description')}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-z-text-hint">
                Tipo
              </span>
              <Controller
                control={form.control}
                name="discount_type"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-z-border bg-z-bg2 p-1">
                    {(['percent', 'fixed'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => field.onChange(opt)}
                        className={cn(
                          'h-9 rounded-md text-xs font-semibold transition-colors',
                          field.value === opt
                            ? 'bg-white text-z-text shadow-sm'
                            : 'text-z-text-muted hover:text-z-text',
                        )}
                      >
                        {opt === 'percent' ? 'Porcentagem' : 'Valor fixo'}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {discountType === 'percent' ? (
              <Field
                label="Desconto (%)"
                type="number"
                min={1}
                max={100}
                error={form.formState.errors.discount_value?.message}
                {...form.register('discount_value', {
                  setValueAs: (v) =>
                    v === '' || v === null || v === undefined ? 0 : Number(v),
                })}
              />
            ) : (
              <FixedDiscountInput
                value={form.watch('discount_value') ?? 0}
                onChange={(cents) =>
                  form.setValue('discount_value', cents, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                error={form.formState.errors.discount_value?.message}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MinSubtotalInput
              value={minSubtotalCents}
              onChange={(cents) =>
                form.setValue('min_subtotal_in_cents', cents, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <Field
              label="Limite de usos"
              type="number"
              min={1}
              placeholder="Em branco = ilimitado"
              error={form.formState.errors.max_uses?.message}
              {...form.register('max_uses', {
                setValueAs: (v) =>
                  v === '' || v === null || v === undefined ? null : Number(v),
              })}
            />
          </div>

          <Field
            label="Validade (opcional)"
            type="date"
            hint="Em branco = sem expiração"
            error={form.formState.errors.expires_at?.message}
            {...form.register('expires_at')}
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-z-text-hint">
              Categoria (opcional)
            </span>
            <select
              className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
              {...form.register('category_id')}
            >
              <option value="">Todas as categorias</option>
              {allCategories
                .filter((c) => !c.parent_id)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              {allCategories
                .filter((c) => c.parent_id)
                .map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    └ {sub.name}
                  </option>
                ))}
            </select>
            <span className="text-xs text-z-text-hint">
              Restringe o cupom a produtos desta categoria/subcategoria
            </span>
            {form.formState.errors.category_id && (
              <span className="text-xs text-destructive">
                {form.formState.errors.category_id.message}
              </span>
            )}
          </div>

          <Field
            label="URL personalizada (opcional)"
            placeholder="Ex: promo-verao-2025"
            hint="Cria um link exclusivo como /c/promo-verao-2025"
            error={form.formState.errors.custom_url?.message}
            {...form.register('custom_url')}
          />

          <Controller
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-2.5">
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  aria-pressed={field.value}
                  className={cn(
                    'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 transition-colors',
                    field.value
                      ? 'border-z-green bg-z-green'
                      : 'border-z-border bg-white',
                  )}
                >
                  {field.value && (
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      size={11}
                      className="text-white"
                      strokeWidth={3}
                    />
                  )}
                </button>
                <span className="text-sm">
                  Cupom ativo{' '}
                  <span className="text-z-text-muted">
                    (disponível no checkout)
                  </span>
                </span>
              </label>
            )}
          />

          {form.formState.errors.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
        </form>

        <footer className="flex justify-end gap-2 border-t border-z-border px-5 py-4">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button
            onClick={submit}
            type="button"
            disabled={create.isPending || update.isPending}
          >
            {create.isPending || update.isPending
              ? 'Salvando...'
              : isEdit
                ? 'Salvar alterações'
                : 'Criar cupom'}
          </Button>
        </footer>
      </div>
    </div>
  )
}

function FixedDiscountInput({
  value,
  onChange,
  error,
}: {
  value: number
  onChange: (cents: number) => void
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-z-text-hint">
        Desconto (R$)
      </span>
      <input
        inputMode="decimal"
        placeholder="R$ 0,00"
        defaultValue={value ? formatMoney(value) : ''}
        className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
        onChange={(e) => {
          const cents = parseMoneyToCents(e.target.value)
          onChange(Number.isNaN(cents) ? 0 : cents)
        }}
      />
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : (
        <span className="text-xs text-z-text-muted">
          Atual:{' '}
          <strong className="text-z-text">{formatMoney(value)}</strong>
        </span>
      )}
    </div>
  )
}

function MinSubtotalInput({
  value,
  onChange,
}: {
  value: number
  onChange: (cents: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-z-text-hint">
        Pedido mínimo
      </span>
      <input
        inputMode="decimal"
        placeholder="R$ 0,00 (sem mínimo)"
        defaultValue={value ? formatMoney(value) : ''}
        className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
        onChange={(e) => {
          const cents = parseMoneyToCents(e.target.value)
          onChange(Number.isNaN(cents) ? 0 : cents)
        }}
      />
      <span className="text-xs text-z-text-hint">Opcional</span>
    </div>
  )
}
