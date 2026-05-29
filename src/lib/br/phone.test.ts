import { describe, expect, it } from 'vitest'
import { fromE164BR, maskPhoneBR, toE164BR, validatePhoneBR } from './phone'

describe('maskPhoneBR', () => {
  it('masks an 11-digit mobile number', () => {
    expect(maskPhoneBR('11999998888')).toBe('(11) 99999-8888')
  })

  it('masks a 10-digit landline number', () => {
    expect(maskPhoneBR('1133334444')).toBe('(11) 3333-4444')
  })

  it('masks progressively as the user types', () => {
    expect(maskPhoneBR('')).toBe('')
    expect(maskPhoneBR('11')).toBe('(11')
    expect(maskPhoneBR('1199')).toBe('(11) 99')
  })

  it('caps input at 11 digits', () => {
    expect(maskPhoneBR('119999988887777')).toBe('(11) 99999-8888')
  })
})

describe('validatePhoneBR', () => {
  it('accepts valid mobile and landline numbers', () => {
    expect(validatePhoneBR('(11) 99999-8888')).toBe(true)
    expect(validatePhoneBR('11999998888')).toBe(true)
    expect(validatePhoneBR('1133334444')).toBe(true)
  })

  it('rejects an invalid DDD', () => {
    expect(validatePhoneBR('00999998888')).toBe(false)
    expect(validatePhoneBR('10999998888')).toBe(false)
  })

  it('rejects the wrong length and repeated digits', () => {
    expect(validatePhoneBR('123')).toBe(false)
    expect(validatePhoneBR('11111111111')).toBe(false)
  })
})

describe('E.164 conversion', () => {
  it('converts masked input to E.164', () => {
    expect(toE164BR('(11) 99999-8888')).toBe('+5511999998888')
  })

  it('does not double the country code', () => {
    expect(toE164BR('5511999998888')).toBe('+5511999998888')
  })

  it('round-trips masked -> E.164 -> masked', () => {
    const masked = '(11) 99999-8888'
    expect(fromE164BR(toE164BR(masked))).toBe(masked)
  })
})
