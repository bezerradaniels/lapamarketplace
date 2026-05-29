import type { ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  InformationCircleIcon,
  ToggleOffIcon,
  ToggleOnIcon,
  CheckmarkCircle01Icon,
  ViewIcon,
  Edit01Icon,
  Store01Icon,
} from '@hugeicons/core-free-icons'
import { ProductImagesUploader } from '@/components/forms/ProductImagesUploader'
import { MoneyInput } from '@/components/forms/MoneyInput'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCategories, useCreateCategory } from '@/features/categories'
import { productSchema, type ProductInput } from '../schemas'
import { ROUTES } from '@/config/routes'
import { buildStorePath } from '@/lib/tenant'

type Props = {
  storeId: string
  storeSlug: string
  onClose: () => void
  onSubmit: (values: ProductInput) => Promise<string>
}

const DEFAULT_VALUES: ProductInput = {
  name: '',
  description: undefined,
  category: undefined,
  subcategory: undefined,
  brand: undefined,
  unit: 'Unidade',
  barcode: undefined,
  barcode_type: null,
  sku: undefined,
  auto_sku: true,
  condition: 'new',
  purchase_recurrence: null,
  has_no_brand: false,
  cost_in_cents: null,
  price_in_cents: 0,
  promo_price_in_cents: null,
  installment_count: null,
  installment_total_in_cents: null,
  is_active: true,
  is_featured: false,
  stock: null,
  images: [],
  has_variations: false,
  variation_type: null,
  variation_label: null,
  variation_options: null,
}

export function NewProductFullModal({
  storeId,
  storeSlug,
  onClose,
  onSubmit,
}: Props) {
  const navigate = useNavigate()
  const categoriesQuery = useCategories(storeId)
  const createCategoryMutation = useCreateCategory()
  const categories = categoriesQuery.data ?? []
  const topLevelCategories = categories.filter((category) => !category.parent_id)
  const [newCategoryOpen, setNewCategoryOpen] = useState(false)
  const [newSubcategoryOpen, setNewSubcategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const name = form.watch('name') ?? ''
  const description = form.watch('description') ?? ''
  const images = form.watch('images') ?? []
  const priceCents = form.watch('price_in_cents') ?? 0
  const promoCents = form.watch('promo_price_in_cents') ?? null
  const installmentCount = form.watch('installment_count') ?? null
  const installmentTotal = form.watch('installment_total_in_cents') ?? null
  const selectedCategory = form.watch('category')
  const selectedCategoryObj = categories.find((category) => category.name === selectedCategory)
  const availableSubcategories = categories.filter(
    (category) => category.parent_id === selectedCategoryObj?.id,
  )
  const autoSku = form.watch('auto_sku')
  const remainingNameChars = 120 - name.length
  const remainingDescriptionChars = 10000 - description.length

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return
    const category = await createCategoryMutation.mutateAsync({
      store_id: storeId,
      name,
    })
    form.setValue('category', category.name, { shouldDirty: true })
    form.setValue('subcategory', undefined, { shouldDirty: true })
    setNewCategoryName('')
    setNewCategoryOpen(false)
  }

  const handleCreateSubcategory = async () => {
    const name = newSubcategoryName.trim()
    if (!name || !selectedCategoryObj) return
    const subcategory = await createCategoryMutation.mutateAsync({
      store_id: storeId,
      name,
      parent_id: selectedCategoryObj.id,
    })
    form.setValue('subcategory', subcategory.name, { shouldDirty: true })
    setNewSubcategoryName('')
    setNewSubcategoryOpen(false)
  }

  const submit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      const productId = await onSubmit(values)
      setCreatedProductId(productId)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#f8fafc]">
      <div className="relative border-b border-z-border bg-white px-4 py-4">
        <div className="mx-auto max-w-[728px] text-center">
          <h2 className="text-xl font-bold tracking-tight text-[#263d6b]">
            Novo Produto
          </h2>
          <p className="mt-1 text-sm font-medium text-[#40558a]">
            Comece com as informações básicas
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-z-text-muted transition-colors hover:bg-z-bg2 hover:text-z-text"
          aria-label="Fechar"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </button>
      </div>

      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 pb-32">
          <div className="mx-auto flex w-full max-w-[728px] flex-col gap-8">
            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-[#263d6b]">Título e descrição</h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-base font-semibold text-[#40558a]">
                  Título
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    size={14}
                    className="ml-1 inline text-[#6f7da4]"
                  />
                </label>
                <input
                  maxLength={120}
                  placeholder="Ex: Figurinha"
                  className={cn(
                    'h-12 rounded-lg border bg-white px-4 text-base text-[#263d6b] placeholder:text-[#8a96ba] focus:outline-none focus:ring-2',
                    form.formState.errors.name
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                      : 'border-[#cfd8eb] focus:border-[#40558a] focus:ring-[#40558a]/15',
                  )}
                  {...form.register('name')}
                />
                <span className="text-sm font-medium text-[#7482aa]">
                  {remainingNameChars} caracteres restantes
                </span>
                {form.formState.errors.name && (
                  <span className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-base font-semibold text-[#40558a]">
                  Descrição
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    size={14}
                    className="ml-1 inline text-[#6f7da4]"
                  />
                </label>
                <textarea
                  rows={8}
                  maxLength={10000}
                  placeholder="Conte algo sobre o produto..."
                  className="min-h-[220px] resize-y rounded-lg border border-[#cfd8eb] bg-white px-4 py-3 text-base leading-relaxed text-[#263d6b] placeholder:text-[#8a96ba] focus:border-[#40558a] focus:outline-none focus:ring-2 focus:ring-[#40558a]/15"
                  {...form.register('description')}
                />
                <span className="text-sm font-medium text-[#7482aa]">
                  {remainingDescriptionChars} caracteres restantes
                </span>
                {form.formState.errors.description && (
                  <span className="text-xs text-destructive">
                    {form.formState.errors.description.message}
                  </span>
                )}
              </div>
            </section>

            <SectionDivider />

            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-[#263d6b]">Fotos</h3>
              <div className="rounded-2xl border-2 border-dashed border-emerald-100 bg-white p-4">
                <ProductImagesUploader
                  storeId={storeId}
                  value={images}
                  max={10}
                  onChange={(urls) =>
                    form.setValue('images', urls, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />
              </div>
              {form.formState.errors.images && (
                <span className="text-xs text-destructive">
                  {form.formState.errors.images.message as string}
                </span>
              )}
            </section>

            <SectionDivider />

            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-[#263d6b]">Preço</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Preço</FieldLabel>
                  <MoneyInput
                    valueInCents={null}
                    placeholder="R$ 0,00"
                    className={cn(
                      'h-12 rounded-lg border bg-white px-4 text-base text-[#263d6b] placeholder:text-[#8a96ba] focus:outline-none focus:ring-2',
                      form.formState.errors.price_in_cents
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                        : 'border-[#cfd8eb] focus:border-[#40558a] focus:ring-[#40558a]/15',
                    )}
                    onChange={(cents) =>
                      form.setValue('price_in_cents', cents ?? 0, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                  {form.formState.errors.price_in_cents && (
                    <span className="text-xs text-destructive">
                      {form.formState.errors.price_in_cents.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Preço promocional</FieldLabel>
                  <MoneyInput
                    valueInCents={null}
                    allowEmpty
                    placeholder="Opcional"
                    className={cn(
                      'h-12 rounded-lg border bg-white px-4 text-base text-[#263d6b] placeholder:text-[#8a96ba] focus:outline-none focus:ring-2',
                      form.formState.errors.promo_price_in_cents
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                        : 'border-[#cfd8eb] focus:border-[#40558a] focus:ring-[#40558a]/15',
                    )}
                    onChange={(cents) =>
                      form.setValue('promo_price_in_cents', cents, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                  {form.formState.errors.promo_price_in_cents && (
                    <span className="text-xs text-destructive">
                      {form.formState.errors.promo_price_in_cents.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Parcelamento */}
              <div className="flex flex-col gap-3 rounded-xl border border-[#cfd8eb] bg-[#f8fafc] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#263d6b]">Parcelamento</p>
                    <p className="text-xs text-[#8a96ba]">
                      Exibe opção de parcelamento no catálogo
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (installmentCount != null) {
                        form.setValue('installment_count', null, { shouldDirty: true })
                        form.setValue('installment_total_in_cents', null, { shouldDirty: true })
                      } else {
                        form.setValue('installment_count', 2, { shouldDirty: true })
                        form.setValue('installment_total_in_cents', promoCents ?? priceCents ?? null, { shouldDirty: true })
                      }
                    }}
                    className="shrink-0"
                  >
                    <HugeiconsIcon
                      icon={installmentCount != null ? ToggleOnIcon : ToggleOffIcon}
                      size={28}
                      className={installmentCount != null ? 'text-[#40558a]' : 'text-[#8a96ba]'}
                    />
                  </button>
                </div>

                {installmentCount != null && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-[#8a96ba]">
                          Valor parcelado
                        </span>
                        <MoneyInput
                          valueInCents={installmentTotal}
                          allowEmpty
                          placeholder="R$ 0,00"
                          className="h-11 w-full rounded-lg border border-[#cfd8eb] bg-white px-4 text-sm text-[#263d6b] placeholder:text-[#8a96ba] focus:border-[#40558a] focus:outline-none focus:ring-2 focus:ring-[#40558a]/15"
                          onChange={(cents) =>
                            form.setValue('installment_total_in_cents', cents, { shouldDirty: true })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-[#8a96ba]">
                          Em até
                        </span>
                        <select
                          value={installmentCount ?? 2}
                          onChange={(e) =>
                            form.setValue('installment_count', Number(e.target.value), { shouldDirty: true })
                          }
                          className="h-11 w-full rounded-lg border border-[#cfd8eb] bg-white px-3 text-sm text-[#263d6b] focus:border-[#40558a] focus:outline-none focus:ring-2 focus:ring-[#40558a]/15"
                        >
                          {Array.from({ length: 23 }, (_, i) => i + 2).map((n) => (
                            <option key={n} value={n}>{n}x</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {priceCents > 0 && installmentCount != null && installmentTotal != null && (
                      <div className="rounded-xl border border-[#cfd8eb] bg-white p-4">
                        <p className="mb-2 text-[10px] font-semibold text-[#8a96ba]">
                          Preview no catálogo
                        </p>
                        <div className="flex flex-col gap-0.5">
                          {promoCents != null && promoCents < priceCents && (
                            <span className="text-sm text-[#8a96ba] line-through">
                              {formatMoney(priceCents)}
                            </span>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-[#263d6b]">
                              {formatMoney(promoCents ?? priceCents)}
                            </span>
                            {promoCents != null && promoCents < priceCents && (
                              <span className="rounded-full bg-[#e6f7ef] px-2 py-0.5 text-[11px] font-bold text-[#02a650]">
                                {Math.round((1 - promoCents / priceCents) * 100)}% OFF
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-[#8a96ba]">
                            ou{' '}
                            <strong className="font-semibold text-[#263d6b]">
                              {installmentCount}x de {formatMoney(Math.ceil(installmentTotal / installmentCount))}
                            </strong>
                            {installmentTotal <= (promoCents ?? priceCents) && (
                              <span className="font-semibold text-[#02a650]"> sem juros</span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <SectionDivider />

            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-[#263d6b]">Categoria</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Categoria</FieldLabel>
                  <select
                    className="h-12 rounded-lg border border-[#cfd8eb] bg-white px-4 text-base text-[#263d6b] focus:border-[#40558a] focus:outline-none focus:ring-2 focus:ring-[#40558a]/15"
                    value={selectedCategory ?? ''}
                    onChange={(event) => {
                      if (event.target.value === '__ADD_CATEGORY__') {
                        setNewCategoryOpen(true)
                        return
                      }
                      form.setValue('category', event.target.value || undefined, {
                        shouldDirty: true,
                      })
                      form.setValue('subcategory', undefined, { shouldDirty: true })
                    }}
                  >
                    <option value="">Selecione uma categoria</option>
                    {selectedCategory &&
                      !topLevelCategories.some(
                        (category) => category.name === selectedCategory,
                      ) && <option value={selectedCategory}>{selectedCategory}</option>}
                    {topLevelCategories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                    <option value="__ADD_CATEGORY__">+ Criar nova categoria</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Subcategoria</FieldLabel>
                  <select
                    className="h-12 rounded-lg border border-[#cfd8eb] bg-white px-4 text-base text-[#263d6b] focus:border-[#40558a] focus:outline-none focus:ring-2 focus:ring-[#40558a]/15 disabled:bg-z-bg disabled:text-z-text-hint"
                    disabled={!selectedCategory}
                    value={form.watch('subcategory') ?? ''}
                    onChange={(event) => {
                      if (event.target.value === '__ADD_SUBCATEGORY__') {
                        setNewSubcategoryOpen(true)
                        return
                      }
                      form.setValue('subcategory', event.target.value || undefined, {
                        shouldDirty: true,
                      })
                    }}
                  >
                    <option value="">Selecione uma subcategoria</option>
                    {form.watch('subcategory') &&
                      !availableSubcategories.some(
                        (subcategory) => subcategory.name === form.watch('subcategory'),
                      ) && (
                        <option value={form.watch('subcategory')}>
                          {form.watch('subcategory')}
                        </option>
                      )}
                    {availableSubcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.name}>
                        {subcategory.name}
                      </option>
                    ))}
                    {selectedCategory && (
                      <option value="__ADD_SUBCATEGORY__">+ Criar nova subcategoria</option>
                    )}
                  </select>
                </div>
              </div>
            </section>

            <SectionDivider />

            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-[#263d6b]">
                Códigos de identificação
              </h3>
              <div className="max-w-sm">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Código interno (SKU)</FieldLabel>
                  <input
                    placeholder="Seu código interno (SKU)"
                    disabled={autoSku}
                    value={autoSku ? '' : undefined}
                    className="h-12 rounded-lg border border-[#cfd8eb] bg-white px-4 text-base text-[#263d6b] placeholder:text-[#8a96ba] focus:border-[#40558a] focus:outline-none focus:ring-2 focus:ring-[#40558a]/15 disabled:bg-z-bg disabled:text-z-text-hint"
                    {...(autoSku ? {} : form.register('sku'))}
                  />
                  <Controller
                    control={form.control}
                    name="auto_sku"
                    render={({ field }) => (
                      <label className="mt-1 flex cursor-pointer items-center gap-2 text-sm font-medium text-[#263d6b]">
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className="text-z-green"
                        >
                          <HugeiconsIcon
                            icon={field.value ? ToggleOnIcon : ToggleOffIcon}
                            size={28}
                            className={field.value ? 'text-z-green' : 'text-z-text-hint'}
                          />
                        </button>
                        Gerar automaticamente
                      </label>
                    )}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="border-t border-z-border bg-white px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)]">
          <div className="mx-auto flex max-w-[728px] justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-[#10b981] px-7 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0ea371] disabled:opacity-60"
            >
              {isSubmitting && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </div>
      </form>

      {createdProductId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f7ef]">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={26} className="text-[#10b981]" />
              </div>
              <h3 className="text-lg font-bold text-[#263d6b]">Produto cadastrado!</h3>
              <p className="text-sm text-[#8a96ba]">O que deseja fazer agora?</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  navigate(`${ROUTES.dashboardProducts}/${createdProductId}`)
                }}
                className="flex items-center gap-3 rounded-xl border border-[#cfd8eb] bg-white px-4 py-3 text-left text-sm font-medium text-[#263d6b] transition-colors hover:border-[#40558a] hover:bg-[#f0f4ff]"
              >
                <HugeiconsIcon icon={ViewIcon} size={18} className="shrink-0 text-[#40558a]" />
                <div>
                  <p className="font-semibold">Ver produto</p>
                  <p className="text-xs font-normal text-[#8a96ba]">Confira como ficou o cadastro</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  navigate(`${ROUTES.dashboardProducts}/${createdProductId}?tab=info`)
                }}
                className="flex items-center gap-3 rounded-xl border border-[#cfd8eb] bg-white px-4 py-3 text-left text-sm font-medium text-[#263d6b] transition-colors hover:border-[#40558a] hover:bg-[#f0f4ff]"
              >
                <HugeiconsIcon icon={Edit01Icon} size={18} className="shrink-0 text-[#40558a]" />
                <div>
                  <p className="font-semibold">Adicionar detalhes</p>
                  <p className="text-xs font-normal text-[#8a96ba]">Descrição, fotos, variações e mais</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  window.open(buildStorePath(storeSlug), '_blank')
                }}
                className="flex items-center gap-3 rounded-xl border border-[#cfd8eb] bg-white px-4 py-3 text-left text-sm font-medium text-[#263d6b] transition-colors hover:border-[#40558a] hover:bg-[#f0f4ff]"
              >
                <HugeiconsIcon icon={Store01Icon} size={18} className="shrink-0 text-[#40558a]" />
                <div>
                  <p className="font-semibold">Ir para o catálogo</p>
                  <p className="text-xs font-normal text-[#8a96ba]">Veja seu produto publicado</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {newCategoryOpen && (
        <CreateCategoryDialog
          title="Nova categoria"
          value={newCategoryName}
          isSubmitting={createCategoryMutation.isPending}
          onChange={setNewCategoryName}
          onClose={() => {
            setNewCategoryOpen(false)
            setNewCategoryName('')
          }}
          onCreate={handleCreateCategory}
        />
      )}

      {newSubcategoryOpen && (
        <CreateCategoryDialog
          title="Nova subcategoria"
          helper={
            selectedCategory
              ? `Será criada dentro de ${selectedCategory}.`
              : 'Selecione uma categoria antes de criar a subcategoria.'
          }
          value={newSubcategoryName}
          isSubmitting={createCategoryMutation.isPending}
          onChange={setNewSubcategoryName}
          onClose={() => {
            setNewSubcategoryOpen(false)
            setNewSubcategoryName('')
          }}
          onCreate={handleCreateSubcategory}
        />
      )}
    </div>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-base font-semibold text-[#40558a]">
      {children}
      <HugeiconsIcon
        icon={InformationCircleIcon}
        size={14}
        className="ml-1 inline text-[#6f7da4]"
      />
    </label>
  )
}

function SectionDivider() {
  return <div className="h-px bg-[#d8dfef]" />
}

function CreateCategoryDialog({
  title,
  helper,
  value,
  isSubmitting,
  onChange,
  onClose,
  onCreate,
}: {
  title: string
  helper?: string
  value: string
  isSubmitting?: boolean
  onChange: (value: string) => void
  onClose: () => void
  onCreate: () => void
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="font-semibold text-z-text">{title}</h3>
        {helper && <p className="mt-1 text-sm text-z-text-muted">{helper}</p>}
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Nome"
          className="mt-4 h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
          onKeyDown={(event) => {
            if (event.key === 'Enter') onCreate()
            if (event.key === 'Escape') onClose()
          }}
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-z-border px-4 py-2.5 text-sm font-medium text-z-text-muted hover:bg-z-bg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onCreate}
            disabled={!value.trim() || isSubmitting}
            className="flex-1 rounded-xl bg-z-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60"
          >
            {isSubmitting ? 'Criando...' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}
