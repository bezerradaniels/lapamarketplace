import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  InformationCircleIcon,
  Add01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons'
import { useCreateSellerCatalog } from '@/features/sellers'
import { useProducts } from '@/features/products'
import { cn } from '@/lib/utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 40)
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  catalog_slug: z.string().min(1, 'Endereço obrigatório').regex(/^[a-z0-9]+$/, 'Use apenas letras e números'),
  whatsapp_phone: z.string().optional(),
  use_store_whatsapp: z.boolean(),
  contact_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  catalog_products: z.enum(['all', 'specific']),
  specific_product_ids: z.array(z.string()),
  has_dashboard_access: z.boolean(),
})

type FormValues = z.infer<typeof schema>

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        checked ? 'bg-z-green' : 'bg-z-border',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}

// ─── Product picker ───────────────────────────────────────────────────────────

type ProductPickerProps = {
  storeId: string
  selected: string[]
  onChange: (ids: string[]) => void
}

function ProductPicker({ storeId, selected, onChange }: ProductPickerProps) {
  const products = useProducts(storeId)
  const [search, setSearch] = useState('')

  const all = products.data ?? []
  const filtered = all.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  const selectedProducts = all.filter((p) => selected.includes(p.id))

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProducts.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1.5 rounded-full border border-z-border bg-z-bg2 px-2.5 py-1 text-xs font-medium"
            >
              {p.name}
              <button type="button" onClick={() => toggle(p.id)} className="text-z-text-hint hover:text-z-primary">
                <HugeiconsIcon icon={Cancel01Icon} size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar produto..."
          className="h-9 w-full rounded-lg border border-z-border bg-white px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none"
        />
      </div>
      {search && (
        <ul className="max-h-48 overflow-y-auto rounded-lg border border-z-border bg-white">
          {filtered.slice(0, 30).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => toggle(p.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-z-bg2',
                  selected.includes(p.id) && 'bg-indigo-50',
                )}
              >
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="h-8 w-8 shrink-0 rounded object-cover" />
                ) : (
                  <div className="h-8 w-8 shrink-0 rounded bg-z-bg2" />
                )}
                <span className="flex-1 text-left line-clamp-1">{p.name}</span>
                {selected.includes(p.id) && (
                  <HugeiconsIcon icon={Cancel01Icon} size={12} className="shrink-0 text-z-primary" />
                )}
                {!selected.includes(p.id) && (
                  <HugeiconsIcon icon={Add01Icon} size={12} className="shrink-0 text-z-green" />
                )}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-3 text-center text-xs text-z-text-muted">Nenhum produto encontrado.</li>
          )}
        </ul>
      )}
    </div>
  )
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onClose: () => void
  storeId: string
  storeSlug: string
  storeWhatsapp: string
}

export function NewSellerModal({ open, ...props }: Props) {
  // Gate before mounting so all hooks live in NewSellerModalContent, which is
  // only rendered while the modal is open. This keeps the hook call order
  // stable (rules-of-hooks) and resets form state each time it reopens.
  if (!open) return null
  return <NewSellerModalContent {...props} />
}

function NewSellerModalContent({ onClose, storeId, storeSlug, storeWhatsapp }: Omit<Props, 'open'>) {
  const createCatalog = useCreateSellerCatalog(storeId)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      catalog_slug: '',
      whatsapp_phone: '',
      use_store_whatsapp: true,
      contact_email: '',
      catalog_products: 'all',
      specific_product_ids: [],
      has_dashboard_access: false,
    } as FormValues,
  })

  const name = watch('name')
  const useStoreWhatsapp = watch('use_store_whatsapp')
  const catalogProducts = watch('catalog_products')
  const hasDashboardAccess = watch('has_dashboard_access')
  const slugValue = watch('catalog_slug')

  // Auto-generate slug from name (only if user hasn't manually edited it)
  const [slugEdited, setSlugEdited] = useState(false)
  useEffect(() => {
    if (!slugEdited) setValue('catalog_slug', toSlug(name))
  }, [name, slugEdited, setValue])

  const storeBaseUrl = storeSlug ? `https://lapamarketplace.com.br/${storeSlug}` : ''
  const catalogUrl = `${storeBaseUrl}/s/${slugValue || '...'}`

  async function onSubmit(values: FormValues) {
    await createCatalog.mutateAsync({
      name: values.name,
      catalog_slug: values.catalog_slug,
      whatsapp_phone: values.use_store_whatsapp ? null : (values.whatsapp_phone || null),
      use_store_whatsapp: values.use_store_whatsapp,
      contact_email: values.contact_email || null,
      catalog_products: values.catalog_products,
      specific_product_ids: values.specific_product_ids,
      has_dashboard_access: values.has_dashboard_access,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-z-pop">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-z-border px-6 py-4">
          <h2 className="text-base font-semibold text-z-text">Cadastrar novo vendedor</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted transition-colors hover:bg-z-bg2 hover:text-z-text"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-start gap-4 p-6">
              {/* Left column */}
              <div className="flex flex-1 flex-col gap-4">
                {/* Catalog info */}
                <section className="rounded-2xl border border-z-border bg-white p-6">
                  <div className="mb-5 flex items-center gap-2 text-sm font-semibold">
                    <HugeiconsIcon icon={Add01Icon} size={16} className="text-z-text-muted" />
                    Catálogo do Vendedor
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Name */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-z-text-muted">
                        Nome do vendedor
                        <HugeiconsIcon icon={InformationCircleIcon} size={13} className="text-z-text-hint" />
                      </label>
                      <input
                        {...register('name')}
                        placeholder="Digite o nome dele aqui"
                        className={cn(
                          'h-10 w-full rounded-lg border bg-white px-3 text-sm placeholder:text-z-text-hint focus:outline-none focus:border-z-green',
                          errors.name ? 'border-rose-400' : 'border-z-border',
                        )}
                      />
                      {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-z-text-muted">
                        WhatsApp do vendedor
                        <HugeiconsIcon icon={InformationCircleIcon} size={13} className="text-z-text-hint" />
                      </label>
                      <div className={cn(
                        'flex h-10 overflow-hidden rounded-lg border focus-within:border-z-green',
                        useStoreWhatsapp ? 'border-z-border bg-z-bg2 opacity-60' : 'border-z-border',
                      )}>
                        <span className="flex items-center border-r border-z-border bg-z-bg2 px-3 text-sm text-z-text-muted">+55</span>
                        <input
                          {...register('whatsapp_phone')}
                          disabled={useStoreWhatsapp}
                          placeholder={useStoreWhatsapp && storeWhatsapp ? storeWhatsapp.replace('+55', '') : '(61) 99999-9999'}
                          className="flex-1 bg-transparent px-3 text-sm placeholder:text-z-text-hint focus:outline-none disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <label className="text-xs text-z-text-muted">Usar o mesmo WhatsApp da loja</label>
                        <Controller
                          name="use_store_whatsapp"
                          control={control}
                          render={({ field }) => (
                            <Toggle checked={field.value} onChange={field.onChange} />
                          )}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-z-text-muted">
                        E-mail para contato (opcional)
                        <HugeiconsIcon icon={InformationCircleIcon} size={13} className="text-z-text-hint" />
                      </label>
                      <input
                        {...register('contact_email')}
                        type="email"
                        placeholder="vendedor@provedor.com"
                        className="h-10 w-full rounded-lg border border-z-border bg-white px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none"
                      />
                      {errors.contact_email && <p className="mt-1 text-xs text-rose-500">{errors.contact_email.message}</p>}
                    </div>

                    {/* Catalog slug */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-z-text-muted">
                        Endereço do catálogo do vendedor
                        <HugeiconsIcon icon={InformationCircleIcon} size={13} className="text-z-text-hint" />
                      </label>
                      <div className={cn(
                        'flex h-10 overflow-hidden rounded-lg border focus-within:border-z-green',
                        errors.catalog_slug ? 'border-rose-400' : 'border-z-border',
                      )}>
                        <span className="flex items-center whitespace-nowrap border-r border-z-border bg-z-bg2 px-3 text-xs text-z-text-muted">
                          {storeBaseUrl.replace(/^https?:\/\//, '')}/s/
                        </span>
                        <input
                          {...register('catalog_slug', {
                            onChange: () => setSlugEdited(true),
                          })}
                          placeholder="nome-do-vendedor"
                          className="flex-1 bg-white px-3 text-sm placeholder:text-z-text-hint focus:outline-none"
                        />
                      </div>
                      {errors.catalog_slug && <p className="mt-1 text-xs text-rose-500">{errors.catalog_slug.message}</p>}
                      {slugValue && (
                        <p className="mt-1 truncate text-xs text-z-text-hint">
                          {catalogUrl}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Dashboard access */}
                <section className="rounded-2xl border border-z-border bg-white p-6">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <HugeiconsIcon icon={Add01Icon} size={16} className="text-z-text-muted" />
                    Conceder acesso ao Lapa Marketplace
                  </div>
                  <p className="mb-4 text-xs text-z-text-muted">
                    Conceder acesso a este vendedor para que ele possa acessar o seu Lapa Marketplace.
                  </p>
                  <div className="flex items-center justify-between rounded-xl border border-z-border px-4 py-3">
                    <label className="text-sm text-z-text">Habilitar acesso ao Lapa Marketplace para Vendedores</label>
                    <Controller
                      name="has_dashboard_access"
                      control={control}
                      render={({ field }) => (
                        <Toggle checked={field.value} onChange={field.onChange} />
                      )}
                    />
                  </div>
                  {hasDashboardAccess && (
                    <p className="mt-3 text-xs text-z-text-muted">
                      Após salvar, o vendedor receberá instruções de acesso no e-mail cadastrado (se fornecido).
                    </p>
                  )}
                </section>
              </div>

              {/* Right column */}
              <div className="w-72 shrink-0 rounded-2xl border border-z-border bg-white p-5">
                <p className="mb-3 flex items-center gap-1 text-sm font-semibold">
                  Produtos que serão exibidos no catálogo deste vendedor:
                  <HugeiconsIcon icon={InformationCircleIcon} size={14} className="text-z-text-hint" />
                </p>

                <div className="flex flex-col gap-2">
                  <Controller
                    name="catalog_products"
                    control={control}
                    render={({ field }) => (
                      <>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="radio"
                            value="all"
                            checked={field.value === 'all'}
                            onChange={() => field.onChange('all')}
                            className="accent-z-green"
                          />
                          Todos os produtos da loja
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="radio"
                            value="specific"
                            checked={field.value === 'specific'}
                            onChange={() => field.onChange('specific')}
                            className="accent-z-green"
                          />
                          Apenas produtos específicos
                        </label>
                      </>
                    )}
                  />
                </div>

                {catalogProducts === 'all' && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-3">
                    <span className="text-lg">💡</span>
                    <p className="text-xs text-z-text-muted">
                      Todos os produtos serão mostrados no catálogo deste vendedor.
                    </p>
                  </div>
                )}

                {catalogProducts === 'specific' && (
                  <Controller
                    name="specific_product_ids"
                    control={control}
                    render={({ field }) => (
                      <ProductPicker
                        storeId={storeId}
                        selected={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-z-border px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-full border border-z-border px-6 text-sm font-medium text-z-text-muted hover:bg-z-bg2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-full bg-z-green px-8 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar vendedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
