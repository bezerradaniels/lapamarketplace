import { z } from 'zod'

export const phoneSchema = z
  .string()
  .regex(/^\+55\d{10,11}$/, { message: 'Telefone inválido. Use o formato +55DDXXXXXXXX' })
