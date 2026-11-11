"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { FALLBACK_NEIGHBORHOODS } from "@/lib/panel-data";
import type { CustomerProfile, NeighborhoodItem } from "@/types/marketplace";

/**
 * Incrementa `clicks_whatsapp = clicks_whatsapp + 1` na tabela `public.products`
 * para todos os produtos enviados no pedido via WhatsApp, dando visibilidade
 * de ROI ao lojista no painel `/painel`.
 */
export async function registerWhatsappOrderClick(
  productIds: string[]
): Promise<{ success: boolean }> {
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)));
  if (uniqueIds.length === 0 || !isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const supabase = await createClient();

    for (const prodId of uniqueIds) {
      const { data: row } = await supabase
        .from("products")
        .select("clicks_whatsapp")
        .eq("id", prodId)
        .maybeSingle();

      if (row) {
        const nextClicks = Number(row.clicks_whatsapp || 0) + 1;
        await supabase
          .from("products")
          .update({ clicks_whatsapp: nextClicks })
          .eq("id", prodId);
      }
    }

    revalidatePath("/painel");
    revalidatePath("/painel/produtos");
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Busca os dados do comprador logado (`public.profiles`) e a lista de bairros
 * de Bom Jesus da Lapa para preenchimento automático na página `/sacola`.
 */
export async function fetchBagBuyerContext(): Promise<{
  buyerProfile: CustomerProfile | null;
  neighborhoods: NeighborhoodItem[];
}> {
  if (!isSupabaseConfigured()) {
    return {
      buyerProfile: null,
      neighborhoods: FALLBACK_NEIGHBORHOODS,
    };
  }

  try {
    const supabase = await createClient();

    let neighborhoods = FALLBACK_NEIGHBORHOODS;
    const { data: dbNeighborhoods } = await supabase
      .from("neighborhoods")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (dbNeighborhoods && dbNeighborhoods.length > 0) {
      neighborhoods = dbNeighborhoods.map((nb: Record<string, unknown>) => ({
        id: String(nb.id),
        name: String(nb.name),
        slug: nb.slug ? String(nb.slug) : undefined,
        is_active: nb.is_active !== false,
      }));
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { buyerProfile: null, neighborhoods };
    }

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const meta = (user.user_metadata || {}) as Record<string, unknown>;

    const buyerProfile: CustomerProfile = {
      id: user.id,
      full_name:
        (profileRow?.full_name as string | null) ??
        (meta.full_name as string | null) ??
        null,
      email: user.email ?? null,
      whatsapp:
        (profileRow?.whatsapp as string | null) ??
        (meta.whatsapp as string | null) ??
        null,
      default_neighborhood_id:
        (profileRow?.default_neighborhood_id as string | null) ?? null,
      default_address: (profileRow?.default_address as string | null) ?? null,
    };

    return {
      buyerProfile,
      neighborhoods,
    };
  } catch {
    return {
      buyerProfile: null,
      neighborhoods: FALLBACK_NEIGHBORHOODS,
    };
  }
}

