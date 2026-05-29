import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { grantComplimentary } from '../api/mutations'
import type { PlanId } from '@/types/domain'

export function useGrantComplimentary() {
  return useMutation({
    mutationFn: ({
      storeId,
      planId,
      expiresAt,
      notes,
    }: {
      storeId: string
      planId: PlanId
      expiresAt: string
      notes?: string
    }) => grantComplimentary(storeId, planId, expiresAt, notes),
    onSuccess: () => {
      toast.success('Gratuidade concedida com sucesso.')
    },
    onError: (err) => {
      toast.error('Erro ao conceder gratuidade', {
        description: (err as Error).message,
      })
    },
  })
}
