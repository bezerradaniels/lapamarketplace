import { z } from 'zod'
import { validatePhoneBR } from '@/lib/br'

const deliverySlotSchema = z.object({
  days: z.string(),
  start: z.string(),
  end: z.string(),
})

// Slug rules mirror the CHECK constraint on `public.stores.slug`.
const slugRegex = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/

export const createStoreSchema = z.object({
  name: z
    .string()
    .min(1, 'Informe o nome da loja')
    .max(80, 'Máximo 80 caracteres'),
  slug: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(40, 'Máximo 40 caracteres')
    .regex(
      slugRegex,
      'Use apenas letras minúsculas, números e hífen (sem hífen no início/fim).',
    ),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  slogan: z.string().max(120, 'Máximo 120 caracteres').optional(),
  whatsapp_phone: z
    .string()
    .refine(validatePhoneBR, 'Informe um WhatsApp válido com DDD'),
})

export type CreateStoreInput = z.infer<typeof createStoreSchema>

// Update schema: same validations as create. 
// User can update slug once every 3 months.
export const updateStoreSchema = z.object({
  slug: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(40, 'Máximo 40 caracteres')
    .regex(
      slugRegex,
      'Use apenas letras minúsculas, números e hífen (sem hífen no início/fim).',
    )
    .optional(),
  name: z.string().min(1, 'Informe o nome da loja').max(80, 'Máximo 80 caracteres'),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  slogan: z.string().max(120, 'Máximo 120 caracteres').optional().or(z.literal('')),
  whatsapp_phone: z
    .string()
    .refine(validatePhoneBR, 'Informe um WhatsApp válido com DDD'),
  logo_url: z
    .string()
    .url('Informe uma URL válida (https://...)')
    .optional()
    .or(z.literal('')),
  banner_url: z
    .string()
    .url('Informe uma URL válida (https://...)')
    .optional()
    .or(z.literal('')),
  contact_email: z
    .string()
    .email('E-mail inválido')
    .optional()
    .or(z.literal('')),
  contact_phone: z
    .string()
    .refine((val) => !val || validatePhoneBR(val), 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  address_cep: z.string().optional().or(z.literal('')),
  address_street: z.string().optional().or(z.literal('')),
  address_neighborhood: z.string().optional().or(z.literal('')),
  address_number: z.string().optional().or(z.literal('')),
  address_state: z.string().optional().or(z.literal('')),
  address_city: z.string().optional().or(z.literal('')),
  cart_enabled: z.boolean().optional(),
  require_shipping_choice: z.boolean().optional(),
  require_cpf: z.boolean().optional(),
  require_payment_choice: z.boolean().optional(),
  payment_instructions_title: z.string().max(120, 'Máximo 120 caracteres').optional().or(z.literal('')),
  payment_instructions_message: z.string().max(300, 'Máximo 300 caracteres').optional().or(z.literal('')),
  whatsapp_button_enabled: z.boolean().optional(),
  accepted_payment_methods: z.array(z.string()).optional(),
  accepted_shipping_methods: z.array(z.string()).optional(),
  delivery_hours: z.array(deliverySlotSchema).optional(),
  custom_links: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  gallery_images: z.array(z.string()).optional(),
  social_instagram: z.string().optional().or(z.literal('')),
  social_facebook: z.string().optional().or(z.literal('')),
  social_x: z.string().optional().or(z.literal('')),
  social_youtube: z.string().optional().or(z.literal('')),
  social_kwai: z.string().optional().or(z.literal('')),
  social_tiktok: z.string().optional().or(z.literal('')),
  about_us: z.string().max(1000, 'Máximo 1000 caracteres').optional().or(z.literal('')),
  age_restricted: z.boolean().optional(),
  show_out_of_stock: z.boolean().optional(),
  product_sort: z.enum(['recent', 'name_asc', 'name_desc', 'price_asc', 'price_desc']).optional(),
  cnpj: z.string().optional().or(z.literal('')),
  gtm_id: z
    .string()
    .regex(/^GTM-[A-Z0-9]+$/, 'ID inválido. Formato esperado: GTM-XXXXXX')
    .optional()
    .or(z.literal('')),
})

export type UpdateStoreInput = z.infer<typeof updateStoreSchema>
