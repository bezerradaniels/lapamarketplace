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

/**
 * Higieniza uma string para uso como slug de loja (minúsculas, sem acentos, espaços viram hifens).
 */
export function sanitizeStoreSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Formata um telefone para a máscara brasileira de WhatsApp: (77) 99999-9999
 */
export function formatWhatsAppMask(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Extrai apenas números do WhatsApp garantindo o DDI 55 para salvar no banco (ex: 5577999999999).
 */
export function normalizeWhatsAppToDb(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) {
    return digits.slice(0, 13);
  }
  return `55${digits.slice(0, 11)}`;
}


