/**
 * Tipagens Globais do Banco de Dados Supabase (Lapa Marketplace - Bom Jesus da Lapa/BA)
 * Mapeamento das tabelas de `public.*`
 */

import type {
  AccountType,
  CategoryFilterConfig,
  DaySchedule,
  DeliveryFeeType,
  PaymentMethod,
  ProductCondition,
  ProductGender,
  ProductVoltage,
  SpecialHour,
  StorePlan,
  WeeklyBusinessHours,
} from "./marketplace";

export type {
  AccountType,
  CategoryFilterConfig,
  DaySchedule,
  DeliveryFeeType,
  PaymentMethod,
  ProductCondition,
  ProductGender,
  ProductVoltage,
  SpecialHour,
  StorePlan,
  WeeklyBusinessHours,
};

export interface Neighborhood {
  id: string;
  name: string;
  slug?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface GlobalCategory {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  order_index: number;
  is_active: boolean;
  filter_config: CategoryFilterConfig;
  created_at?: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  whatsapp: string | null;
  default_neighborhood_id: string | null;
  default_address: string | null;
  avatar_url?: string | null;
  role?: AccountType | null; // 'customer' | 'merchant' | 'admin'
  created_at?: string;
  updated_at?: string;
}

export interface Store {
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
  address: string;
  plan_tier: "free" | "premium";
  is_verified: boolean;
  accepted_payments: PaymentMethod[];
  installment_info?: string | null;
  has_delivery: boolean;
  has_pickup: boolean;
  delivery_fee_type: DeliveryFeeType;
  delivery_fee?: number | null;
  business_hours: Record<number, DaySchedule> | WeeklyBusinessHours;
  special_hours: SpecialHour[];
  followers_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StoreCategory {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  order_index?: number;
  created_at?: string;
}

export interface Product {
  id: string;
  store_id: string;
  title: string;
  slug?: string;
  description?: string | null;
  price: number;
  promotional_price?: number | null;
  image_url: string;
  gallery_urls?: string[];
  category_id: string;
  subcategory_id?: string | null;
  gender?: ProductGender | null;
  sizes?: string[];
  voltage?: ProductVoltage | null;
  condition?: ProductCondition;
  is_active: boolean;
  views_count?: number;
  clicks_whatsapp?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StoreStory {
  id: string;
  store_id: string;
  media_url: string;
  media_type?: "image" | "video";
  caption?: string | null;
  product_id?: string | null;
  cta_url?: string | null;
  created_at: string;
  expires_at?: string;
}

export interface FollowedStore {
  user_id: string;
  store_id: string;
  created_at?: string;
}

export interface SavedProduct {
  user_id: string;
  product_id: string;
  created_at?: string;
}

