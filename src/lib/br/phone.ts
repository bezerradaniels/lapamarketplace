/**
 * Máscara progressiva para telefone brasileiro no formato
 * `(DD) XXXXX-XXXX` (celular, 11 dígitos) ou `(DD) XXXX-XXXX` (fixo, 10 dígitos).
 * Ideal para usar no `onChange` de um <input>.
 */
export function maskPhoneBR(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

const DDD_RANGE = /^(1[1-9]|2[12478]|3[1-578]|4[1-9]|5[13-5]|6[1-9]|7[134579]|8[1-9]|9[1-9])$/

/**
 * Valida um número BR masked/raw. Aceita celular (11 dígitos) e fixo (10 dígitos),
 * com DDD válido e sem repetição trivial.
 */
export function validatePhoneBR(input: string): boolean {
  const d = input.replace(/\D/g, '')
  if (d.length !== 11 && d.length !== 10) return false
  if (!DDD_RANGE.test(d.slice(0, 2))) return false
  if (/^(\d)\1{9,10}$/.test(d)) return false
  return true
}

/** Converte input mascarado/livre em E.164 brasileiro (+55DDDNNNNNNNN). */
export function toE164BR(input: string): string {
  const d = input.replace(/\D/g, '')
  const local = d.startsWith('55') && d.length > 11 ? d.slice(2) : d
  return `+55${local}`
}

/** Converte E.164 brasileiro em string mascarada para display. */
export function fromE164BR(e164: string): string {
  return maskPhoneBR(e164.replace(/^\+55/, ''))
}
