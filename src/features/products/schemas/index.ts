import { z } from 'zod'

const variationOptionSchema = z.object({
  name: z.string().min(1, 'Informe o nome da opção'),
  image_url: z.string().url('URL inválida').nullable().optional(),
  stock: z.number().int().min(0, 'Estoque deve ser zero ou positivo').nullable().optional(),
  sku: z.string().max(40, 'Máximo 40 caracteres').nullable().optional(),
  attributes: z.record(z.string(), z.string()).nullable().optional(),
})

export const productSchema = z
  .object({
    name: z.string().min(1, 'Informe o nome').max(120, 'Máximo 120 caracteres'),
    description: z
      .string()
      .max(10000, 'Máximo 10000 caracteres')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    category: z
      .string()
      .max(40, 'Máximo 40 caracteres')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    subcategory: z
      .string()
      .max(40, 'Máximo 40 caracteres')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    brand: z
      .string()
      .max(60, 'Máximo 60 caracteres')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    unit: z
      .string()
      .max(30, 'Máximo 30 caracteres')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    barcode: z
      .string()
      .min(4, 'Mínimo 4 caracteres')
      .max(20, 'Máximo 20 caracteres')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    barcode_type: z.string().nullable().optional(),
    sku: z
      .string()
      .max(40, 'Máximo 40 caracteres')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    auto_sku: z.boolean(),
    condition: z.enum(['new', 'used', 'refurbished']),
    purchase_recurrence: z.string().nullable().optional(),
    has_no_brand: z.boolean(),
    cost_in_cents: z.number().int().min(0).nullable().optional(),
    price_in_cents: z
      .number({ message: 'Preço inválido' })
      .int()
      .min(0, 'Preço deve ser zero ou positivo'),
    promo_price_in_cents: z
      .number()
      .int()
      .min(0, 'Promoção deve ser zero ou positiva')
      .nullable()
      .optional(),
    installment_count: z
      .number()
      .int()
      .min(2, 'Mínimo 2 parcelas')
      .max(24, 'Máximo 24 parcelas')
      .nullable()
      .optional(),
    installment_total_in_cents: z
      .number()
      .int()
      .min(1, 'Valor da parcela deve ser positivo')
      .nullable()
      .optional(),
    is_active: z.boolean(),
    is_featured: z.boolean(),
    stock: z
      .number()
      .int()
      .min(0, 'Estoque deve ser zero ou positivo')
      .nullable()
      .optional(),
    images: z.array(z.string().url('URL inválida')),
    has_variations: z.boolean(),
    variation_type: z
      .enum(['color', 'size', 'other'])
      .nullable()
      .optional(),
    variation_label: z.string().nullable().optional(),
    variation_options: z.array(variationOptionSchema).nullable().optional(),
  })
  .refine(
    (v) =>
      v.promo_price_in_cents == null ||
      v.promo_price_in_cents < v.price_in_cents,
    {
      message: 'O preço promocional deve ser menor que o preço normal',
      path: ['promo_price_in_cents'],
    },
  )

export type ProductInput = z.infer<typeof productSchema>
