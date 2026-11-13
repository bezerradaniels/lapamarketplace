/**
 * Ponte entre os nomes de campo usados no app e as colunas REAIS do banco
 * (Supabase do portal). Conferido no banco em 2026-11-13:
 *
 * stores:   whatsapp_number, instagram_url, address_text, logo_url,
 *           accepted_payments, delivery_options (["delivery","pickup"]),
 *           delivery_fee_type, fixed_delivery_fee, plan_tier
 *           (não existem: whatsapp, instagram, address, avatar_url, bio,
 *           payment_methods, has_delivery, has_pickup, delivery_fee, plan)
 * products: name, global_category_id, store_category_id, available_sizes
 *           (não existem: title, category_id, subcategory_id, sizes)
 *
 * Pendentes (supabase/2026-11-13_store_service_modes.sql): stores.service_modes,
 * stores.global_category_id, stores.category_other.
 *
 * Toda escrita em `stores`/`products` deve passar por aqui. As leituras
 * aceitam os dois formatos (nome real primeiro, nome antigo como reserva).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeliveryFeeType, PaymentMethod } from "@/types/marketplace";

type Raw = Record<string, unknown>;

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v : null;

/* ------------------------------- stores -------------------------------- */

export interface StoreWriteFields {
  name?: string;
  slug?: string;
  owner_id?: string;
  logo_url?: string | null;
  banner_url?: string | null;
  description?: string | null;
  whatsapp?: string;
  instagram?: string | null;
  neighborhood_id?: string;
  address?: string | null;
  payment_methods?: PaymentMethod[];
  installment_info?: string | null;
  has_delivery?: boolean;
  has_pickup?: boolean;
  delivery_fee_type?: DeliveryFeeType;
  delivery_fee?: number | null;
  business_hours?: unknown;
  special_hours?: unknown;
}

/** Campos do app → colunas reais de `stores` (só inclui o que veio definido). */
export function toStoreColumns(f: StoreWriteFields): Raw {
  const row: Raw = {};
  if (f.owner_id !== undefined) row.owner_id = f.owner_id;
  if (f.name !== undefined) row.name = f.name;
  if (f.slug !== undefined) row.slug = f.slug;
  if (f.logo_url !== undefined) row.logo_url = f.logo_url;
  if (f.banner_url !== undefined) row.banner_url = f.banner_url;
  if (f.description !== undefined) row.description = f.description;
  if (f.whatsapp !== undefined) row.whatsapp_number = f.whatsapp;
  if (f.instagram !== undefined) row.instagram_url = f.instagram;
  if (f.neighborhood_id !== undefined) row.neighborhood_id = f.neighborhood_id;
  if (f.address !== undefined) row.address_text = f.address;
  if (f.payment_methods !== undefined) row.accepted_payments = f.payment_methods;
  if (f.installment_info !== undefined) row.installment_info = f.installment_info;
  if (f.has_delivery !== undefined || f.has_pickup !== undefined) {
    const options: string[] = [];
    if (f.has_delivery) options.push("delivery");
    if (f.has_pickup) options.push("pickup");
    row.delivery_options = options;
  }
  if (f.delivery_fee_type !== undefined) row.delivery_fee_type = f.delivery_fee_type;
  if (f.delivery_fee !== undefined) row.fixed_delivery_fee = f.delivery_fee ?? 0;
  if (f.business_hours !== undefined) row.business_hours = f.business_hours;
  if (f.special_hours !== undefined) row.special_hours = f.special_hours;
  return row;
}

/** Lê os campos de contato/entrega de uma linha de `stores`, em qualquer formato. */
export function readStoreRow(raw: Raw) {
  const options = Array.isArray(raw.delivery_options)
    ? (raw.delivery_options as string[])
    : null;
  const payments = Array.isArray(raw.accepted_payments)
    ? (raw.accepted_payments as PaymentMethod[])
    : Array.isArray(raw.payment_methods)
    ? (raw.payment_methods as PaymentMethod[])
    : null;
  const fee = raw.fixed_delivery_fee ?? raw.delivery_fee;

  return {
    logoUrl: str(raw.logo_url) ?? str(raw.avatar_url),
    whatsapp: str(raw.whatsapp_number) ?? str(raw.whatsapp) ?? "",
    instagram: str(raw.instagram_url) ?? str(raw.instagram),
    address: str(raw.address_text) ?? str(raw.address),
    description: str(raw.description) ?? str(raw.bio),
    paymentMethods: payments,
    hasDelivery: options ? options.includes("delivery") : raw.has_delivery !== false,
    hasPickup: options ? options.includes("pickup") : raw.has_pickup !== false,
    deliveryFee: fee != null ? Number(fee) : 0,
    isPremium: String(raw.plan_tier ?? raw.plan ?? "free") === "premium",
    categoryId: str(raw.global_category_id),
    categoryOther: str(raw.category_other),
  };
}

/* ------------------------- categoria da loja --------------------------- */

/** Valor da opção "Outra" no seletor de categoria da loja. */
export const STORE_CATEGORY_OTHER = "other";

/**
 * Valida a categoria escolhida e devolve as colunas a gravar em `stores`
 * (`global_category_id` + `category_other`). Só aceita categoria principal
 * ativa do portal; "Outra" exige o nome digitado.
 */
export async function resolveStoreCategory(
  supabase: SupabaseClient,
  categoryId: string | null | undefined,
  categoryOther: string | null | undefined
): Promise<{ columns: Raw } | { error: string } | null> {
  if (!categoryId) return null;

  if (categoryId === STORE_CATEGORY_OTHER) {
    const text = (categoryOther || "").trim().replace(/\s+/g, " ").slice(0, 60);
    if (text.length < 2) {
      return { error: "Escreva qual é a categoria da sua loja." };
    }
    return { columns: { global_category_id: null, category_other: text } };
  }

  const { data: category } = await supabase
    .from("global_categories")
    .select("id")
    .eq("id", categoryId)
    .is("parent_id", null)
    .eq("is_active", true)
    .maybeSingle();

  if (!category) {
    return { error: "Escolha uma categoria válida para a loja." };
  }
  return { columns: { global_category_id: category.id, category_other: null } };
}

/* ------------------------------ products ------------------------------- */

export interface ProductWriteFields {
  title?: string;
  /** Categoria principal. */
  category_id?: string;
  /** Subcategoria (mais específica): vai para `global_category_id` quando existe. */
  subcategory_id?: string | null;
  sizes?: string[];
}

/**
 * Campos do app → colunas reais de `products`. Só existe uma coluna de
 * categoria global: grava a subcategoria quando há, senão a principal (a
 * principal é recuperada pelo `parent_id` da subcategoria na leitura).
 */
export function toProductColumns(f: ProductWriteFields): Raw {
  const row: Raw = {};
  if (f.title !== undefined) row.name = f.title;
  if (f.category_id !== undefined || f.subcategory_id !== undefined) {
    row.global_category_id = f.subcategory_id || f.category_id || null;
  }
  if (f.sizes !== undefined) row.available_sizes = f.sizes;
  return row;
}

interface CategoryLike {
  id: string;
  parent_id?: string | null;
}

/** Lê nome, tamanhos e categorias de uma linha de `products`, em qualquer formato. */
export function readProductRow(
  raw: Raw,
  categoriesById?: Map<string, CategoryLike>
) {
  const globalId =
    str(raw.global_category_id) ?? str(raw.subcategory_id) ?? str(raw.category_id);
  const cat = globalId ? categoriesById?.get(globalId) : undefined;
  const parentId = cat?.parent_id ?? null;

  return {
    title: str(raw.name) ?? str(raw.title) ?? "Produto",
    sizes: Array.isArray(raw.available_sizes)
      ? (raw.available_sizes as string[])
      : Array.isArray(raw.sizes)
      ? (raw.sizes as string[])
      : [],
    categoryId: str(raw.category_id) ?? (parentId || globalId),
    subcategoryId: str(raw.subcategory_id) ?? (parentId ? globalId : null),
  };
}

/* -------------------------------- erros -------------------------------- */

/** Erros técnicos do banco não vão para a tela: troca por uma mensagem humana. */
export function friendlyDbError(message: string | undefined, fallback: string) {
  if (!message) return fallback;
  const technical =
    /schema cache|column|relation|violates|constraint|syntax|permission denied|JWT|PGRST|duplicate key/i;
  if (/duplicate key.*slug/i.test(message)) {
    return "Este link já está em uso. Escolha outro para a sua loja.";
  }
  return technical.test(message) ? fallback : message;
}
