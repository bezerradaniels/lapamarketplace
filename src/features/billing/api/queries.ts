import { createBrowserClient } from '@/lib/supabase'
import type {
  Invoice,
  PlanFeatures,
  StoreCatalogStatus,
  Subscription,
} from '@/types/domain'

export async function getSubscription(
  storeId: string,
): Promise<Subscription | null> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('store_id', storeId)
    .maybeSingle()

  if (error) throw error
  return (data as Subscription | null) ?? null
}

export async function listInvoicesForStore(
  storeId: string,
): Promise<Invoice[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Invoice[]
}

export async function listPlanFeatures(): Promise<PlanFeatures[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('plan_features')
    .select('*')
    .order('price_in_cents', { ascending: true })

  if (error) throw error
  return (data ?? []) as PlanFeatures[]
}

export async function getStoreCatalogStatus(
  storeId: string,
): Promise<StoreCatalogStatus | null> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .rpc('store_catalog_status', { target_store: storeId })
    .maybeSingle()

  if (error) throw error
  return (data as StoreCatalogStatus | null) ?? null
}
