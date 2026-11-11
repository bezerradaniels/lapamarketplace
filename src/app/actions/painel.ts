"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authorizeUserAction } from "@/lib/auth/guards";
import { normalizeWhatsAppToDb, sanitizeStoreSlug } from "@/lib/utils";
import type {
  DaySchedule,
  DeliveryFeeType,
  PaymentMethod,
  ProductCondition,
  ProductGender,
  ProductVoltage,
  SpecialHour,
} from "@/types/marketplace";

export interface ActionResponse {
  success?: boolean;
  message?: string;
  error?: string;
  id?: string;
}

export interface UpsertProductPayload {
  id?: string;
  store_id: string;
  title: string;
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
  condition?: ProductCondition;
  is_active?: boolean;
}

export interface UpdateStoreSettingsPayload {
  store_id: string;
  // Aba 1: Dados Gerais & Endereço
  name?: string;
  avatar_url?: string | null;
  banner_url?: string | null;
  description?: string | null;
  whatsapp?: string;
  instagram?: string | null;
  neighborhood_id?: string;
  address?: string;
  // Aba 2: Pagamentos & Entrega
  accepted_payments?: PaymentMethod[];
  installment_info?: string | null;
  has_delivery?: boolean;
  has_pickup?: boolean;
  delivery_fee_type?: DeliveryFeeType;
  delivery_fee?: number | null;
  // Aba 3: Horário de Funcionamento & Horários Especiais
  business_hours?: Record<number, DaySchedule>;
  special_hours?: SpecialHour[];
}

export interface CreateStoryPayload {
  store_id: string;
  media_url: string;
  caption?: string | null;
  product_id?: string | null;
}

const NOT_OWNER_ERROR = "Você não tem permissão para alterar esta loja.";

/** Confere no servidor se a loja pertence ao usuário autenticado. */
async function userOwnsStore(
  supabase: SupabaseClient,
  userId: string,
  storeId: string
): Promise<boolean> {
  if (!storeId) return false;
  const { data } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("owner_id", userId)
    .maybeSingle();
  return Boolean(data);
}

/** Retorna o `store_id` de um produto somente se a loja for do usuário. */
async function ownedStoreIdForProduct(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("products")
    .select("store_id")
    .eq("id", productId)
    .maybeSingle();
  const storeId = data?.store_id ? String(data.store_id) : null;
  if (!storeId) return null;
  return (await userOwnsStore(supabase, userId, storeId)) ? storeId : null;
}

/**
 * Switch Instantâneo (`is_active`) para pausar/ativar um produto esgotado
 * sem deletá-lo (preservando o SEO da página do produto).
 */
export async function toggleProductActiveAction(
  productId: string,
  isActive: boolean
): Promise<ActionResponse> {
  if (!productId) {
    return { error: "Produto inválido." };
  }

  const auth = await authorizeUserAction();
  if ("error" in auth) return { error: auth.error };

  if (auth.demo) {
    return {
      success: true,
      message: isActive
        ? "Produto reativado na vitrine (modo demonstração)."
        : "Produto pausado na vitrine (SEO preservado).",
    };
  }

  const { supabase, user } = auth;
  const ownedStoreId = await ownedStoreIdForProduct(
    supabase,
    user.id,
    productId
  );
  if (!ownedStoreId) {
    return { error: NOT_OWNER_ERROR };
  }

  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId)
    .eq("store_id", ownedStoreId);

  if (error) {
    return {
      error: "Não foi possível alterar a disponibilidade do produto.",
    };
  }

  revalidatePath("/painel");
  revalidatePath("/painel/produtos");
  revalidatePath("/");
  return {
    success: true,
    message: isActive
      ? "Produto ativado na vitrine!"
      : "Produto pausado sem perder o link de SEO!",
  };
}

/**
 * Cria ou edita um produto no catálogo da loja com filtros condicionais.
 */
export async function upsertProductAction(
  payload: UpsertProductPayload
): Promise<ActionResponse> {
  const title = (payload.title || "").trim();
  if (!title) {
    return { error: "Informe o título do produto." };
  }
  if (!payload.price || payload.price <= 0) {
    return { error: "Informe um preço válido maior que zero." };
  }
  if (
    payload.promotional_price != null &&
    payload.promotional_price > 0 &&
    payload.promotional_price >= payload.price
  ) {
    return {
      error: "O preço promocional deve ser menor que o preço normal.",
    };
  }
  if (!payload.image_url) {
    return { error: "Envie ou informe a foto principal do produto." };
  }
  if (!payload.category_id) {
    return { error: "Selecione a categoria principal do produto." };
  }

  const slug = `${sanitizeStoreSlug(title)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  const auth = await authorizeUserAction();
  if ("error" in auth) return { error: auth.error };

  if (auth.demo) {
    return {
      success: true,
      id: payload.id || `prod-${Date.now()}`,
      message: payload.id
        ? "Produto atualizado com sucesso (modo demonstração)!"
        : "Produto publicado no catálogo (modo demonstração)!",
    };
  }

  const { supabase, user } = auth;
  if (!(await userOwnsStore(supabase, user.id, payload.store_id))) {
    return { error: NOT_OWNER_ERROR };
  }
  if (
    payload.id &&
    (await ownedStoreIdForProduct(supabase, user.id, payload.id)) !==
      payload.store_id
  ) {
    return { error: NOT_OWNER_ERROR };
  }

  const record = {
    store_id: payload.store_id,
    title,
    slug: payload.id ? undefined : slug,
    description: payload.description?.trim() || null,
    price: Number(payload.price),
    promotional_price:
      payload.promotional_price && payload.promotional_price > 0
        ? Number(payload.promotional_price)
        : null,
    image_url: payload.image_url,
    gallery_urls: (payload.gallery_urls || []).slice(0, 3),
    category_id: payload.category_id,
    subcategory_id: payload.subcategory_id || null,
    gender: payload.gender || null,
    sizes: payload.sizes || [],
    voltage: payload.voltage || null,
    condition: payload.condition || "new",
    is_active: payload.is_active ?? true,
  };

  if (payload.id) {
    const { error } = await supabase
      .from("products")
      .update(record)
      .eq("id", payload.id)
      .eq("store_id", payload.store_id);

    if (error) {
      return {
        error:
          error.message || "Não foi possível salvar as alterações do produto.",
      };
    }

    revalidatePath("/painel");
    revalidatePath("/painel/produtos");
    revalidatePath("/");
    return {
      success: true,
      id: payload.id,
      message: "Produto atualizado com sucesso!",
    };
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(record)
      .select("id")
      .maybeSingle();

    if (error) {
      return {
        error: error.message || "Não foi possível cadastrar o produto.",
      };
    }

    revalidatePath("/painel");
    revalidatePath("/painel/produtos");
    revalidatePath("/");
    return {
      success: true,
      id: data?.id ? String(data.id) : undefined,
      message: "Produto publicado no catálogo com sucesso!",
    };
  }
}

/**
 * Publica um Story vertical de 24h para lojas do Plano Premium.
 */
export async function createStoreStoryAction(
  payload: CreateStoryPayload
): Promise<ActionResponse> {
  if (!payload.media_url) {
    return { error: "Envie uma foto vertical para publicar no Story." };
  }

  const auth = await authorizeUserAction();
  if ("error" in auth) return { error: auth.error };

  if (auth.demo) {
    return {
      success: true,
      message:
        "Story publicado por 24h no topo da Home (modo demonstração)!",
    };
  }

  const { supabase, user } = auth;
  if (!(await userOwnsStore(supabase, user.id, payload.store_id))) {
    return { error: NOT_OWNER_ERROR };
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("store_stories").insert({
    store_id: payload.store_id,
    media_url: payload.media_url,
    caption: payload.caption?.trim() || null,
    product_id: payload.product_id || null,
    expires_at: expiresAt,
  });

  if (error) {
    return {
      error:
        error.message || "Não foi possível publicar o Story no momento.",
    };
  }

  revalidatePath("/painel");
  revalidatePath("/");
  return {
    success: true,
    message: "Story publicado! Ele ficará em destaque no topo por 24 horas.",
  };
}

/**
 * Atualiza as configurações da loja (Dados Gerais, Pagamentos/Entrega e Horários/Horários Especiais).
 */
export async function updateStoreSettingsAction(
  payload: UpdateStoreSettingsPayload
): Promise<ActionResponse> {
  if (!payload.store_id) {
    return { error: "Loja inválida." };
  }

  const auth = await authorizeUserAction();
  if ("error" in auth) return { error: auth.error };

  if (auth.demo) {
    return {
      success: true,
      message:
        "Configurações da loja e horários atualizados com sucesso (modo demonstração)!",
    };
  }

  const { supabase, user } = auth;
  if (!(await userOwnsStore(supabase, user.id, payload.store_id))) {
    return { error: NOT_OWNER_ERROR };
  }

  const updateData: Record<string, unknown> = {};
  if (payload.name !== undefined) updateData.name = payload.name.trim();
  if (payload.avatar_url !== undefined) {
    updateData.avatar_url = payload.avatar_url;
    updateData.logo_url = payload.avatar_url;
  }
  if (payload.banner_url !== undefined) {
    updateData.banner_url = payload.banner_url;
  }
  if (payload.description !== undefined) {
    updateData.description = payload.description?.trim() || null;
  }
  if (payload.whatsapp !== undefined) {
    updateData.whatsapp = normalizeWhatsAppToDb(payload.whatsapp);
  }
  if (payload.instagram !== undefined) {
    updateData.instagram = payload.instagram?.trim() || null;
  }
  if (payload.neighborhood_id !== undefined) {
    updateData.neighborhood_id = payload.neighborhood_id;
  }
  if (payload.address !== undefined) {
    updateData.address = payload.address.trim();
  }
  if (payload.accepted_payments !== undefined) {
    updateData.accepted_payments = payload.accepted_payments;
  }
  if (payload.installment_info !== undefined) {
    updateData.installment_info = payload.installment_info?.trim() || null;
  }
  if (payload.has_delivery !== undefined) {
    updateData.has_delivery = payload.has_delivery;
  }
  if (payload.has_pickup !== undefined) {
    updateData.has_pickup = payload.has_pickup;
  }
  if (payload.delivery_fee_type !== undefined) {
    updateData.delivery_fee_type = payload.delivery_fee_type;
  }
  if (payload.delivery_fee !== undefined) {
    updateData.delivery_fee = Number(payload.delivery_fee || 0);
  }
  if (payload.business_hours !== undefined) {
    updateData.business_hours = payload.business_hours;
  }
  if (payload.special_hours !== undefined) {
    updateData.special_hours = payload.special_hours;
  }

  const { error } = await supabase
    .from("stores")
    .update(updateData)
    .eq("id", payload.store_id)
    .eq("owner_id", user.id);

  if (error) {
    return {
      error:
        error.message ||
        "Não foi possível salvar as configurações da loja no momento.",
    };
  }

  revalidatePath("/painel");
  revalidatePath("/painel/configuracoes");
  revalidatePath("/");
  return {
    success: true,
    message: "Configurações da loja salvas com sucesso!",
  };
}

