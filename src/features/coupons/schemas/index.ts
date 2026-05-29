import { z } from 'zod'

const codeRegex = /^[A-Z0-9][A-Z0-9_-]{1,29}$/
const customUrlRegex = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .min(2, 'Mínimo 2 caracteres')
      .max(30, 'Máximo 30 caracteres')
      .transform((v) => v.trim().toUpperCase())
      .refine(
        (v) => codeRegex.test(v),
        'Use apenas letras maiúsculas, números, _ ou -',
      ),
    description: z
      .string()
      .max(120, 'Máximo 120 caracteres')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    discount_type: z.enum(['percent', 'fixed']),
    discount_value: z
      .number({ message: 'Valor inválido' })
      .int('Use um número inteiro')
      .min(1, 'Mínimo 1'),
    /** Valor em centavos. */
    min_subtotal_in_cents: z
      .number()
      .int()
      .min(0, 'Mínimo 0')
      .optional(),
    max_uses: z
      .number()
      .int()
      .min(1, 'Mínimo 1')
      .nullable()
      .optional(),
    is_active: z.boolean(),
    /** ISO date string (YYYY-MM-DD) ou vazio. */
    expires_at: z
      .string()
      .optional()
      .or(z.literal('').transform(() => undefined)),
    /** Optional category ID to restrict coupon to specific category/subcategory */
    category_id: z
      .string()
      .uuid('ID de categoria inválido')
      .nullable()
      .optional(),
    /** Optional custom URL slug for sharing (e.g., /c/PROMO2025) */
    custom_url: z
      .string()
      .max(40, 'Máximo 40 caracteres')
      .transform((v) => v.trim().toLowerCase())
      .optional()
      .or(z.literal('').transform(() => undefined))
      .refine(
        (v) => !v || customUrlRegex.test(v),
        'Use apenas letras minúsculas, números e hífens',
      ),
  })
  .refine(
    (v) =>
      v.discount_type !== 'percent' ||
      (v.discount_value >= 1 && v.discount_value <= 100),
    {
      message: 'Porcentagem deve ser entre 1 e 100',
      path: ['discount_value'],
    },
  )

export type CouponFormInput = z.infer<typeof couponFormSchema>
