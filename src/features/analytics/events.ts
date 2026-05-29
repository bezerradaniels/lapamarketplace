/**
 * Catálogo tipado de eventos de analytics.
 *
 * Cada chave é o nome do evento (`snake_case`, exatamente como chega no GTM /
 * GA4) e o valor é o shape dos parâmetros aceitos. Isso transforma o catálogo
 * em `docs/ga4-events-mapping.md` em algo que o TypeScript consegue garantir:
 * passar um nome inexistente ou um parâmetro errado não compila.
 *
 * Convenções:
 * - nomes e parâmetros em `snake_case`;
 * - nunca enviar dados sensíveis (senha, token, e-mail, telefone bruto, CPF/CNPJ);
 * - valores são sempre `string | number | boolean` (o que o GA4 aceita).
 *
 * Ao adicionar um evento aqui, atualize também `docs/ga4-events-mapping.md`.
 */

/** Parâmetros que todo evento pode carregar (preenchidos pelo `track`). */
type BaseParams = {
  /** Loja ativa, quando houver. Útil para segmentar relatórios por lojista. */
  store_id?: string
}

export type AnalyticsEventMap = {
  // ── Autenticação ──────────────────────────────────────────────────────────
  sign_up: { method: 'email' }
  login: { method: 'email' }
  logout: Record<string, never>

  // ── Onboarding ──────────────────────────────────────────────────────────
  onboarding_started: { step: number }
  onboarding_step_completed: { step: number; step_name: string }
  onboarding_completed: { total_time_seconds: number }

  // ── Loja ──────────────────────────────────────────────────────────────────
  store_created: { store_id: string; store_slug: string }
  store_updated: { store_id: string; field: string }

  // ── Produtos (ações do dashboard) ──────────────────────────────────────────
  product_created: {
    product_id: string
    product_name: string
    has_image: boolean
    has_variations: boolean
  }
  product_updated: { product_id: string }
  product_deleted: { product_id: string }
  product_bulk_created: { product_count: number }

  // ── Vendedores ──────────────────────────────────────────────────────────
  seller_created: { seller_id: string; has_dashboard_access: boolean }
  seller_updated: { seller_id: string }
  seller_deleted: { seller_id: string }

  // ── Clientes ──────────────────────────────────────────────────────────────
  customer_created: { customer_id: string }
  customer_updated: { customer_id: string }
  customer_deleted: { customer_id: string }

  // ── Categorias ──────────────────────────────────────────────────────────
  category_created: { category_id: string; category_name: string }
  category_updated: { category_id: string }
  category_deleted: { category_id: string }

  // ── Cupons (loja) ──────────────────────────────────────────────────────────
  coupon_created: {
    coupon_id: string
    coupon_code: string
    discount_type: 'percent' | 'fixed'
    discount_value: number
  }
  coupon_updated: { coupon_id: string }
  coupon_deleted: { coupon_id: string }
  coupon_applied: { coupon_code: string; discount_value: number }
  coupon_removed: { coupon_code: string }

  // ── Pedidos (dashboard) ────────────────────────────────────────────────────
  order_created: {
    order_id: string
    total_value: number
    item_count: number
    has_coupon: boolean
  }
  order_status_changed: { order_id: string; old_status: string; new_status: string }

  // ── Vitrine pública / e-commerce ────────────────────────────────────────────
  // Nomes alinhados às recomendações de e-commerce do GA4 para os relatórios
  // de e-commerce funcionarem sem configuração extra.
  view_item: { item_id: string; item_name: string }
  add_to_cart: { item_id: string; item_name: string; quantity: number; price: number }
  remove_from_cart: { item_id: string; quantity: number }
  begin_checkout: { item_count: number; value: number }
  /** Pedido enviado ao lojista via WhatsApp (equivalente a `purchase`). */
  order_submitted: { order_id: string; value: number; item_count: number; has_coupon: boolean }

  // ── Engajamento ──────────────────────────────────────────────────────────
  share_link_copied: { link_type: 'store' | 'product' | 'seller'; item_id: string }
  search_performed: { search_term: string; result_count: number }

  // ── Faturamento (assinatura do lojista) ─────────────────────────────────────
  pricing_page_viewed: Record<string, never>
  trial_started: { plan_tier: string; trial_days: number }
  subscription_started: { plan_tier: string }
}

/** Nomes válidos de evento. */
export type AnalyticsEventName = keyof AnalyticsEventMap

/** Parâmetros de um evento, já mesclados com os parâmetros base. */
export type AnalyticsEventParams<E extends AnalyticsEventName> = AnalyticsEventMap[E] &
  BaseParams
