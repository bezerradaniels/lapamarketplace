import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { startCheckoutSession } from '../api/mutations'
import { billingErrorMessage } from '../utils/errorMessage'
import type { PlanId } from '@/types/domain'

export function useStartCheckout() {
  return useMutation({
    mutationFn: ({
      storeId,
      planId,
      billingPeriod = 'monthly',
    }: {
      storeId: string
      planId: PlanId
      billingPeriod?: 'monthly' | 'annual'
    }) => startCheckoutSession(storeId, planId, billingPeriod),
    onSuccess: (url) => {
      // Stripe Checkout is hosted; redirect the whole page so the back button
      // returns the user to the dashboard cleanly.
      window.location.href = url
    },
    onError: (err) => {
      toast.error('Não foi possível abrir o checkout', {
        description: billingErrorMessage(err),
      })
    },
  })
}
