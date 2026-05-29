import type {
  AnalyticsEventMap,
  AnalyticsEventName,
  AnalyticsEventParams,
} from './events'

/**
 * Mesma chave usada pelo banner de consentimento (`CookieConsentBanner.tsx`) e
 * pelo carregador do GTM no `index.html`. Eventos só vão para a `dataLayer`
 * depois que o visitante aceita os cookies de análise (LGPD).
 */
const COOKIE_CONSENT_KEY = 'lapa_cookie_consent'

function hasAnalyticsConsent(): boolean {
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted'
  } catch {
    return false
  }
}

/**
 * Empurra um payload bruto para a `dataLayer` do GTM. A `dataLayer` já é
 * inicializada no `index.html` antes de qualquer script, então o push é seguro
 * mesmo que o container do GTM ainda não tenha carregado — o GTM reprocessa a
 * fila ao subir.
 */
function pushToDataLayer(payload: Record<string, unknown>): void {
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(payload)
}

/**
 * Dispara um evento de analytics de forma tipada.
 *
 * - Eventos sem parâmetros (ex.: `logout`) são chamados sem o segundo argumento.
 * - Em desenvolvimento, loga no console em vez de enviar (facilita depuração).
 * - Em produção, só envia se houver consentimento de análise.
 *
 * @example
 *   track('product_created', { product_id, product_name, has_image, has_variations })
 *   track('logout')
 */
export function track<E extends AnalyticsEventName>(
  ...args: AnalyticsEventMap[E] extends Record<string, never>
    ? [event: E]
    : [event: E, params: AnalyticsEventParams<E>]
): void {
  const [event, params] = args as [E, AnalyticsEventParams<E>?]

  if (typeof window === 'undefined') return

  if (import.meta.env.DEV) {
    console.log('[analytics]', event, params ?? {})
    return
  }

  if (!hasAnalyticsConsent()) return

  pushToDataLayer({ event, ...(params ?? {}) })
}
