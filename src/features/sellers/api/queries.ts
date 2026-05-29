import { createBrowserClient } from '@/lib/supabase'
import type { UserRole } from '@/types/domain'

export type StoreMemberWithProfile = {
  user_id: string
  role: UserRole
  created_at: string
  email: string
  name: string | null
}

export async function listMembers(storeId: string): Promise<StoreMemberWithProfile[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('store_members')
    .select('user_id, role, created_at, profiles:user_id (email, name)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true })

  if (error) throw error

  type Row = {
    user_id: string
    role: UserRole
    created_at: string
    profiles: { email: string; name: string | null } | null
  }

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    user_id: r.user_id,
    role: r.role,
    created_at: r.created_at,
    email: r.profiles?.email ?? '—',
    name: r.profiles?.name ?? null,
  }))
}
