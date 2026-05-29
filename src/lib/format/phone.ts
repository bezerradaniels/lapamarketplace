/** Formats a +55 E.164 number to (DDD) 9XXXX-XXXX display format. */
export function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '')
  // Strip country code +55
  const local = digits.startsWith('55') ? digits.slice(2) : digits
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  }
  return e164
}

/** Converts a masked phone string to E.164 +55 format. */
export function toE164(masked: string): string {
  const digits = masked.replace(/\D/g, '')
  const local = digits.startsWith('55') ? digits : digits
  return `+55${local}`
}
