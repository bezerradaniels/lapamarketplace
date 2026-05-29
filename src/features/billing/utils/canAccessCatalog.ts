import type { StoreCatalogStatus, SubscriptionStatus } from '@/types/domain'

const ACTIVE_STATUSES: SubscriptionStatus[] = ['active', 'past_due']

/**
 * Whether the public catalog should be served right now.
 *
 * Per CLAUDE.md §13.10, a store is accessible when:
 *   1. The store exists (caller's responsibility — pass null only when no row).
 *   2. There's an active subscription **or** an active trial.
 *
 * Note: 'past_due' is included so a single failed payment doesn't immediately
 * suspend the store; suspension on first failed payment is enforced by the
 * webhook moving status → 'unpaid' or 'canceled'.
 */
export function canAccessCatalog(
  status: StoreCatalogStatus | null | undefined,
): boolean {
  if (!status) return false

  if (status.status === 'trialing') {
    if (!status.trial_ends_at) return false
    return new Date(status.trial_ends_at).getTime() > Date.now()
  }

  return ACTIVE_STATUSES.includes(status.status)
}

export function trialDaysLeft(
  status: StoreCatalogStatus | null | undefined,
): number | null {
  if (!status || status.status !== 'trialing' || !status.trial_ends_at) {
    return null
  }
  const ms = new Date(status.trial_ends_at).getTime() - Date.now()
  if (ms <= 0) return 0
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}
