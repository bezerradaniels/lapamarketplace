import { createBrowserClient } from '@/lib/supabase'
import type { Store } from '@/types/domain'

// Columns the anonymous role is allowed to read (see migration
// 20260529140000_security_public_stores_column_scope.sql). Must NOT include
// owner_id (internal user UUID) or cnpj (LGPD-sensitive). Keep in sync with the
// GRANT in that migration — `anon` cannot SELECT('*') on stores anymore.
const PUBLIC_STORE_COLUMNS =
  'id, slug, name, slogan, logo_url, banner_url, gallery_images, primary_color, ' +
  'category, about_us, age_restricted, cart_enabled, currency, locale, product_sort, ' +
  'show_out_of_stock, require_cpf, require_payment_choice, require_shipping_choice, ' +
  'accepted_payment_methods, accepted_shipping_methods, payment_instructions_title, ' +
  'payment_instructions_message, delivery_hours, whatsapp_phone, whatsapp_button_enabled, ' +
  'contact_phone, contact_email, instagram, social_links, custom_links, gtm_id, ' +
  'address_cep, address_street, address_number, address_complement, address_neighborhood, ' +
  'address_city, address_state, slug_last_updated_at, created_at, updated_at, deleted_at'

export async function listMyStores(): Promise<Store[]> {
  const supabase = createBrowserClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) return []

  // `stores_public_read` deixa leitura de todas as stores não-deletadas;
  // para "minhas lojas" filtramos pelo inner join em store_members.
  const { data, error } = await supabase
    .from('stores')
    .select('*, store_members!inner(user_id)')
    .eq('store_members.user_id', userData.user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as Store[]
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('stores')
    .select(PUBLIC_STORE_COLUMNS)
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return (data as unknown as Store | null) ?? null
}
