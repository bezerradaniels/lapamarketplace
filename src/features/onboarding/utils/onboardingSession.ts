const KEY = 'zap_onboarding_session'

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
  } catch {
    // ignore
  }
}
