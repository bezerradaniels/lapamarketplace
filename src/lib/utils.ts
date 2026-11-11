/**
 * Utilitários gerais de formatação, cálculo de desconto e links de WhatsApp
 * para o Marketplace de Bom Jesus da Lapa - BA.
 */

export function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function calculateDiscountPercentage(
  price: number,
  promotionalPrice?: number | null
): number | null {
  if (
    promotionalPrice == null ||
    promotionalPrice <= 0 ||
    price <= 0 ||
    promotionalPrice >= price
  ) {
    return null;
  }
  const discount = Math.round(((price - promotionalPrice) / price) * 100);
  return discount > 0 ? discount : null;
}

export function buildWhatsAppUrl(params: {
  phone?: string;
  storeName: string;
  productTitle?: string;
  productPrice?: number;
  selectedSize?: string | null;
}): string {
  const cleanPhone = (params.phone || "5577999999999").replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("55")
    ? cleanPhone
    : `55${cleanPhone}`;

  let message = `Olá, *${params.storeName}*! Vi no Lapa Marketplace`;
  if (params.productTitle) {
    message += ` o produto *${params.productTitle}*`;
    if (params.selectedSize) {
      message += ` (Tamanho: *${params.selectedSize}*)`;
    }
    if (params.productPrice != null) {
      message += ` por *${formatCurrencyBRL(params.productPrice)}*`;
    }
    message += ` e gostaria de fazer o pedido!`;
  } else {
    message += ` e gostaria de tirar uma dúvida sobre o catálogo.`;
  }

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

