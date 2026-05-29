export type AdminPlatformStats = {
  total_users: number
  total_stores: number
  total_products: number
  total_sellers: number
  paying_customers: number
  trial_customers: number
  cities_with_stores: { city: string; count: number }[]
  states_with_stores: { state: string; count: number }[]
  sectors_with_stores: { sector: string; count: number }[]
  stores_per_month: { month: string; count: number }[]
  revenue_per_month: { month: string; amount: number }[]
}

export type AdminStoreRow = {
  id: string
  name: string
  slug: string
  created_at: string
  owner_email: string
  owner_name: string | null
  plan_status: string | null
  plan_id: string | null
  trial_ends_at: string | null
  current_period_end: string | null
  last_payment_at: string | null
  product_count: number
  seller_count: number
}

export type AdminStoreDetail = {
  store: Record<string, unknown>
  owner: Record<string, unknown> | null
  subscription: Record<string, unknown> | null
  product_count: number
  active_product_count: number
  seller_count: number
  order_count: number
  checkout_count: number
  total_revenue_cents: number
  customer_count: number
  recent_orders: Record<string, unknown>[]
}
