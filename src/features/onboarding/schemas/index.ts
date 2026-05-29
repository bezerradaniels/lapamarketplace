import { z } from 'zod'
import { validatePhoneBR } from '@/lib/br'

const slugRegex = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/

export const step1Schema = z.object({
  name: z.string().min(1, 'Informe o nome da loja').max(80, 'Máximo 80 caracteres'),
  whatsapp_phone: z
    .string()
    .refine(validatePhoneBR, 'Informe um WhatsApp válido com DDD'),
  address_state: z.string().min(2, 'Selecione um estado'),
  address_city: z.string().min(1, 'Informe a cidade'),
  address_street: z.string().max(120, 'Máximo 120 caracteres').optional().or(z.literal('')),
  address_neighborhood: z.string().max(80, 'Máximo 80 caracteres').optional().or(z.literal('')),
})

export const step2Schema = z.object({
  category: z.string().min(1, 'Selecione o ramo da sua loja'),
  instagram: z
    .string()
    .max(60, 'Máximo 60 caracteres')
    .transform((v) => v.replace(/^@/, '').trim()),
  slug: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(40, 'Máximo 40 caracteres')
    .regex(
      slugRegex,
      'Use apenas letras minúsculas, números e hífen. Não comece nem termine com hífen.',
    ),
})

const deliverySlotSchema = z.object({
  days: z.string(),
  start: z.string(),
  end: z.string(),
})

export const step3Schema = z.object({
  accepted_payment_methods: z
    .array(z.string())
    .min(1, 'Selecione ao menos uma forma de pagamento'),
  accepted_shipping_methods: z
    .array(z.string())
    .min(1, 'Selecione ao menos uma forma de entrega'),
  delivery_hours: z.array(deliverySlotSchema),
})

export const step4Schema = z.object({
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  logo_url: z.string().optional().or(z.literal('')),
  banner_url: z.string().optional().or(z.literal('')),
})

export type Step1Values = z.infer<typeof step1Schema>
export type Step2Values = z.infer<typeof step2Schema>
export type Step3Values = z.infer<typeof step3Schema>
export type Step4Values = z.infer<typeof step4Schema>
