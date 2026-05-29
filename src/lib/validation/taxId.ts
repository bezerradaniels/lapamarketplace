import { z } from 'zod'
import { validateCpf } from '@/lib/br/cpf'
import { validateCnpj } from '@/lib/br/cnpj'

export const cpfSchema = z
  .string()
  .refine((v) => validateCpf(v), { message: 'CPF inválido' })

export const cnpjSchema = z
  .string()
  .refine((v) => validateCnpj(v), { message: 'CNPJ inválido' })

export const taxIdSchema = z
  .string()
  .refine((v) => validateCpf(v) || validateCnpj(v), {
    message: 'CPF ou CNPJ inválido',
  })
