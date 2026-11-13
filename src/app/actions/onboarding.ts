"use server";

import { queueAnalyticsEvent } from "@/lib/analytics/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { normalizeWhatsAppToDb, sanitizeStoreSlug } from "@/lib/utils";
import { notifyAdminNewStoreCreated } from "@/lib/resend";
import {
  friendlyDbError,
  resolveStoreCategory,
  toStoreColumns,
} from "@/lib/db-columns";
import type {
  DaySchedule,
  DeliveryFeeType,
  PaymentMethod,
  ServiceMode,
} from "@/types/marketplace";

const SERVICE_MODES: readonly ServiceMode[] = ["physical", "online"];

/** Normaliza o Instagram para "@usuario" (ou null se vazio/inválido). */
function normalizeInstagram(raw?: string | null): string | null {
  const handle = (raw || "")
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@+/, "")
    .replace(/[/?#].*$/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? `@${handle}` : null;
}

const SYSTEM_SLUG_BLACKLIST = new Set([
  "admin",
  "painel",
  "master",
  "api",
  "login",
  "cadastro",
  "recuperar-senha",
  "nova-senha",
  "onboarding",
  "sacola",
  "checkout",
  "explorar",
  "lojas",
  "minha-conta",
  "termos",
  "privacidade",
  "www",
  "app",
  "lapa",
  "borapralapa",
]);

const DEMO_TAKEN_SLUGS = new Set([
  "bella-moda-lapa",
  "imperio-dos-calcados",
  "lapa-tech-celulares",
]);

export interface SlugCheckResult {
  available: boolean;
  slug: string;
  reason?: "empty" | "too_short" | "reserved" | "taken" | "available";
  message: string;
}

export interface CreateStorePayload {
  name: string;
  slug: string;
  logo_url?: string | null;
  description?: string | null;
  whatsapp: string;
  /** "@usuario" ou null. */
  instagram?: string | null;
  /** Loja física e/ou online. */
  service_modes?: ServiceMode[];
  /** Categoria principal da loja (`global_categories.id`, sem pai) ou "other". */
  category_id?: string | null;
  /** Nome digitado quando a categoria é "Outra". */
  category_other?: string | null;
  neighborhood_id: string;
  neighborhood_name?: string;
  address: string;
  payment_methods: PaymentMethod[];
  installment_info?: string | null;
  has_delivery: boolean;
  has_pickup: boolean;
  delivery_fee_type: DeliveryFeeType;
  delivery_fee?: number | null;
  business_hours: Record<number, DaySchedule> | DaySchedule[];
}

export interface CreateStoreActionResult {
  success?: boolean;
  error?: string;
}

/**
 * Higieniza e valida a disponibilidade de um slug de loja em tempo real.
 */
export async function checkSlugAvailability(
  rawSlug: string
): Promise<SlugCheckResult> {
  const slug = sanitizeStoreSlug(rawSlug || "");

  if (!slug) {
    return {
      available: false,
      slug: "",
      reason: "empty",
      message: "Digite o endereço desejado para o seu catálogo.",
    };
  }

  if (slug.length < 3) {
    return {
      available: false,
      slug,
      reason: "too_short",
      message: "O link deve ter pelo menos 3 caracteres.",
    };
  }

  if (SYSTEM_SLUG_BLACKLIST.has(slug)) {
    return {
      available: false,
      slug,
      reason: "reserved",
      message: "Este endereço é reservado pelo sistema. Escolha outro nome.",
    };
  }

  if (!isSupabaseConfigured()) {
    if (DEMO_TAKEN_SLUGS.has(slug)) {
      return {
        available: false,
        slug,
        reason: "taken",
        message: "Este endereço já está em uso",
      };
    }

    return {
      available: true,
      slug,
      reason: "available",
      message: "Link disponível!",
    };
  }

  try {
    const supabase = await createClient();
    const { data: existingStore } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingStore) {
      return {
        available: false,
        slug,
        reason: "taken",
        message: "Este endereço já está em uso",
      };
    }

    return {
      available: true,
      slug,
      reason: "available",
      message: "Link disponível!",
    };
  } catch {
    return {
      available: true,
      slug,
      reason: "available",
      message: "Link disponível!",
    };
  }
}

/**
 * Cria a loja em `public.stores` com `owner_id = auth.uid()`,
 * atualiza `role` em `public.profiles` para `'merchant'`
 * e redireciona para `/painel/produtos/novo?onboarding=success`.
 */
export async function createStoreAction(
  payload: CreateStorePayload
): Promise<CreateStoreActionResult> {
  const name = (payload.name || "").trim();
  const slug = sanitizeStoreSlug(payload.slug || name);
  const cleanWhatsapp = normalizeWhatsAppToDb(payload.whatsapp || "");

  if (!name) {
    return { error: "Informe o nome da sua loja." };
  }

  const slugCheck = await checkSlugAvailability(slug);
  if (!slugCheck.available) {
    return { error: slugCheck.message };
  }

  if (!cleanWhatsapp || cleanWhatsapp.length < 12) {
    return {
      error: "Informe um número de WhatsApp válido com DDD (ex: 77 99999-9999).",
    };
  }

  if (!payload.neighborhood_id) {
    return { error: "Selecione o bairro da loja em Bom Jesus da Lapa." };
  }

  const serviceModes = (payload.service_modes ?? ["physical"]).filter((m) =>
    SERVICE_MODES.includes(m)
  );
  if (serviceModes.length === 0) {
    return {
      error: "Escolha o tipo de atendimento: loja física, online ou os dois.",
    };
  }
  const instagram = normalizeInstagram(payload.instagram);

  if (!payload.has_delivery && !payload.has_pickup) {
    return {
      error:
        "Selecione pelo menos uma modalidade de atendimento (Entrega ou Retirada na Loja).",
    };
  }

  if (!payload.payment_methods || payload.payment_methods.length === 0) {
    return {
      error: "Selecione pelo menos uma forma de pagamento aceita pela loja.",
    };
  }

  // Modo demonstração local sem Supabase configurado
  if (!isSupabaseConfigured()) {
    redirect("/painel/produtos/novo?onboarding=success");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error:
        "Você precisa estar autenticado para concluir o cadastro da sua loja. Entre na sua conta e tente novamente.",
    };
  }

  // 0. Categoria: valida antes de criar a loja
  const category = await resolveStoreCategory(
    supabase,
    payload.category_id,
    payload.category_other
  );
  if (category && "error" in category) {
    return { error: category.error };
  }

  // 1. Inserir loja em `public.stores` com `owner_id = user.id`
  // (nomes de coluna reais via `toStoreColumns`, ver src/lib/db-columns.ts)
  const storeRecord = toStoreColumns({
    owner_id: user.id,
    name,
    slug,
    logo_url: payload.logo_url || null,
    description: payload.description?.trim() || null,
    whatsapp: cleanWhatsapp,
    instagram,
    neighborhood_id: payload.neighborhood_id,
    address: payload.address?.trim() || null,
    payment_methods: payload.payment_methods,
    installment_info: payload.installment_info?.trim() || null,
    has_delivery: payload.has_delivery,
    has_pickup: payload.has_pickup,
    delivery_fee_type: payload.delivery_fee_type,
    delivery_fee:
      payload.delivery_fee_type === "fixed" && payload.delivery_fee != null
        ? Number(payload.delivery_fee)
        : 0,
    business_hours: payload.business_hours,
  });

  const { error: insertError } = await supabase.from("stores").insert({
    ...storeRecord,
    // Colunas criadas em supabase/2026-11-13_store_service_modes.sql
    service_modes: serviceModes,
    ...(category && "columns" in category ? category.columns : {}),
  });

  if (insertError) {
    console.error("[onboarding] Falha ao criar loja:", insertError.message);
    return {
      error: friendlyDbError(
        insertError.message,
        "Não foi possível criar sua loja agora. Seus dados continuam salvos aqui; tente de novo em instantes."
      ),
    };
  }

  // 2. Atualizar `role` do usuário em `public.profiles` para `'merchant'`
  try {
    await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          role: "merchant",
          whatsapp: cleanWhatsapp,
        },
        { onConflict: "id" }
      );
  } catch {
    // Segue normalmente caso a coluna role seja gerenciada por trigger
  }

  // Notificar administrador sobre a nova loja cadastrada via Resend
  await notifyAdminNewStoreCreated({
    storeName: name,
    slug,
    ownerEmail: user.email,
    whatsapp: cleanWhatsapp,
    address: payload.address,
    neighborhoodName: payload.neighborhood_name,
  });

  await queueAnalyticsEvent("store_created", { store_name: name });

  revalidatePath("/", "layout");

  // Primeiro produto já começa na categoria da loja
  const storeCategoryId =
    category && "columns" in category
      ? (category.columns.global_category_id as string | null)
      : null;
  redirect(
    storeCategoryId
      ? `/painel/produtos/novo?onboarding=success&categoria=${encodeURIComponent(storeCategoryId)}`
      : "/painel/produtos/novo?onboarding=success"
  );
}

/**
 * Define o perfil inicial escolhido no onboarding ("Como você quer usar a Lapa?"):
 * - `customer`: salva o role em `profiles` e redireciona para `/minha-conta` ou `nextPath`
 * - `merchant`: salva o role em `profiles` para prosseguir na criação da loja
 */
export async function setAccountRoleAction(
  role: "customer" | "merchant",
  nextPath?: string
): Promise<{ success: boolean; redirect?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: true,
      redirect: role === "customer" ? (nextPath || "/minha-conta") : undefined,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  try {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        role,
      },
      { onConflict: "id" }
    );
  } catch {
    // Segue normalmente
  }

  await queueAnalyticsEvent("onboarding_role_selected", { role });

  revalidatePath("/", "layout");

  const safeNext =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/minha-conta";

  return {
    success: true,
    redirect: role === "customer" ? safeNext : undefined,
  };
}

