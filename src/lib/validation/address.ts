import { z } from 'zod'

export const cepSchema = z
  .string()
  .regex(/^\d{5}-?\d{3}$/, { message: 'CEP inválido' })
