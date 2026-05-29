import { z } from 'zod'

const socialLinkSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'x', 'youtube', 'kwai', 'tiktok', 'whatsapp']),
  value: z.string().min(1),
})

export const customerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  whatsapp_phone: z.string().min(1, 'WhatsApp é obrigatório'),
  secondary_phone: z.string().optional().nullable(),
  cpf_cnpj_type: z.enum(['cpf', 'cnpj']),
  cpf_cnpj: z.string().optional().nullable(),
  birthday: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) => !v || /^\d{2}\/\d{2}$/.test(v),
      'Use o formato DD/MM',
    ),
  email: z.string().email('E-mail inválido').optional().nullable().or(z.literal('')),
  website: z.string().optional().nullable(),
  social_links: z.array(socialLinkSchema),
  profile_notes: z.string().optional().nullable(),
  seller_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()),
  category_interests: z.array(z.string()),
  product_interests: z.array(z.string().uuid()),
})

export type CustomerFormValues = z.infer<typeof customerSchema>
