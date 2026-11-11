export type PaymentMethod =
  | "pix"
  | "credit_card"
  | "debit_card"
  | "cash"
  | "payment_link"
  | "boleto"
  | "crediario";

export type DeliveryFeeType = "free" | "fixed" | "combine";

export type ProductCondition = "new" | "used" | "refurbished";

export type StorePlan = "free" | "pro" | "premium";

export interface DaySchedule {
  /** 0 = Domingo, 1 = Segunda, ..., 6 = Sábado */
  dayOfWeek?: number;
  dayLabel?: string;
  isClosed?: boolean;
  openTime?: string; // "08:00"
  closeTime?: string; // "18:00"
  lunchStart?: string | null; // "12:00"
  lunchEnd?: string | null; // "14:00"
}

export interface SpecialHour {
  id?: string;
  date: string; // "YYYY-MM-DD"
  label: string; // Ex: "Romaria do Bom Jesus", "Feriado Municipal"
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

export type WeeklyBusinessHours = Record<string, DaySchedule> | DaySchedule[];

export interface StoreSummary {
  id: string;
  name: string;
  slug: string;
  avatar_url?: string | null;
  banner_url?: string | null;
  description?: string | null;
  neighborhood: string;
  neighborhood_id?: string;
  neighborhood_slug?: string;
  address?: string;
  instagram?: string | null;
  city?: string;
  whatsapp?: string;
  is_verified?: boolean;
  plan?: StorePlan;
  business_hours?: WeeklyBusinessHours | null;
  special_hours?: SpecialHour[] | null;
  is_open_override?: boolean | null;
  payment_methods?: PaymentMethod[];
  installment_info?: string | null;
  has_delivery?: boolean;
  has_pickup?: boolean;
  delivery_fee_type?: DeliveryFeeType;
  delivery_fee?: number | null;
  followers_count?: number;
}

export interface ProductItem {
  id: string;
  title: string;
  slug?: string;
  description?: string | null;
  price: number;
  promotional_price?: number | null;
  image_url: string;
  gallery_urls?: string[] | null;
  sizes?: string[] | null;
  colors?: string[] | null;
  gender?: ProductGender | null;
  voltage?: ProductVoltage | null;
  condition?: ProductCondition;
  category_id?: string;
  category_slug?: string;
  subcategory_id?: string | null;
  subcategory_slug?: string | null;
  stock?: number;
  is_featured?: boolean;
  is_active?: boolean;
  views_count?: number;
  clicks_whatsapp?: number;
  created_at?: string;
  store: StoreSummary;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  count?: number;
}

export interface StoreStoryItem {
  id: string;
  store_id: string;
  media_url: string;
  media_type?: "image" | "video";
  caption?: string | null;
  product_id?: string | null;
  product_title?: string | null;
  product_price?: number | null;
  cta_url?: string | null;
  created_at: string;
  expires_at?: string;
}

export interface StoreWithStories {
  store: StoreSummary;
  stories: StoreStoryItem[];
  hasUnseen?: boolean;
}

export type AccountType = "customer" | "merchant" | "admin";

export type ProductGender = "Feminino" | "Masculino" | "Unissex" | "Infantil";

export type ProductVoltage = "220V" | "110V" | "Bivolt";

export interface CategoryFilterConfig {
  has_gender?: boolean;
  has_size?: boolean;
  size_options?: string[];
  has_voltage?: boolean;
}

export interface GlobalCategory {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  order_index: number;
  is_active: boolean;
  filter_config: CategoryFilterConfig;
}

export interface MerchantProduct {
  id: string;
  store_id: string;
  title: string;
  slug?: string;
  description?: string | null;
  price: number;
  promotional_price?: number | null;
  image_url: string;
  gallery_urls: string[];
  category_id: string;
  subcategory_id?: string | null;
  gender?: ProductGender | null;
  sizes: string[];
  voltage?: ProductVoltage | null;
  condition: ProductCondition;
  is_active: boolean;
  views_count: number;
  clicks_whatsapp: number;
  created_at?: string;
}

export interface MerchantStoreConfig {
  id: string;
  owner_id?: string;
  name: string;
  slug: string;
  avatar_url?: string | null;
  banner_url?: string | null;
  description?: string | null;
  whatsapp: string;
  instagram?: string | null;
  neighborhood_id: string;
  neighborhood_name: string;
  address: string;
  plan_tier: "free" | "premium";
  is_verified: boolean;
  accepted_payments: PaymentMethod[];
  installment_info?: string | null;
  has_delivery: boolean;
  has_pickup: boolean;
  delivery_fee_type: DeliveryFeeType;
  delivery_fee?: number | null;
  business_hours: Record<number, DaySchedule>;
  special_hours: SpecialHour[];
  followers_count?: number;
}

export interface NeighborhoodItem {
  id: string;
  name: string;
  slug?: string;
  is_active?: boolean;
}

export interface CustomerProfile {
  id: string;
  full_name: string | null;
  email?: string | null;
  whatsapp: string | null;
  default_neighborhood_id: string | null;
  default_address: string | null;
  avatar_url?: string | null;
  role?: AccountType | null;
}


