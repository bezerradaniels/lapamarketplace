export type PaymentMethod =
  | "pix"
  | "credit_card"
  | "debit_card"
  | "cash"
  | "boleto"
  | "crediario";

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
  neighborhood: string;
  city?: string;
  whatsapp?: string;
  is_verified?: boolean;
  plan?: StorePlan;
  business_hours?: WeeklyBusinessHours | null;
  special_hours?: SpecialHour[] | null;
  is_open_override?: boolean | null;
  payment_methods?: PaymentMethod[];
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
  condition?: ProductCondition;
  category_id?: string;
  category_slug?: string;
  stock?: number;
  is_featured?: boolean;
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

