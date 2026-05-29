/** Maps the codes thrown by `validate_coupon` RPC to pt-BR copy. */
export function couponErrorMessage(code: string): string {
  switch (code) {
    case 'coupon_required':
      return 'Informe um cupom.'
    case 'coupon_not_found':
      return 'Cupom inválido.'
    case 'coupon_expired':
      return 'Este cupom expirou.'
    case 'coupon_max_uses_reached':
      return 'Este cupom atingiu o limite de usos.'
    case 'coupon_min_subtotal_not_reached':
      return 'O valor mínimo para usar este cupom não foi atingido.'
    case 'coupon_category_not_eligible':
      return 'Este cupom só é válido para produtos de uma categoria específica.'
    default:
      return 'Não foi possível validar o cupom.'
  }
}
