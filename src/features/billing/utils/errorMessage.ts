import { BillingFunctionError } from '../api/mutations'

/** Maps Edge-Function billing error codes to pt-BR copy for toasts. */
export function billingErrorMessage(err: unknown): string {
  if (err instanceof BillingFunctionError) {
    switch (err.code) {
      case 'missing_secret':
        return `O servidor não está configurado: o segredo ${err.detail ?? ''} precisa ser definido no Supabase.`
      case 'plan_not_configured':
        return 'Este plano ainda não foi configurado no Stripe. Avise o suporte.'
      case 'no_customer':
        return 'Você ainda não tem um método de pagamento. Assine um plano primeiro.'
      case 'not_a_member':
      case 'invalid_token':
      case 'missing_authorization':
        return 'Sessão expirada. Faça login novamente.'
      case 'stripe_error':
        return err.detail
          ? `Erro no Stripe: ${err.detail}`
          : 'O Stripe recusou a operação. Tente novamente.'
      case 'checkout_session_no_url':
      case 'portal_session_no_url':
        return 'Não foi possível abrir a página do Stripe. Tente novamente.'
      default:
        return err.detail ?? 'Algo deu errado. Tente novamente.'
    }
  }
  return err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.'
}
