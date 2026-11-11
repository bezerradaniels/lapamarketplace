"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface ToggleSaveProductResult {
  requiresAuth?: boolean;
  saved?: boolean;
  error?: string;
}

export interface ToggleFollowStoreResult {
  requiresAuth?: boolean;
  following?: boolean;
  error?: string;
}

export interface UpdateProfileResult {
  success?: boolean;
  message?: string;
  error?: string;
}

/**
 * Favorita ou desfavorita um produto em `public.saved_products`.
 * Se o visitante não estiver autenticado, retorna `{ requiresAuth: true }`
 * para abrir o modal convidando a entrar com 1 clique.
 */
export async function toggleSaveProduct(
  productId: string
): Promise<ToggleSaveProductResult> {
  if (!productId) {
    return { error: "Produto inválido." };
  }

  if (!isSupabaseConfigured()) {
    return { requiresAuth: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { requiresAuth: true };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("saved_products")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (fetchError) {
    return {
      error: "Não foi possível verificar seus favoritos no momento.",
    };
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("saved_products")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);

    if (deleteError) {
      return { error: "Não foi possível remover o produto dos favoritos." };
    }

    revalidatePath("/");
    revalidatePath("/minha-conta");
    return { requiresAuth: false, saved: false };
  } else {
    const { error: insertError } = await supabase
      .from("saved_products")
      .insert({
        user_id: user.id,
        product_id: productId,
      });

    if (insertError) {
      return { error: "Não foi possível salvar este produto nos favoritos." };
    }

    revalidatePath("/");
    revalidatePath("/minha-conta");
    return { requiresAuth: false, saved: true };
  }
}

/**
 * Segue ou deixa de seguir uma loja em `public.followed_stores`.
 * Se o visitante não estiver autenticado, retorna `{ requiresAuth: true }`.
 */
export async function toggleFollowStore(
  storeId: string
): Promise<ToggleFollowStoreResult> {
  if (!storeId) {
    return { error: "Loja inválida." };
  }

  if (!isSupabaseConfigured()) {
    return { requiresAuth: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { requiresAuth: true };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("followed_stores")
    .select("store_id")
    .eq("user_id", user.id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (fetchError) {
    return {
      error: "Não foi possível verificar as lojas seguidas no momento.",
    };
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("followed_stores")
      .delete()
      .eq("user_id", user.id)
      .eq("store_id", storeId);

    if (deleteError) {
      return { error: "Não foi possível deixar de seguir esta loja." };
    }

    revalidatePath("/");
    revalidatePath("/minha-conta");
    return { requiresAuth: false, following: false };
  } else {
    const { error: insertError } = await supabase
      .from("followed_stores")
      .insert({
        user_id: user.id,
        store_id: storeId,
      });

    if (insertError) {
      return { error: "Não foi possível seguir esta loja no momento." };
    }

    revalidatePath("/");
    revalidatePath("/minha-conta");
    return { requiresAuth: false, following: true };
  }
}

/**
 * Atualiza `full_name`, `whatsapp`, `default_neighborhood_id` e `default_address`
 * na tabela `public.profiles` (dados que preencherão a Sacola automaticamente na Etapa 7).
 */
export async function updateCustomerProfile(
  formData: FormData
): Promise<UpdateProfileResult> {
  const full_name = String(formData.get("full_name") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const default_neighborhood_id =
    String(formData.get("default_neighborhood_id") || "").trim() || null;
  const default_address =
    String(formData.get("default_address") || "").trim() || null;

  if (!full_name) {
    return { error: "Por favor, informe seu nome completo." };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message:
        "Dados de entrega salvos no modo de demonstração! Configure o .env.local para persistir no Supabase.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Sua sessão expirou. Faça login novamente para salvar seus dados.",
    };
  }

  const payload = {
    id: user.id,
    full_name,
    whatsapp: whatsapp || null,
    default_neighborhood_id,
    default_address,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    // Fallback caso a tabela não possua coluna updated_at
    const { error: retryError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name,
        whatsapp: whatsapp || null,
        default_neighborhood_id,
        default_address,
      },
      { onConflict: "id" }
    );

    if (retryError) {
      return {
        error:
          "Não foi possível salvar seus dados de entrega. Verifique sua conexão e tente novamente.",
      };
    }
  }

  revalidatePath("/minha-conta");
  return {
    success: true,
    message:
      "Seus dados de entrega foram salvos! Eles preencherão sua sacola automaticamente.",
  };
}

