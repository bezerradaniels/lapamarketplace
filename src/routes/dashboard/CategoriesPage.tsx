import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Edit02Icon,
  Delete02Icon,
  ArrowLeft02Icon,
  ArrowDown01Icon,
  ArrowRight02Icon,
  Tick02Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type Category,
} from '@/features/categories'
import { useActiveStore } from '@/lib/tenant'
import { Button, Field } from '@/components/ui'
import { ROUTES } from '@/config/routes'

export default function CategoriesPage() {
  const { store } = useActiveStore()
  const categoriesQuery = useCategories(store?.id)
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory(store?.id ?? '')
  const deleteCategory = useDeleteCategory(store?.id ?? '')

  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null)
  const [newSubName, setNewSubName] = useState('')

  if (!store) {
    return <p className="text-sm text-z-text-muted">Carregando...</p>
  }

  const categories = categoriesQuery.data ?? []
  const topLevel = categories.filter((c) => !c.parent_id)
  const childrenOf = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId)

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    await createCategory.mutateAsync({
      store_id: store.id,
      name: newCategoryName.trim(),
    })
    setNewCategoryName('')
  }

  const handleCreateSubcategory = async (parentId: string) => {
    if (!newSubName.trim()) return
    await createCategory.mutateAsync({
      store_id: store.id,
      name: newSubName.trim(),
      parent_id: parentId,
    })
    setNewSubName('')
    setAddingSubTo(null)
    setExpandedIds((prev) => new Set(prev).add(parentId))
  }

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditingName(cat.name)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return
    await updateCategory.mutateAsync({
      id: editingId,
      name: editingName.trim(),
    })
    setEditingId(null)
    setEditingName('')
  }

  const handleDelete = async (cat: Category) => {
    const subs = childrenOf(cat.id)
    const message =
      subs.length > 0
        ? `Excluir "${cat.name}" e suas ${subs.length} subcategoria(s)?`
        : `Excluir a categoria "${cat.name}"?`
    if (!confirm(message)) return
    await deleteCategory.mutateAsync(cat.id)
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex w-full flex-col gap-6 lg:max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={ROUTES.dashboardCatalog}
            className="mb-2 inline-flex items-center gap-1 text-xs text-z-text-muted hover:text-z-text"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={12} />
            Voltar para o catálogo
          </Link>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: '#1a1a1a' }}>
            Categorias
          </h1>
          <p className="mt-1 text-sm text-z-text-muted">
            Organize seus produtos em categorias e subcategorias
          </p>
        </div>
      </div>

      {/* Add new category */}
      <div className="rounded-2xl border border-z-border bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold" style={{ color: '#1a1a1a' }}>
          Adicionar nova categoria
        </h2>
        <form onSubmit={handleCreateCategory} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field
              label="Nome da categoria"
              placeholder="Ex: Bebidas"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              maxLength={60}
            />
          </div>
          <Button
            type="submit"
            disabled={!newCategoryName.trim() || createCategory.isPending}
          >
            <HugeiconsIcon icon={Add01Icon} size={16} />
            {createCategory.isPending ? 'Criando...' : 'Adicionar'}
          </Button>
        </form>
      </div>

      {/* Categories list */}
      <div className="rounded-2xl border border-z-border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold" style={{ color: '#1a1a1a' }}>
          Suas categorias
        </h2>

        {categoriesQuery.isLoading ? (
          <p className="text-sm text-z-text-muted">Carregando...</p>
        ) : topLevel.length === 0 ? (
          <div className="rounded-xl border border-dashed border-z-border p-8 text-center">
            <p className="text-sm font-medium text-z-text">Nenhuma categoria cadastrada</p>
            <p className="mt-1 text-xs text-z-text-hint">
              Adicione sua primeira categoria acima.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {topLevel.map((cat) => {
              const subs = childrenOf(cat.id)
              const isExpanded = expandedIds.has(cat.id)
              const isEditing = editingId === cat.id

              return (
                <div
                  key={cat.id}
                  className="rounded-xl border border-z-border bg-z-bg"
                >
                  {/* Category row */}
                  <div className="flex items-center gap-2 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(cat.id)}
                      className="flex h-6 w-6 items-center justify-center rounded text-z-text-muted hover:bg-z-bg2"
                    >
                      <HugeiconsIcon
                        icon={isExpanded ? ArrowDown01Icon : ArrowRight02Icon}
                        size={14}
                      />
                    </button>

                    {isEditing ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit()
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          maxLength={60}
                          className="h-8 flex-1 rounded-lg border border-z-border bg-white px-3 text-sm outline-none focus:border-z-green"
                        />
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-z-green hover:bg-z-green/10"
                          aria-label="Salvar"
                        >
                          <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={3} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-bg2"
                          aria-label="Cancelar"
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 font-medium text-z-text">
                          {cat.name}
                        </span>
                        {subs.length > 0 && (
                          <span className="rounded-full bg-z-border px-2 py-0.5 text-[11px] text-z-text-muted">
                            {subs.length} {subs.length === 1 ? 'sub' : 'subs'}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-bg2"
                          aria-label="Editar"
                        >
                          <HugeiconsIcon icon={Edit02Icon} size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-primary/10 hover:text-z-primary"
                          aria-label="Excluir"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={14} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Subcategories */}
                  <div className="border-t border-z-border bg-white px-4 py-3">
                    {subs.length > 0 && isExpanded && (
                        <div className="mb-3 flex flex-col gap-1.5">
                          {subs.map((sub) => {
                            const isEditingSub = editingId === sub.id
                            return (
                              <div
                                key={sub.id}
                                className="flex items-center gap-2 rounded-lg border border-z-border bg-z-bg px-3 py-2"
                              >
                                <span className="text-z-text-hint">└</span>
                                {isEditingSub ? (
                                  <div className="flex flex-1 items-center gap-2">
                                    <input
                                      autoFocus
                                      value={editingName}
                                      onChange={(e) => setEditingName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEdit()
                                        if (e.key === 'Escape') setEditingId(null)
                                      }}
                                      maxLength={60}
                                      className="h-7 flex-1 rounded-md border border-z-border bg-white px-2 text-sm outline-none focus:border-z-green"
                                    />
                                    <button
                                      type="button"
                                      onClick={handleSaveEdit}
                                      className="flex h-7 w-7 items-center justify-center rounded-md text-z-green hover:bg-z-green/10"
                                    >
                                      <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={3} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingId(null)}
                                      className="flex h-7 w-7 items-center justify-center rounded-md text-z-text-muted hover:bg-z-bg2"
                                    >
                                      <HugeiconsIcon icon={Cancel01Icon} size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="flex-1 text-sm text-z-text">
                                      {sub.name}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(sub)}
                                      className="flex h-7 w-7 items-center justify-center rounded-md text-z-text-muted hover:bg-z-bg2"
                                    >
                                      <HugeiconsIcon icon={Edit02Icon} size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(sub)}
                                      className="flex h-7 w-7 items-center justify-center rounded-md text-z-text-muted hover:bg-z-primary/10 hover:text-z-primary"
                                    >
                                      <HugeiconsIcon icon={Delete02Icon} size={12} />
                                    </button>
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Add subcategory */}
                      {addingSubTo === cat.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={newSubName}
                            onChange={(e) => setNewSubName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCreateSubcategory(cat.id)
                              if (e.key === 'Escape') {
                                setAddingSubTo(null)
                                setNewSubName('')
                              }
                            }}
                            maxLength={60}
                            placeholder="Nome da subcategoria"
                            className="h-8 flex-1 rounded-lg border border-z-border bg-white px-3 text-sm outline-none focus:border-z-green"
                          />
                          <button
                            type="button"
                            onClick={() => handleCreateSubcategory(cat.id)}
                            disabled={!newSubName.trim() || createCategory.isPending}
                            className="rounded-lg bg-z-green px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                          >
                            Adicionar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingSubTo(null)
                              setNewSubName('')
                            }}
                            className="rounded-lg border border-z-border bg-white px-3 py-1.5 text-xs font-medium text-z-text hover:bg-z-bg2"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingSubTo(cat.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-z-green hover:underline"
                        >
                          <HugeiconsIcon icon={Add01Icon} size={12} />
                          Adicionar subcategoria
                        </button>
                      )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
