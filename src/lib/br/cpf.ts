export function validateCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  const calc = (mod: number) => {
    const sum = digits
      .slice(0, mod - 1)
      .split('')
      .reduce((acc, d, i) => acc + Number(d) * (mod - i), 0)
    const rem = (sum * 10) % 11
    return rem === 10 || rem === 11 ? 0 : rem
  }

  return calc(10) === Number(digits[9]) && calc(11) === Number(digits[10])
}

export function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, '')
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}
