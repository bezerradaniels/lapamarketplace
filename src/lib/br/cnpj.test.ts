import { describe, expect, it } from 'vitest'
import { formatCnpj, validateCnpj } from './cnpj'

describe('validateCnpj', () => {
  it('accepts a CNPJ with a valid checksum', () => {
    expect(validateCnpj('11222333000181')).toBe(true)
    expect(validateCnpj('11.222.333/0001-81')).toBe(true)
  })

  it('rejects a CNPJ with an invalid checksum', () => {
    expect(validateCnpj('11222333000180')).toBe(false)
    expect(validateCnpj('11222333000100')).toBe(false)
  })

  it('rejects the wrong number of digits', () => {
    expect(validateCnpj('1122233300018')).toBe(false)
    expect(validateCnpj('112223330001810')).toBe(false)
    expect(validateCnpj('')).toBe(false)
  })

  it('rejects repeated-digit sequences', () => {
    expect(validateCnpj('00000000000000')).toBe(false)
    expect(validateCnpj('11111111111111')).toBe(false)
  })
})

describe('formatCnpj', () => {
  it('masks 14 digits as 00.000.000/0000-00', () => {
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81')
  })
})
