import { createBrowserClient } from '@/lib/supabase'
import { toE164BR } from '@/lib/br'
import type { Store } from '@/types/domain'
import type { TablesUpdate } from '@/types/database'
import type { CreateStoreInput, UpdateStoreInput } from '../schemas'

export class SlugTakenError extends Error {
  constructor() {
    super('Este endereço de loja já está em uso.')
    this.name = 'SlugTakenError'
  }
}

export async function createStore(input: CreateStoreInput): Promise<Store> {
  const supabase = createBrowserClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) {
    throw new Error('Sessão expirada. Entre novamente.')
  }

  const { data, error } = await supabase
    .from('stores')
    .insert({
      name: input.name,
      slug: input.slug,
      primary_color: input.primary_color,
      slogan: input.slogan ?? null,
      whatsapp_phone: toE164BR(input.whatsapp_phone),
      owner_id: userData.user.id,
    })
    .select('*')
    .single()

  if (error) {
    // 23505 = unique_violation → slug tomado
    if (error.code === '23505') throw new SlugTakenError()
    throw error
  }
  return data as unknown as Store
}

export async function updateStore(
  storeId: string,
  input: UpdateStoreInput,
): Promise<Store> {
  const supabase = createBrowserClient()

  // Build social_links object from individual fields
  const social_links = {
    instagram: input.social_instagram?.trim() || undefined,
    facebook: input.social_facebook?.trim() || undefined,
    x: input.social_x?.trim() || undefined,
    youtube: input.social_youtube?.trim() || undefined,
    kwai: input.social_kwai?.trim() || undefined,
    tiktok: input.social_tiktok?.trim() || undefined,
  }

  const { data, error } = await supabase
    .from('stores')
    .update({
      name: input.name,
      primary_color: input.primary_color,
      slogan: input.slogan?.trim() ? input.slogan : null,
      whatsapp_phone: toE164BR(input.whatsapp_phone),
      logo_url: input.logo_url?.trim() ? input.logo_url : null,
      banner_url: input.banner_url?.trim() ? input.banner_url : null,
      contact_email: input.contact_email?.trim() ? input.contact_email : null,
      cnpj: input.cnpj?.trim() ? input.cnpj : null,
      contact_phone: input.contact_phone?.trim()
        ? toE164BR(input.contact_phone)
        : null,
      address_cep: input.address_cep?.trim() || null,
      address_street: input.address_street?.trim() || null,
      address_neighborhood: input.address_neighborhood?.trim() || null,
      address_number: input.address_number?.trim() || null,
      address_state: input.address_state?.trim() || null,
      address_city: input.address_city?.trim() || null,
      cart_enabled: input.cart_enabled ?? true,
      require_shipping_choice: input.require_shipping_choice ?? false,
      require_cpf: input.require_cpf ?? false,
      require_payment_choice: input.require_payment_choice ?? false,
      payment_instructions_title: input.payment_instructions_title?.trim() || null,
      payment_instructions_message: input.payment_instructions_message?.trim() || null,
      whatsapp_button_enabled: input.whatsapp_button_enabled ?? true,
      accepted_payment_methods: input.accepted_payment_methods ?? [],
      accepted_shipping_methods: input.accepted_shipping_methods ?? [],
      delivery_hours: input.delivery_hours ?? [],
      custom_links: input.custom_links ?? [],
      gallery_images: input.gallery_images ?? [],
      social_links,
      about_us: input.about_us?.trim() || null,
      age_restricted: input.age_restricted ?? false,
      show_out_of_stock: input.show_out_of_stock ?? false,
      product_sort: input.product_sort ?? 'recent',
      gtm_id: input.gtm_id?.trim() || null,
      // If slug is provided, we update it and set the timestamp.
      // The UI will handle the business rule (once every 3 months).
      ...(input.slug ? { 
        slug: input.slug,
        slug_last_updated_at: new Date().toISOString()
      } : {}),
    })
    .eq('id', storeId)
    .select('*')
    .single()

  if (error || !data) throw error ?? new Error('Não foi possível atualizar a loja')
  return data as unknown as Store
}

/**
 * Partial patch for individual field updates (e.g., during onboarding chat).
 * Unlike updateStore(), this only touches the fields you explicitly pass.
 */
export async function patchStore(
  storeId: string,
  patch: TablesUpdate<'stores'>,
): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase.from('stores').update(patch).eq('id', storeId)
  if (error) throw error
}

export async function deleteStore(storeId: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase.from('stores').delete().eq('id', storeId)
  if (error) throw error
}
