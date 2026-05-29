import { useState, useRef, type KeyboardEvent } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Camera02Icon,
  Delete02Icon,
  Add01Icon,
  Search01Icon,
  Cancel01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { Link } from 'react-router-dom'
import { useMembers } from '@/features/sellers'
import { useProducts } from '@/features/products'
import { usePlanLimits } from '@/features/billing'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'
import { customerSchema, type CustomerFormValues } from '../schemas/customerSchema'
import type { Customer } from '../types'
import { ProductRichTextEditor } from '@/features/products/components/ProductRichTextEditor'

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'kwai', label: 'Kwai' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
] as const

type Props = {
  storeId: string
  initial?: Customer
  onSubmit: (values: CustomerFormValues) => Promise<void>
  onCancel: () => void
  onDelete?: () => void
}

export function CustomerForm({ storeId, initial, onSubmit, onCancel, onDelete }: Props) {
  const members = useMembers(storeId)
  const products = useProducts(storeId)
  usePlanLimits(storeId)

  const [socialPlatform, setSocialPlatform] = useState<string>('instagram')
  const [socialValue, setSocialValue] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [categoryInput, setCategoryInput] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showProductSearch, setShowProductSearch] = useState(false)
  const productSearchRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initial?.name ?? '',
      whatsapp_phone: initial?.whatsapp_phone ?? '',
      secondary_phone: initial?.secondary_phone ?? '',
      cpf_cnpj_type: initial?.cpf_cnpj_type ?? 'cpf',
      cpf_cnpj: initial?.cpf_cnpj ?? '',
      birthday: initial?.birthday ?? '',
      email: initial?.email ?? '',
      website: initial?.website ?? '',
      social_links: initial?.social_links ?? [],
      profile_notes: initial?.profile_notes ?? '',
      seller_id: initial?.seller_id ?? null,
      tags: initial?.tags ?? [],
      category_interests: initial?.category_interests ?? [],
      product_interests: initial?.product_interests ?? [],
    },
  })

  const socialLinks = watch('social_links')
  const tags = watch('tags')
  const categoryInterests = watch('category_interests')
  const productInterests = watch('product_interests')

  function addSocialLink() {
    if (!socialValue.trim()) return
    setValue('social_links', [
      ...socialLinks,
      { platform: socialPlatform as CustomerFormValues['social_links'][number]['platform'], value: socialValue.trim() },
    ])
    setSocialValue('')
  }

  function removeSocialLink(index: number) {
    setValue('social_links', socialLinks.filter((_, i) => i !== index))
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const tag = tagInput.trim()
    if (!tag || tags.includes(tag)) return
    setValue('tags', [...tags, tag])
    setTagInput('')
  }

  function removeTag(tag: string) {
    setValue('tags', tags.filter((t) => t !== tag))
  }

  function addCategory(category: string) {
    const cat = category.trim()
    if (!cat || categoryInterests.includes(cat)) return
    setValue('category_interests', [...categoryInterests, cat])
    setCategoryInput('')
  }

  function removeCategory(cat: string) {
    setValue('category_interests', categoryInterests.filter((c) => c !== cat))
  }

  function toggleProductInterest(productId: string) {
    if (productInterests.includes(productId)) {
      setValue('product_interests', productInterests.filter((id) => id !== productId))
    } else {
      setValue('product_interests', [...productInterests, productId])
    }
  }

  const allProducts = products.data ?? []
  const filteredProducts = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
      !productInterests.includes(p.id),
  )
  const selectedProducts = allProducts.filter((p) => productInterests.includes(p.id))

  // Extract unique categories from products
  const allCategories = Array.from(
    new Set(allProducts.map((p) => p.category).filter(Boolean)),
  ) as string[]
  const filteredCategories = allCategories.filter(
    (c) => c.toLowerCase().includes(categoryInput.toLowerCase()) && !categoryInterests.includes(c),
  )

  const sellers = (members.data ?? []).filter((m) => m.role === 'seller' || m.role === 'owner')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-0">
      <div className="flex gap-6 px-6 py-8">
        {/* Left column */}
        <div className="flex flex-1 flex-col gap-6 min-w-0">
          {/* Personal info */}
          <section className="rounded-2xl border border-z-border bg-white p-6">
            <div className="mb-5 flex items-center gap-2 text-base font-semibold">
              <HugeiconsIcon icon={UserIcon} size={18} className="text-z-text-muted" />
              Informações pessoais
            </div>

            {/* Avatar placeholder */}
            <div className="mb-6 flex items-center">
              <button
                type="button"
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-z-border bg-z-bg2 text-z-text-hint transition-colors hover:border-z-green hover:text-z-green"
              >
                <HugeiconsIcon icon={Camera02Icon} size={22} />
              </button>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-z-text-muted">
                Nome do cliente <span className="text-rose-500">*</span>
              </label>
              <input
                {...register('name')}
                placeholder="Nome completo"
                className={cn(
                  'h-10 w-full rounded-lg border bg-white px-3 text-sm placeholder:text-z-text-hint focus:outline-none focus:border-z-green',
                  errors.name ? 'border-rose-400' : 'border-z-border',
                )}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>
              )}
            </div>

            {/* Phones */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-z-text-muted">
                  WhatsApp <span className="text-rose-500">*</span>
                </label>
                <div className="flex h-10 overflow-hidden rounded-lg border border-z-border focus-within:border-z-green">
                  <span className="flex items-center border-r border-z-border bg-z-bg2 px-3 text-sm text-z-text-muted">
                    +55
                  </span>
                  <input
                    {...register('whatsapp_phone')}
                    placeholder="(77) 99999-9999"
                    className="flex-1 bg-white px-3 text-sm placeholder:text-z-text-hint focus:outline-none"
                  />
                </div>
                {errors.whatsapp_phone && (
                  <p className="mt-1 text-xs text-rose-500">{errors.whatsapp_phone.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-z-text-muted">
                  Telefone secundário
                </label>
                <div className="flex h-10 overflow-hidden rounded-lg border border-z-border focus-within:border-z-green">
                  <span className="flex items-center border-r border-z-border bg-z-bg2 px-3 text-sm text-z-text-muted">
                    +55
                  </span>
                  <input
                    {...register('secondary_phone')}
                    placeholder="Digite aqui"
                    className="flex-1 bg-white px-3 text-sm placeholder:text-z-text-hint focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* CPF/CNPJ */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1.5 flex items-center gap-3">
                  <Controller
                    name="cpf_cnpj_type"
                    control={control}
                    render={({ field }) => (
                      <>
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium">
                          <input
                            type="radio"
                            value="cpf"
                            checked={field.value === 'cpf'}
                            onChange={() => field.onChange('cpf')}
                            className="accent-z-green"
                          />
                          CPF
                        </label>
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium">
                          <input
                            type="radio"
                            value="cnpj"
                            checked={field.value === 'cnpj'}
                            onChange={() => field.onChange('cnpj')}
                            className="accent-z-green"
                          />
                          CNPJ
                        </label>
                      </>
                    )}
                  />
                </div>
                <input
                  {...register('cpf_cnpj')}
                  placeholder="Documento do cliente no pedido"
                  className="h-10 w-full rounded-lg border border-z-border bg-white px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-z-text-muted">
                  Aniversário
                </label>
                <input
                  {...register('birthday')}
                  placeholder="25/12"
                  maxLength={5}
                  className={cn(
                    'h-10 w-full rounded-lg border bg-white px-3 text-sm placeholder:text-z-text-hint focus:outline-none focus:border-z-green',
                    errors.birthday ? 'border-rose-400' : 'border-z-border',
                  )}
                />
                {errors.birthday && (
                  <p className="mt-1 text-xs text-rose-500">{errors.birthday.message}</p>
                )}
              </div>
            </div>

            {/* Email & Site */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-z-text-muted">
                  E-mail
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="email@email.com"
                  className="h-10 w-full rounded-lg border border-z-border bg-white px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-z-text-muted">
                  Site
                </label>
                <input
                  {...register('website')}
                  placeholder="https://site.com"
                  className="h-10 w-full rounded-lg border border-z-border bg-white px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none"
                />
              </div>
            </div>

            {/* Social links */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-z-text-muted">
                Adicione os links das redes sociais do seu cliente
              </label>
              <div className="flex gap-2">
                <div className="flex h-10 overflow-hidden rounded-lg border border-z-border focus-within:border-z-green">
                  <select
                    value={socialPlatform}
                    onChange={(e) => setSocialPlatform(e.target.value)}
                    className="border-r border-z-border bg-z-bg2 px-2 text-xs text-z-text-muted focus:outline-none"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={socialValue}
                    onChange={(e) => setSocialValue(e.target.value)}
                    placeholder="Cole o link do perfil ou nome de usuário"
                    className="flex-1 bg-white px-3 text-sm placeholder:text-z-text-hint focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSocialLink())}
                  />
                </div>
                <button
                  type="button"
                  onClick={addSocialLink}
                  className="h-10 rounded-lg border border-z-border bg-z-bg2 px-3 text-xs font-medium text-z-text-muted transition-colors hover:bg-z-border"
                >
                  Adicionar
                </button>
              </div>
              {socialLinks.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {socialLinks.map((sl, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-z-text-muted">
                      <span className="font-medium capitalize">{sl.platform}:</span>
                      <span className="flex-1 truncate">{sl.value}</span>
                      <button
                        type="button"
                        onClick={() => removeSocialLink(i)}
                        className="text-z-text-hint hover:text-z-primary"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Profile notes */}
          <section className="rounded-2xl border border-z-border bg-white p-6">
            <div className="mb-1">
              <p className="text-base font-semibold">Perfil do cliente e observações</p>
            </div>
            <p className="mb-3 text-xs text-z-text-muted">
              Adicione aqui informações relevantes que podem ser usadas para gerar vendas para este cliente
            </p>
            <Controller
              name="profile_notes"
              control={control}
              render={({ field }) => (
                <ProductRichTextEditor
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="Escreva o perfil e observações do cliente..."
                />
              )}
            />
          </section>
        </div>

        {/* Right column */}
        <div className="flex w-72 shrink-0 flex-col gap-4">
          {/* Seller */}
          <section className="rounded-2xl border border-z-border bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Vendedor responsável</p>
              <Link
                to={ROUTES.dashboardSellers}
                className="text-xs font-medium text-z-green hover:underline"
              >
                Gerenciar vendedores
              </Link>
            </div>
            <label className="mb-1 block text-xs text-z-text-muted">Vendedor</label>
            <Controller
              name="seller_id"
              control={control}
              render={({ field }) => (
                <select
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  className="h-10 w-full rounded-lg border border-z-border bg-white px-3 text-sm text-z-text focus:border-z-green focus:outline-none"
                >
                  <option value="">Selecione o vendedor</option>
                  {sellers.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.name ?? s.email}
                    </option>
                  ))}
                </select>
              )}
            />
          </section>

          {/* Tags */}
          <section className="rounded-2xl border border-z-border bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Tags</p>
            </div>
            <p className="mb-2 text-xs text-z-text-muted">
              Adicione tags para facilitar a categorização dos seus clientes
            </p>
            <div className="flex h-10 items-center overflow-hidden rounded-lg border border-z-border focus-within:border-z-green">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Digite a tag e pressione enter"
                className="flex-1 bg-white px-3 text-sm placeholder:text-z-text-hint focus:outline-none"
              />
              <HugeiconsIcon icon={Search01Icon} size={14} className="mr-3 text-z-primary" />
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-z-bg2 px-2.5 py-1 text-xs font-medium text-z-text"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-z-text-hint hover:text-z-primary">
                      <HugeiconsIcon icon={Cancel01Icon} size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Category interests */}
          <section className="rounded-2xl border border-z-border bg-white p-5">
            <div className="mb-1 flex items-center gap-2">
              <p className="text-sm font-semibold">Categorias e subcategorias de interesse</p>
            </div>
            <p className="mb-2 text-xs text-z-text-muted">
              Vincule categorias e subcategorias de produtos nos quais seu cliente tem interesse
            </p>
            <div className="relative">
              <select
                value=""
                onChange={(e) => addCategory(e.target.value)}
                className="h-10 w-full rounded-lg border border-z-border bg-white px-3 text-sm text-z-text-muted focus:border-z-green focus:outline-none"
              >
                <option value="">Selecione ou pesquise uma categoria</option>
                {filteredCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {categoryInterests.length > 0 && (
              <div className="mt-2">
                <p className="mb-1.5 text-xs font-medium text-z-text-muted">Categorias:</p>
                <div className="flex flex-wrap gap-1.5">
                  {categoryInterests.map((cat) => (
                    <span
                      key={cat}
                      className="flex items-center gap-1 rounded-full bg-z-bg2 px-2.5 py-1 text-xs font-medium text-z-text"
                    >
                      {cat}
                      <button type="button" onClick={() => removeCategory(cat)} className="text-z-text-hint hover:text-z-primary">
                        <HugeiconsIcon icon={Cancel01Icon} size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Product interests */}
          <section className="rounded-2xl border border-z-border bg-white p-5">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-semibold">Produtos de interesse</p>
              <button
                type="button"
                onClick={() => {
                  setShowProductSearch((v) => !v)
                  setTimeout(() => productSearchRef.current?.focus(), 50)
                }}
                className="text-xs font-medium text-z-green hover:underline"
              >
                Editar
              </button>
            </div>
            <p className="mb-2 text-xs text-z-text-muted">
              Adicione os produtos de interesse desse cliente
            </p>

            {showProductSearch && (
              <div className="mb-3">
                <div className="flex h-10 items-center overflow-hidden rounded-lg border border-z-border focus-within:border-z-green">
                  <HugeiconsIcon icon={Search01Icon} size={14} className="ml-3 shrink-0 text-z-text-hint" />
                  <input
                    ref={productSearchRef}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Pesquisar produto..."
                    className="flex-1 bg-white px-2 text-sm placeholder:text-z-text-hint focus:outline-none"
                  />
                </div>
                {filteredProducts.length > 0 && (
                  <ul className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-z-border bg-white">
                    {filteredProducts.slice(0, 20).map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => toggleProductInterest(p.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-z-bg2"
                        >
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="h-8 w-8 shrink-0 rounded object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 shrink-0 rounded bg-z-bg2" />
                          )}
                          <span className="line-clamp-2 text-left">{p.name}</span>
                          <HugeiconsIcon icon={Add01Icon} size={14} className="ml-auto shrink-0 text-z-green" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {selectedProducts.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-z-text-muted">
                  Produtos selecionados ({selectedProducts.length}{' '}
                  {selectedProducts.length === 1 ? 'Item' : 'Itens'})
                </p>
                <ul className="flex flex-col gap-2">
                  {selectedProducts.map((p) => (
                    <li key={p.id} className="flex items-center gap-2">
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="h-8 w-8 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 shrink-0 rounded bg-z-bg2" />
                      )}
                      <span className="flex-1 text-xs line-clamp-2">{p.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleProductInterest(p.id)}
                        className="shrink-0 text-z-text-hint hover:text-z-primary"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Delete */}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-2 self-start text-xs font-medium text-z-primary hover:underline"
            >
              Excluir cliente
              <HugeiconsIcon icon={Delete02Icon} size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 z-10 flex items-center justify-center gap-3 border-t border-z-border bg-z-dark px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-full border border-z-border px-6 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 rounded-full bg-z-green px-8 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar dados'}
        </button>
      </div>
    </form>
  )
}
