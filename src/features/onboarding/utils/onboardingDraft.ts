const PREFIX = 'zap_draft_step_'

export function saveDraft<T>(step: number, data: T): void {
  try {
    localStorage.setItem(`${PREFIX}${step}`, JSON.stringify(data))
  } catch {}
}

export function loadDraft<T>(step: number): Partial<T> | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${step}`)
    return raw ? (JSON.parse(raw) as Partial<T>) : null
  } catch {
    return null
  }
}

export function clearDraft(step: number): void {
  try {
    localStorage.removeItem(`${PREFIX}${step}`)
  } catch {}
}

export function clearAllDrafts(): void {
  for (let i = 1; i <= 4; i++) clearDraft(i)
}
