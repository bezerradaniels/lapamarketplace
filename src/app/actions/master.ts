"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sanitizeStoreSlug } from "@/lib/utils";
import type { CategoryFilterConfig } from "@/types/marketplace";

export interface MasterActionResult {
  success?: boolean;
  message?: string;
  error?: string;
}

/**
 * Altera rapidamente `plan_tier` ('free' vs 'premium') ou `is_verified` (Loja Verificada)
 * de uma loja cadastrada em Bom Jesus da Lapa.
 */
export async function updateStoreAdminStatusAction(
  storeId: string,
  patch: {
    plan_tier?: "free" | "premium";
    is_verified?: boolean;
  }
): Promise<MasterActionResult> {
  if (!storeId) {
    return { error: "Loja inválida." };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message: "Status da loja atualizado (modo demonstração)!",
    };
  }

  const supabase = await createClient();
  const payload: Record<string, unknown> = {};

  if (patch.plan_tier !== undefined) {
    payload.plan_tier = patch.plan_tier;
    payload.plan = patch.plan_tier;
  }
  if (patch.is_verified !== undefined) {
    payload.is_verified = patch.is_verified;
  }

  const { error } = await supabase
    .from("stores")
    .update(payload)
    .eq("id", storeId);

  if (error) {
    return {
      error: error.message || "Não foi possível atualizar a loja.",
    };
  }

  revalidatePath("/master");
  revalidatePath("/master/lojas");
  revalidatePath("/painel");
  revalidatePath("/");
  return {
    success: true,
    message: "Loja atualizada com sucesso!",
  };
}

/**
 * Cria ou atualiza uma Categoria Global ou Subcategoria em `public.global_categories`,
 * incluindo `order_index`, `is_active` e `filter_config` (`has_gender`, `has_size`, `has_voltage`, `size_options`).
 */
export async function upsertGlobalCategoryAction(payload: {
  id?: string;
  name: string;
  slug?: string;
  parent_id?: string | null;
  order_index: number;
  is_active: boolean;
  filter_config: CategoryFilterConfig;
}): Promise<MasterActionResult> {
  const name = (payload.name || "").trim();
  if (!name) {
    return { error: "Informe o nome da categoria ou subcategoria." };
  }

  const slug = sanitizeStoreSlug(payload.slug || name);

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message: "Categoria salva com sucesso (modo demonstração)!",
    };
  }

  const supabase = await createClient();
  const record = {
    name,
    slug,
    parent_id: payload.parent_id || null,
    order_index: Number(payload.order_index || 1),
    is_active: payload.is_active,
    filter_config: payload.filter_config || {},
  };

  if (payload.id && !payload.id.startsWith("temp-")) {
    const { error } = await supabase
      .from("global_categories")
      .update(record)
      .eq("id", payload.id);

    if (error) {
      return { error: error.message || "Falha ao atualizar categoria." };
    }
  } else {
    const { error } = await supabase.from("global_categories").insert(record);
    if (error) {
      return { error: error.message || "Falha ao criar categoria." };
    }
  }

  revalidatePath("/master/taxonomia");
  revalidatePath("/painel/produtos/novo");
  revalidatePath("/");
  return {
    success: true,
    message: "Taxonomia de categoria atualizada com sucesso!",
  };
}

/**
 * Cria, edita ou oculta um Bairro em `public.neighborhoods`.
 */
export async function upsertNeighborhoodAction(payload: {
  id?: string;
  name: string;
  is_active?: boolean;
}): Promise<MasterActionResult> {
  const name = (payload.name || "").trim();
  if (!name) {
    return { error: "Informe o nome do bairro." };
  }

  const slug = sanitizeStoreSlug(name);

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message: "Bairro salvo com sucesso (modo demonstração)!",
    };
  }

  const supabase = await createClient();
  const record = {
    name,
    slug,
    is_active: payload.is_active ?? true,
  };

  if (payload.id && !payload.id.startsWith("temp-")) {
    const { error } = await supabase
      .from("neighborhoods")
      .update(record)
      .eq("id", payload.id);

    if (error) {
      return { error: error.message || "Falha ao atualizar bairro." };
    }
  } else {
    const { error } = await supabase.from("neighborhoods").insert(record);
    if (error) {
      return { error: error.message || "Falha ao adicionar bairro." };
    }
  }

  revalidatePath("/master/taxonomia");
  revalidatePath("/onboarding");
  revalidatePath("/minha-conta");
  revalidatePath("/");
  return {
    success: true,
    message: "Bairro salvo com sucesso!",
  };
}

