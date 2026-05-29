import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deactivateProducts } from '@/features/products/api/mutations'
import { productsKeys } from '@/features/products/api/keys'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/domain'

type Props = {
  storeId: string
  activeProducts: Product[]
  newLimit: number
  onConfirm: () => void
  onCancel: () => void
}

export function DowngradeProductSelector({
  storeId,
  activeProducts,
  newLimit,
  onConfirm,
  onCancel,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(activeProducts.slice(0, newLimit).map((p) => p.id)),
  )
  const qc = useQueryClient()

  const deactivate = useMutation({
    mutationFn: (idsToDeactivate: string[]) => deactivateProducts(idsToDeactivate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productsKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: productsKeys.publicList(storeId) })
      toast.success('Produtos desativados. Prosseguindo para o pagamento...')
      onConfirm()
    },
    onError: (err) => {
      toast.error('Erro ao desativar produtos', { description: (err as Error).message })
    },
  })

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < newLimit) {
        next.add(id)
      }
      return next
    })
  }

  const handleConfirm = () => {
    const toDeactivate = activeProducts
      .filter((p) => !selectedIds.has(p.id))
      .map((p) => p.id)
    deactivate.mutate(toDeactivate)
  }

  const remaining = newLimit - selectedIds.size

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-z-border bg-white shadow-z-pop">
        <div className="border-b border-z-border px-6 py-5">
          <h2 className="text-lg font-bold text-z-text">Selecione os produtos a manter</h2>
          <p className="mt-1 text-sm text-z-text-muted">
            O novo plano permite até <strong>{newLimit} produtos ativos</strong>. Selecione quais manter — o restante será desativado (não excluído).
          </p>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
          <div
            className={cn(
              'mb-3 rounded-lg px-3 py-2 text-sm font-medium',
              remaining === 0
                ? 'bg-z-green/10 text-z-green'
                : 'bg-amber-50 text-amber-700',
            )}
          >
            {remaining === 0
              ? `${newLimit}/${newLimit} produtos selecionados — pode prosseguir`
              : `${selectedIds.size}/${newLimit} produtos selecionados — selecione mais ${remaining}`}
          </div>

          <ul className="flex flex-col gap-2">
            {activeProducts.map((p) => {
              const isSelected = selectedIds.has(p.id)
              const isDisabled = !isSelected && selectedIds.size >= newLimit
              return (
                <li
                  key={p.id}
                  onClick={() => !isDisabled && toggle(p.id)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
                    isSelected
                      ? 'border-z-green bg-z-green/5'
                      : isDisabled
                        ? 'border-z-border bg-z-bg opacity-50 cursor-not-allowed'
                        : 'border-z-border bg-white hover:border-z-green/40 hover:bg-z-green/5',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
                      isSelected ? 'border-z-green bg-z-green' : 'border-z-border',
                    )}
                  >
                    {isSelected && (
                      <span className="h-2 w-2 rounded-sm bg-white" />
                    )}
                  </div>
                  {p.images[0] && (
                    <img
                      src={p.images[0]}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-z-text">{p.name}</p>
                    <p className="text-xs text-z-text-muted">{formatMoney(p.price_in_cents)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="flex justify-end gap-3 border-t border-z-border px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={deactivate.isPending}
            className="rounded-lg border border-z-border px-4 py-2 text-sm font-medium text-z-text-muted hover:bg-z-bg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedIds.size < newLimit || deactivate.isPending}
            className="rounded-lg bg-z-text px-4 py-2 text-sm font-semibold text-white hover:bg-z-text/80 disabled:opacity-50"
          >
            {deactivate.isPending ? 'Desativando...' : 'Confirmar e ir para pagamento'}
          </button>
        </div>
      </div>
    </div>
  )
}
