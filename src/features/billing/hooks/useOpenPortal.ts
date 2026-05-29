import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { openCustomerPortal } from '../api/mutations'
import { billingErrorMessage } from '../utils/errorMessage'

export function useOpenPortal() {
  return useMutation({
    mutationFn: (storeId: string) => openCustomerPortal(storeId),
    onSuccess: (url) => {
      window.location.href = url
    },
    onError: (err) => {
      toast.error('Não foi possível abrir o portal', {
        description: billingErrorMessage(err),
      })
    },
  })
}
