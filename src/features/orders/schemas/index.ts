import { z } from 'zod'
import { validatePhoneBR } from '@/lib/br'

export const checkoutSchema = z.object({
  name: z.string().min(2, 'Informe seu nome').max(120),
  phone: z.string().refine(validatePhoneBR, 'Informe um WhatsApp válido com DDD'),
  notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
