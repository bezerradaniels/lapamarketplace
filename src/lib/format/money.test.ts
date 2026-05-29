import { describe, expect, it } from 'vitest'
import { formatMoney, parseMoneyToCents } from './money'

// Intl may use a non-breaking space (U+00A0) between the symbol and the value.
const normalize = (s: string) => s.replace(/\u00A0/g, ' ')

describe('formatMoney', () => {
  it('formats integer cents as BRL', () => {
    expect(normalize(formatMoney(123456))).toBe('R$ 1.234,56')
    expect(normalize(formatMoney(0))).toBe('R$ 0,00')
    expect(normalize(formatMoney(99))).toBe('R$ 0,99')
  })
})

describe('parseMoneyToCents', () => {
  it('parses a fully masked BRL string', () => {
    expect(parseMoneyToCents('R$ 1.234,56')).toBe(123456)
  })

  it('parses comma- and dot-decimal inputs', () => {
    expect(parseMoneyToCents('1234,56')).toBe(123456)
    expect(parseMoneyToCents('1234.56')).toBe(123456)
  })

  it('drops thousands separators', () => {
    expect(parseMoneyToCents('1.000.000,00')).toBe(100000000)
  })

  it('round-trips through formatMoney', () => {
    expect(parseMoneyToCents(formatMoney(98765))).toBe(98765)
  })
})
