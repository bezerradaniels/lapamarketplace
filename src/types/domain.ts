// Domain types for the Lapa Marketplace business model.
// These are hand-maintained; database.ts is auto-generated.

export type UserRole = 'owner' | 'seller'

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'credit_card'
  | 'debit_card'
  | 'pix'
  | 'boleto'
  | 'payment_link'

export type ShippingMethod =
  | 'delivery'
  | 'pickup_in_store'
  | 'room_service'
  | 'digital'

export type ProductSortOrder =
  | 'recent'
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'

export type DeliverySlot = {
  days: string
  start: string
  end: string
}

export type SocialLinks = {
  instagram?: string
  facebook?: string
  x?: string
  youtube?: string
  kwai?: string
  tiktok?: string
}

export type CustomLink = {
  label: string
  url: string
}

export type Store = {
  id: string
  slug: string
  name: string
  owner_id: string
  slogan: string | null
  about_us: string | null
  cnpj: string | null
  logo_url: string | null
  banner_url: string | null
  contact_email: string | null
  contact_phone: string | null
  primary_color: string
  whatsapp_phone: string | null
  // Catalog settings
  age_restricted: boolean
  locale: string
  currency: string
  show_out_of_stock: boolean
  product_sort: ProductSortOrder
  cart_enabled: boolean
  whatsapp_button_enabled: boolean
  accepted_payment_methods: PaymentMethod[]
  accepted_shipping_methods: ShippingMethod[]
  delivery_hours: DeliverySlot[]
  // Address
  address_cep: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  // Checkout requirements
  payment_instructions_title: string | null
  payment_instructions_message: string | null
  require_cpf: boolean
  require_shipping_choice: boolean
  require_payment_choice: boolean
  // Social
  social_links: SocialLinks
  custom_links: CustomLink[]
  gallery_images: string[]
  // Integrations
  gtm_id: string | null
  slug_last_updated_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type StoreMember = {
  store_id: string
  user_id: string
  role: UserRole
  created_at: string
}

export type VariationOption = {
  name: string
  image_url?: string | null
  stock?: number | null
  sku?: string | null
  attributes?: Record<string, string> | null
}

export type ProductCondition = 'new' | 'used' | 'refurbished'
export type VariationType = 'color' | 'size' | 'other'

export type Product = {
  id: string
  store_id: string
  name: string
  description: string | null
  price_in_cents: number
  promo_price_in_cents: number | null
  installment_count: number | null
  installment_total_in_cents: number | null
  category: string | null
  subcategory: string | null
  brand: string | null
  unit: string | null
  barcode: string | null
  barcode_type: string | null
  sku: string | null
  auto_sku: boolean
  condition: ProductCondition
  purchase_recurrence: string | null
  has_no_brand: boolean
  cost_in_cents: number | null
  images: string[]
  is_active: boolean
  is_featured: boolean
  stock: number | null
  has_variations: boolean
  variation_type: VariationType | null
  variation_label: string | null
  variation_options: VariationOption[] | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type OrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type OrderSource = 'catalog' | 'manual'

export type Order = {
  id: string
  store_id: string
  status: OrderStatus
  source: OrderSource
  seller_id: string | null
  customer_name: string
  customer_phone: string
  customer_notes: string | null
  total_in_cents: number
  discount_in_cents: number
  coupon_id: string | null
  coupon_code: string | null
  created_at: string
  updated_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  price_in_cents: number
  quantity: number
  selected_variation: string | null
  created_at: string
}

export type OrderWithItems = Order & { items: OrderItem[] }

export type Customer = {
  id: string
  store_id: string
  name: string
  phone: string
  email: string | null
  created_at: string
}

export type PlanId = 'basico' | 'pro' | 'premium'

export type SubscriptionStatus =
  | 'none'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'

export type Subscription = {
  store_id: string
  plan_id: PlanId
  status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
  trial_ends_at: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export type PlanFeatures = {
  plan_id: PlanId
  name: string
  price_in_cents: number
  max_products: number | null
  max_sellers: number | null
  max_coupons: number | null
  has_ai_helpers: boolean
  has_pdf_export: boolean
  has_custom_theme: boolean
  has_featured_products: boolean
  has_gallery: boolean
  stripe_price_id: string | null
  stripe_price_monthly: string | null
  stripe_price_annual: string | null
  trial_period_days: number
}

export type Invoice = {
  id: string
  store_id: string
  stripe_invoice_id: string
  amount_in_cents: number
  status: string
  hosted_invoice_url: string | null
  pdf_url: string | null
  nfse_url: string | null
  paid_at: string | null
  created_at: string
}

/** Public catalog gating signal (shown to anon). */
export type StoreCatalogStatus = {
  status: SubscriptionStatus
  trial_ends_at: string | null
}

/* -------------------------------------------------------------------------- */
/* Coupons                                                                    */
/* -------------------------------------------------------------------------- */

export type CouponDiscountType = 'percent' | 'fixed'

export type StoreCoupon = {
  id: string
  store_id: string
  code: string
  description: string | null
  discount_type: CouponDiscountType
  discount_value: number
  min_subtotal_in_cents: number
  max_uses: number | null
  used_count: number
  is_active: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
  category_id: string | null
  custom_url: string | null
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

export type NotificationType =
  | 'order_new'
  | 'payment_failed'
  | 'low_stock'
  | 'seller_added'
  | 'subscription_event'

export type Notification = {
  id: string
  store_id: string
  user_id: string | null
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  data: Record<string, unknown>
  read_at: string | null
  created_at: string
}

/** Shape returned by the `validate_coupon` RPC (anon-callable). */
export type ValidatedCoupon = {
  id: string
  code: string
  description: string | null
  discount_type: CouponDiscountType
  discount_value: number
  /** Discount in cents already computed against the caller's subtotal. */
  discount_in_cents: number
  min_subtotal_in_cents: number
  expires_at: string | null
  category_id: string | null
}
