const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatMoney(valueInCents: number): string {
  return formatter.format(valueInCents / 100)
}

/**
 * Parse a user-entered BRL string (e.g. "R$ 1.234,56" or "1234,56" or "1234.56")
 * into integer cents. Returns NaN when the input is not a valid number.
 */
export function parseMoneyToCents(raw: string): number {
  const cleaned = raw
    .replace(/[^\d.,-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '') // drop thousands separator
    .replace(',', '.')
  const num = Number(cleaned)
  if (!Number.isFinite(num)) return Number.NaN
  return Math.round(num * 100)
}
