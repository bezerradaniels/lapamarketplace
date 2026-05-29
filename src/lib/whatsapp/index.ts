import { formatMoney } from '@/lib/format'
import { effectivePrice } from '@/features/products/utils/price'
import type { CartItem } from '@/stores/cartStore'
import type { Store } from '@/types/domain'

/** Builds a wa.me link that opens a pre-filled WhatsApp message. */
export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  const e164digits = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${e164digits}?text=${encodeURIComponent(message)}`
}

export type OrderPayload = {
  store: Pick<Store, 'name' | 'slug'>
  items: CartItem[]
  customer: { name: string; phone?: string; notes?: string }
  totalInCents: number
  coupon?: { code: string; discountInCents: number } | null
}

/**
 * Mensagem padrão em pt-BR enviada ao lojista via WhatsApp.
 * Renderiza itens, total e dados de contato do cliente.
 */
export function buildOrderMessage({
  store,
  items,
  customer,
  totalInCents,
  coupon,
}: OrderPayload): string {
  const lines: string[] = []
  lines.push(`*Novo pedido — ${store.name}*`)
  lines.push('')
  lines.push(`👤 *Cliente:* ${customer.name}`)
  if (customer.phone) lines.push(`📞 *Telefone:* ${customer.phone}`)
  lines.push('')
  lines.push('*Itens:*')
  let subtotalSum = 0
  for (const item of items) {
    const subtotal = effectivePrice(item.product) * item.quantity
    subtotalSum += subtotal
    const variationSuffix = item.selectedVariation ? ` (${item.selectedVariation})` : ''
    lines.push(
      `• ${item.quantity}x ${item.product.name}${variationSuffix} — ${formatMoney(subtotal)}`,
    )
  }
  lines.push('')
  if (coupon && coupon.discountInCents > 0) {
    lines.push(`*Subtotal:* ${formatMoney(subtotalSum)}`)
    lines.push(
      `*Cupom* (${coupon.code}): −${formatMoney(coupon.discountInCents)}`,
    )
  }
  lines.push(`*Total:* ${formatMoney(totalInCents)}`)
  if (customer.notes?.trim()) {
    lines.push('')
    lines.push(`📝 *Observações:* ${customer.notes.trim()}`)
  }
  lines.push('')
  const rootDomain = import.meta.env.VITE_ROOT_DOMAIN ?? 'lapamarketplace.com.br'
  lines.push(`Pedido enviado via ${rootDomain}/${store.slug}`)
  return lines.join('\n')
}
