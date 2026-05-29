import { describe, expect, it } from 'vitest'
import { formatCpf, validateCpf } from './cpf'

describe('validateCpf', () => {
  it('accepts a CPF with a valid checksum', () => {
    expect(validateCpf('52998224725')).toBe(true)
    expect(validateCpf('529.982.247-25')).toBe(true)
  })

  it('rejects a CPF with an invalid checksum', () => {
    expect(validateCpf('52998224724')).toBe(false)
    expect(validateCpf('12345678900')).toBe(false)
  })

  it('rejects the wrong number of digits', () => {
    expect(validateCpf('5299822472')).toBe(false)
    expect(validateCpf('529982247250')).toBe(false)
    expect(validateCpf('')).toBe(false)
  })

  it('rejects repeated-digit sequences', () => {
    expect(validateCpf('00000000000')).toBe(false)
    expect(validateCpf('11111111111')).toBe(false)
  })
})

describe('formatCpf', () => {
  it('masks 11 digits as 000.000.000-00', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25')
  })

  it('strips non-digits before masking', () => {
    expect(formatCpf('529-982-247-25')).toBe('529.982.247-25')
  })
})
