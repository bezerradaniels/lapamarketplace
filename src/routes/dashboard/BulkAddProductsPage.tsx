import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  PlusSignIcon,
  DeleteIcon,
  TickDoubleIcon,
  ImageIcon,
} from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import { useCreateProduct, useProducts } from '@/features/products'
import { usePlanLimits } from '@/features/billing'
import { useCategories } from '@/features/categories'
import { ROUTES } from '@/config/routes'
import { Button } from '@/components/ui'
import { MoneyInput } from '@/components/forms/MoneyInput'
import { cn } from '@/lib/utils'

/* ─── Schema ─────────────────────────────────────────────────────────────── */

const rowSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  category: z.string().optional(),
  price_in_cents: z
    .number({ message: 'Preço obrigatório' })
    .int()
    .min(1, 'Preço obrigatório'),
  promo_price_in_cents: z.number().int().min(0).nullable().optional(),
  stock: z.string().optional(),
  is_active: z.boolean(),
  images: z.array(z.string()),
})

const bulkSchema = z.object({
  rows: z.array(rowSchema).min(1),
})

type BulkInput = z.infer<typeof bulkSchema>
type RowInput = z.infer<typeof rowSchema>

const emptyRow = (): RowInput => ({
  name: '',
  category: '',
  price_in_cents: 0,
  promo_price_in_cents: null,
  stock: '',
  is_active: true,
  images: [],
})

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function BulkAddProductsPage() {
  const navigate = useNavigate()
  const { store } = useActiveStore()
  const createProduct = useCreateProduct(store?.id ?? '')
  const products = useProducts(store?.id)
  const limits = usePlanLimits(store?.id)
  const categoriesQuery = useCategories(store?.id ?? '')
  const topLevelCategories = (categoriesQuery.data ?? []).filter(
    (c) => !c.parent_id,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<BulkInput>({
    resolver: zodResolver(bulkSchema),
    defaultValues: { rows: [emptyRow(), emptyRow(), emptyRow()] },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rows',
  })

  const rowCount = fields.length
  const productLimit = limits.productLimit
  const currentCount = products.data?.length ?? 0
  const slotsAvailable = productLimit !== null ? productLimit - currentCount : Infinity
  const willExceedLimit = productLimit !== null && rowCount > slotsAvailable

  const handleSubmit = form.handleSubmit(async ({ rows }) => {
    if (!store) return

    const rowsToSave = productLimit !== null ? rows.slice(0, slotsAvailable) : rows
    if (rowsToSave.length === 0) {
      toast.error('Você atingiu o limite de produtos do seu plano.')
      return
    }

    setIsSubmitting(true)
    const results = await Promise.allSettled(
      rowsToSave.map((row) =>
        createProduct.mutateAsync({
          name: row.name.trim(),
          category: row.category?.trim() || undefined,
          price_in_cents: row.price_in_cents,
          promo_price_in_cents: row.promo_price_in_cents ?? null,
          stock: row.stock?.trim() ? parseInt(row.stock) : null,
          is_active: row.is_active,
          images: row.images,
          // Required fields — filled in via the individual edit page later
          description: undefined,
          subcategory: undefined,
          brand: undefined,
          unit: 'Unidade',
          barcode: undefined,
          barcode_type: null,
          sku: undefined,
          auto_sku: true,
          condition: 'new' as const,
          purchase_recurrence: null,
          has_no_brand: false,
          cost_in_cents: null,
          is_featured: false,
          has_variations: false,
          variation_type: null,
          variation_label: null,
          variation_options: null,
        }),
      ),
    )
    setIsSubmitting(false)

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    if (failed === 0) {
      toast.success(
        `${succeeded} produto${succeeded !== 1 ? 's' : ''} adicionado${succeeded !== 1 ? 's' : ''} com sucesso!`,
      )
      navigate(ROUTES.dashboardProducts)
    } else {
      toast.error(
        `${succeeded} salvo${succeeded !== 1 ? 's' : ''}, ${failed} falhou${failed !== 1 ? 'ram' : ''}. Verifique os dados e tente novamente.`,
      )
    }
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to={ROUTES.dashboardProducts}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-[22px] font-bold tracking-tighter">
              Adicionar em massa
            </h1>
            <p className="text-sm text-z-text-muted">
              {rowCount} produto{rowCount !== 1 ? 's' : ''} na lista
              {productLimit !== null && (
                <> · {slotsAvailable > 0 ? slotsAvailable : 0} vaga{slotsAvailable !== 1 ? 's' : ''} disponíve{slotsAvailable !== 1 ? 'is' : 'l'} no plano</>
              )}
            </p>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={isSubmitting || rowCount === 0}>
          <HugeiconsIcon icon={TickDoubleIcon} size={16} />
          {isSubmitting
            ? 'Salvando...'
            : `Salvar ${rowCount} produto${rowCount !== 1 ? 's' : ''}`}
        </Button>
      </header>

      {/* Limit warning */}
      {willExceedLimit && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <span className="text-amber-900">
            Você tem {rowCount} produtos na lista, mas só há{' '}
            <strong>{slotsAvailable}</strong> vaga{slotsAvailable !== 1 ? 's' : ''} disponíve{slotsAvailable !== 1 ? 'is' : 'l'}. Somente os primeiros {slotsAvailable} serão salvos.
          </span>
          <Link
            to={ROUTES.dashboardBilling}
            className="shrink-0 text-sm font-semibold text-z-green hover:underline"
          >
            Fazer upgrade →
          </Link>
        </div>
      )}

      {/* Column header — desktop only */}
      <div className="hidden grid-cols-[minmax(160px,220px)_1fr_150px_130px_130px_90px_90px_44px] items-center gap-3 rounded-xl bg-z-bg2 px-4 py-2.5 text-[11px] font-semibold text-z-text-hint lg:grid">
        <span>Fotos</span>
        <span>Nome *</span>
        <span>Categoria</span>
        <span>Preço *</span>
        <span>Preço promo</span>
        <span>Estoque</span>
        <span>Status</span>
        <span />
      </div>

      {/* Rows */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {fields.map((field, index) => (
          <BulkRow
            key={field.id}
            index={index}
            form={form}
            storeId={store?.id ?? ''}
            categories={topLevelCategories.map((c) => c.name)}
            isExceedingLimit={productLimit !== null && index >= slotsAvailable}
            onRemove={() => remove(index)}
            canRemove={fields.length > 1}
          />
        ))}
      </form>

      {/* Add product link below list */}
      <div className="mt-2 flex justify-center">
        <button
          type="button"
          onClick={() => append(emptyRow())}
          disabled={isSubmitting}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-60"
        >
          + produto
        </button>
      </div>

      {/* Bottom action bar - fixed */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-z-border bg-white px-4 py-3 shadow-lg md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => append(emptyRow())}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl border border-z-border bg-white px-5 py-2.5 text-sm font-medium text-z-text transition-colors hover:bg-z-bg hover:text-z-text disabled:opacity-60"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            Adicionar mais produto
          </button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rowCount === 0}
          >
            <HugeiconsIcon icon={TickDoubleIcon} size={16} />
            {isSubmitting ? 'Salvando...' : 'Salvar lista de produtos'}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─── Row sub-component ──────────────────────────────────────────────────── */

type BulkRowProps = {
  index: number
  form: ReturnType<typeof useForm<BulkInput>>
  storeId: string
  categories: string[]
  isExceedingLimit: boolean
  onRemove: () => void
  canRemove: boolean
}

function BulkRow({ index, form, storeId, categories, isExceedingLimit, onRemove, canRemove }: BulkRowProps) {
  const errors = form.formState.errors.rows?.[index]

  return (
    <div
      className={cn(
        'rounded-2xl border bg-white transition-colors',
        isExceedingLimit
          ? 'border-amber-200 bg-amber-50/40 opacity-60'
          : 'border-z-border',
      )}
    >
      {/* Mobile layout: stacked */}
      <div className="flex flex-col gap-4 p-4 lg:hidden">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-z-text">
            Produto {index + 1}
          </span>
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-z-border text-z-text-hint hover:border-z-primary/30 hover:bg-z-primary/10 hover:text-z-primary disabled:opacity-30"
          >
            <HugeiconsIcon icon={DeleteIcon} size={14} />
          </button>
        </div>

        <Controller
          control={form.control}
          name={`rows.${index}.images`}
          render={({ field: f }) => (
            <ImageUploadButton
              storeId={storeId}
              rowIndex={index}
              value={f.value}
              onChange={f.onChange}
              max={4}
            />
          )}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nome *" error={errors?.name?.message}>
            <input
              placeholder="Nome do produto"
              className={inputCls}
              {...form.register(`rows.${index}.name`)}
            />
          </Field>
          <Field label="Categoria">
            <CategorySelect form={form} index={index} categories={categories} />
          </Field>
          <Field label="Preço *" error={errors?.price_in_cents?.message}>
            <PriceCell form={form} index={index} field="price_in_cents" />
          </Field>
          <Field label="Preço promo">
            <PriceCell form={form} index={index} field="promo_price_in_cents" allowEmpty />
          </Field>
          <Field label="Estoque">
            <input
              type="number"
              min={0}
              placeholder="—"
              className={inputCls}
              {...form.register(`rows.${index}.stock`)}
            />
          </Field>
          <Field label="Status">
            <ActiveToggle name={`rows.${index}.is_active`} form={form} />
          </Field>
        </div>
      </div>

      {/* Desktop layout: grid row */}
      <div className="hidden grid-cols-[minmax(160px,220px)_1fr_150px_130px_130px_90px_90px_44px] items-start gap-3 p-4 lg:grid">
        {/* Images */}
        <Controller
          control={form.control}
          name={`rows.${index}.images`}
          render={({ field: f }) => (
            <ImageUploadButton
              storeId={storeId}
              rowIndex={index}
              value={f.value}
              onChange={f.onChange}
              max={4}
            />
          )}
        />

        {/* Name */}
        <div className="flex flex-col gap-1 pt-1">
          <input
            placeholder="Nome do produto"
            className={cn(inputCls, errors?.name && 'border-destructive')}
            {...form.register(`rows.${index}.name`)}
          />
          {errors?.name && (
            <span className="text-xs text-destructive">{errors.name.message}</span>
          )}
        </div>

        {/* Category */}
        <div className="pt-1">
          <CategorySelect form={form} index={index} categories={categories} />
        </div>

        {/* Price */}
        <div className="flex flex-col gap-1 pt-1">
          <PriceCell form={form} index={index} field="price_in_cents" />
          {errors?.price_in_cents && (
            <span className="text-xs text-destructive">{errors.price_in_cents.message}</span>
          )}
        </div>

        {/* Promo price */}
        <div className="pt-1">
          <PriceCell form={form} index={index} field="promo_price_in_cents" allowEmpty />
        </div>

        {/* Stock */}
        <div className="pt-1">
          <input
            type="number"
            min={0}
            placeholder="—"
            className={inputCls}
            {...form.register(`rows.${index}.stock`)}
          />
        </div>

        {/* Active toggle */}
        <div className="pt-1">
          <ActiveToggle name={`rows.${index}.is_active`} form={form} />
        </div>

        {/* Remove */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-z-border text-z-text-hint transition-colors hover:border-z-primary/30 hover:bg-z-primary/10 hover:text-z-primary disabled:opacity-30"
          >
            <HugeiconsIcon icon={DeleteIcon} size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const inputCls =
  'h-10 w-full rounded-lg border border-z-border bg-white px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20'

function ImageUploadButton({
  storeId,
  rowIndex,
  value,
  onChange,
  max,
}: {
  storeId: string
  rowIndex: number
  value: string[]
  onChange: (urls: string[]) => void
  max: number
}) {
  const inputId = `image-upload-${storeId}-${rowIndex}`

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Simple upload - you may want to integrate with your actual upload logic
    // For now, this is a placeholder that shows the concept
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (value.length < max) {
        onChange([...value, result])
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id={inputId}
      />
      <label
        htmlFor={inputId}
        className={cn(
          'flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-z-border bg-white px-3 text-sm font-medium text-z-text transition-colors hover:border-z-green hover:text-z-green',
        )}
      >
        <HugeiconsIcon icon={ImageIcon} size={16} />
        {value.length > 0 ? `${value.length}/${max}` : 'Adicionar foto'}
      </label>
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="flex h-10 items-center gap-2 rounded-lg border border-z-primary/30 bg-z-primary/10 px-3 text-sm font-medium text-z-primary transition-colors hover:bg-z-primary/15"
        >
          Limpar
        </button>
      )}
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-z-text-hint">{label}</label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}

function PriceCell({
  form,
  index,
  field,
  allowEmpty,
}: {
  form: ReturnType<typeof useForm<BulkInput>>
  index: number
  field: 'price_in_cents' | 'promo_price_in_cents'
  allowEmpty?: boolean
}) {
  return (
    <Controller
      control={form.control}
      name={`rows.${index}.${field}`}
      render={({ field: f }) => (
        <MoneyInput
          valueInCents={(f.value as number | null | undefined) ?? null}
          allowEmpty={allowEmpty}
          placeholder="R$ 0,00"
          className={inputCls}
          onChange={(cents) => f.onChange(allowEmpty ? cents : (cents ?? 0))}
        />
      )}
    />
  )
}

function CategorySelect({
  form,
  index,
  categories,
}: {
  form: ReturnType<typeof useForm<BulkInput>>
  index: number
  categories: string[]
}) {
  return (
    <select
      className={inputCls}
      {...form.register(`rows.${index}.category`)}
    >
      <option value="">Selecione...</option>
      {categories.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  )
}

function ActiveToggle({
  name,
  form,
}: {
  name: `rows.${number}.is_active`
  form: ReturnType<typeof useForm<BulkInput>>
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field: f }) => (
        <button
          type="button"
          onClick={() => f.onChange(!f.value)}
          className={cn(
            'h-10 w-full rounded-lg border px-3 text-sm font-medium transition-colors',
            f.value
              ? 'border-z-green/30 bg-z-green/10 text-z-green'
              : 'border-z-border bg-z-bg2 text-z-text-muted',
          )}
        >
          {f.value ? 'Ativo' : 'Inativo'}
        </button>
      )}
    />
  )
}
