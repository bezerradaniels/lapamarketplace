const KEY = 'zap_onboarding_session'
const STARTED_AT_KEY = 'zap_onboarding_started_at'

export type OnboardingSession = {
  storeId: string
  storeSlug: string
  storeName: string
}

export function saveOnboardingSession(data: OnboardingSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
    sessionStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // Storage unavailable in some private-browsing modes — silently ignore
  }
}

export function loadOnboardingSession(): OnboardingSession | null {
  try {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as OnboardingSession) : null
  } catch {
    return null
  }
}

export function clearOnboardingSession(): void {
  try {
    localStorage.removeItem(KEY)
    sessionStorage.removeItem(KEY)
    localStorage.removeItem(STARTED_AT_KEY)
  } catch {
    // ignore
  }
}

/**
 * Records the moment the owner entered onboarding (step 1), used to compute
 * `total_time_seconds` for the `onboarding_completed` analytics event. Only the
 * first call has any effect, so re-entering step 1 keeps the original start.
 */
export function markOnboardingStarted(): void {
  try {
    if (!localStorage.getItem(STARTED_AT_KEY)) {
      localStorage.setItem(STARTED_AT_KEY, String(Date.now()))
    }
  } catch {
    // ignore
  }
}

/** Seconds elapsed since `markOnboardingStarted()`. Returns 0 if unknown. */
export function getOnboardingElapsedSeconds(): number {
  try {
    const raw = localStorage.getItem(STARTED_AT_KEY)
    if (!raw) return 0
    return Math.max(0, Math.round((Date.now() - Number(raw)) / 1000))
  } catch {
    return 0
  }
}
