/**
 * Injects CSS custom properties for a per-store primary color.
 * Called once per catalog page load after the store is resolved.
 */
export function applyStorePalette(primaryHex: string): void {
  const root = document.documentElement
  root.style.setProperty('--color-primary', primaryHex)
  root.style.setProperty('--color-primary-hover', darken(primaryHex, 0.1))
  root.style.setProperty('--color-primary-fg', getContrastColor(primaryHex))
}

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount))
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount))
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function getContrastColor(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = num >> 16
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  // WCAG relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}
