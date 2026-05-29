import { createBrowserClient } from '@/lib/supabase'
import type { PlanId } from '@/types/domain'

export async function deleteAdminStore(storeId: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase.rpc('admin_delete_store', { p_store_id: storeId })
  if (error) throw error
}

export async function grantComplimentary(
  storeId: string,
  planId: PlanId,
  expiresAt: string,
  notes?: string,
): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase.rpc('admin_grant_complimentary', {
    p_store_id: storeId,
    p_plan_id: planId,
    p_expires_at: expiresAt,
    p_notes: notes,
  })
  if (error) throw error
}
