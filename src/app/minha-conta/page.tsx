import React from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  MinhaContaClient,
  type AccountTab,
} from "@/components/account/MinhaContaClient";
import type { OwnStoreSummary } from "@/components/account/AccountStoreTab";
import { readProductRow, readStoreRow } from "@/lib/db-columns";
import type {
  CustomerProfile,
  NeighborhoodItem,
  ProductItem,
  StoreSummary,
} from "@/types/marketplace";

const FALLBACK_NEIGHBORHOODS: NeighborhoodItem[] = [
  { id: "centro", name: "Centro", slug: "centro" },
  { id: "sao-gotardo", name: "São Gotardo", slug: "sao-gotardo" },
  { id: "beira-rio", name: "Beira Rio", slug: "beira-rio" },
  { id: "maravilha", name: "Maravilha", slug: "maravilha" },
  { id: "primavera", name: "Primavera", slug: "primavera" },
  { id: "cavalhada", name: "Cavalhada", slug: "cavalhada" },
  { id: "amaralina", name: "Amaralina", slug: "amaralina" },
  { id: "shangri-la", name: "Shangri-lá", slug: "shangri-la" },
  { id: "lagoa-grande", name: "Lagoa Grande", slug: "lagoa-grande" },
  { id: "nova-brasilia", name: "Nova Brasília", slug: "nova-brasilia" },
  { id: "joao-paulo-ii", name: "João Paulo II", slug: "joao-paulo-ii" },
];

const DEMO_FOLLOWED_STORES: StoreSummary[] = [
  {
    id: "store-1",
    name: "Bella Moda Lapa",
    slug: "bella-moda-lapa",
    neighborhood: "Centro",
    whatsapp: "5577999112233",
    is_verified: true,
    plan: "premium",
    avatar_url:
      "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=250&q=80",
  },
  {
    id: "store-2",
    name: "Império dos Calçados",
    slug: "imperio-dos-calcados",
    neighborhood: "São Gotardo",
    whatsapp: "5577999445566",
    is_verified: true,
    plan: "premium",
    avatar_url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=250&q=80",
  },
];

const DEMO_SAVED_PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    title: "Conjunto Alfaiataria Linho Off-White",
    slug: "conjunto-alfaiataria-linho",
    price: 199.9,
    promotional_price: 159.9,
    image_url:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    sizes: ["P", "M", "G"],
    condition: "new",
    category_slug: "moda",
    store: DEMO_FOLLOWED_STORES[0],
  },
  {
    id: "prod-2",
    title: "Tênis Esportivo Ultra Comfort Vermelho",
    slug: "tenis-esportivo-ultra-comfort",
    price: 289.9,
    promotional_price: 229.9,
    image_url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    sizes: ["38", "39", "40", "41"],
    condition: "new",
    category_slug: "calcados",
    store: DEMO_FOLLOWED_STORES[1],
  },
];

function mapStoreRecord(raw: Record<string, unknown>): StoreSummary {
  const neighborhoodObj = raw.neighborhood as
    | Record<string, unknown>
    | string
    | null
    | undefined;
  const neighborhoodName =
    typeof neighborhoodObj === "string"
      ? neighborhoodObj
      : typeof neighborhoodObj?.name === "string"
      ? neighborhoodObj.name
      : typeof raw.neighborhood_name === "string"
      ? raw.neighborhood_name
      : "Centro";

  const cols = readStoreRow(raw);

  return {
    id: String(raw.id || ""),
    name: String(raw.name || "Loja de Lapa"),
    slug: String(raw.slug || raw.id || "loja"),
    avatar_url: cols.logoUrl,
    neighborhood: neighborhoodName,
    whatsapp: cols.whatsapp || undefined,
    is_verified: Boolean(raw.is_verified),
    plan: cols.isPremium ? "premium" : "free",
    business_hours:
      (raw.business_hours as StoreSummary["business_hours"]) ?? null,
    special_hours: (raw.special_hours as StoreSummary["special_hours"]) ?? null,
    is_open_override:
      (raw.is_open_override as boolean | null | undefined) ?? null,
  };
}

export default async function MinhaContaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const tabParam = resolvedParams?.aba || resolvedParams?.tab;
  const initialTab: AccountTab =
    tabParam === "stores" || tabParam === "lojas"
      ? "stores"
      : tabParam === "purchases" || tabParam === "compras"
      ? "purchases"
      : tabParam === "delivery" ||
        tabParam === "endereco" ||
        tabParam === "configuracoes"
      ? "delivery"
      : "favorites";

  const supabaseReady = isSupabaseConfigured();

  let isAuthenticated = false;
  let emailPendingConfirmation = false;
  let ownStore: OwnStoreSummary | null = null;
  let profile: CustomerProfile = {
    id: "visitor",
    full_name: "",
    email: null,
    whatsapp: "",
    default_neighborhood_id: FALLBACK_NEIGHBORHOODS[0].id,
    default_address: "",
  };
  let neighborhoods: NeighborhoodItem[] = FALLBACK_NEIGHBORHOODS;
  let savedProducts: ProductItem[] = DEMO_SAVED_PRODUCTS;
  let followedStores: StoreSummary[] = DEMO_FOLLOWED_STORES;

  if (supabaseReady) {
    const supabase = await createClient();

    // 1. Buscar bairros de `public.neighborhoods`
    try {
      const { data: dbNeighborhoods } = await supabase
        .from("neighborhoods")
        .select("id, name, slug")
        .order("name", { ascending: true });

      if (dbNeighborhoods && dbNeighborhoods.length > 0) {
        neighborhoods = dbNeighborhoods.map((nb) => ({
          id: String(nb.id),
          name: String(nb.name),
          slug: nb.slug ? String(nb.slug) : undefined,
        }));
      }
    } catch {
      // Mantém lista padrão dos bairros de Bom Jesus da Lapa
    }

    // 2. Verificar usuário logado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      isAuthenticated = true;
      emailPendingConfirmation = Boolean(user.email) && !user.email_confirmed_at;
      savedProducts = [];
      followedStores = [];

      // 3. Buscar dados do perfil em `public.profiles`
      const { data: dbProfile } = await supabase
        .from("profiles")
        .select(
          "id, full_name, whatsapp, default_neighborhood_id, default_address"
        )
        .eq("id", user.id)
        .maybeSingle();

      profile = {
        id: user.id,
        full_name:
          dbProfile?.full_name ||
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          "",
        email: user.email || null,
        whatsapp: dbProfile?.whatsapp || "",
        default_neighborhood_id:
          dbProfile?.default_neighborhood_id || (neighborhoods[0]?.id ?? null),
        default_address: dbProfile?.default_address || "",
      };

      // 3b. Loja própria (lojista): a aba "Loja" vira atalho para o painel
      try {
        const { data: dbStore } = await supabase
          .from("stores")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (dbStore?.slug) {
          ownStore = {
            name: String(dbStore.name || "Minha loja"),
            slug: String(dbStore.slug),
            avatarUrl:
              (dbStore.avatar_url as string | null) ??
              (dbStore.logo_url as string | null) ??
              null,
            isPremium:
              dbStore.plan_tier === "premium" || dbStore.plan === "premium",
          };
        }
      } catch {
        ownStore = null;
      }

      // 4. Buscar produtos favoritados em `public.saved_products`
      try {
        const { data: savedRows } = await supabase
          .from("saved_products")
          .select(
            "product_id, product:products(id, name, slug, description, price, promotional_price, image_url, gallery_urls, available_sizes, condition, store:stores(id, name, slug, logo_url, whatsapp_number, is_verified, plan_tier, business_hours, special_hours, neighborhood:neighborhoods(name)))"
          )
          .eq("user_id", user.id);

        if (savedRows && Array.isArray(savedRows)) {
          savedProducts = savedRows
            .map((row: Record<string, unknown>) => {
              const rawProd = row.product as
                | Record<string, unknown>
                | null
                | undefined;
              if (!rawProd) return null;

              const rawStore =
                (rawProd.store as Record<string, unknown> | null | undefined) ||
                {};

              const item: ProductItem = {
                id: String(rawProd.id || row.product_id),
                title: readProductRow(rawProd).title,
                slug: rawProd.slug ? String(rawProd.slug) : undefined,
                description: (rawProd.description as string | null) ?? null,
                price: Number(rawProd.price || 0),
                promotional_price:
                  rawProd.promotional_price != null
                    ? Number(rawProd.promotional_price)
                    : null,
                image_url: String(
                  rawProd.image_url ||
                    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
                ),
                gallery_urls:
                  (rawProd.gallery_urls as string[] | null | undefined) ?? null,
                sizes: readProductRow(rawProd).sizes,
                condition:
                  (rawProd.condition as ProductItem["condition"]) || "new",
                store: mapStoreRecord(rawStore),
              };
              return item;
            })
            .filter((item): item is ProductItem => item !== null);
        }
      } catch {
        // Mantém lista vazia caso relação ainda não exista
      }

      // 5. Buscar lojas seguidas em `public.followed_stores`
      try {
        const { data: followedRows } = await supabase
          .from("followed_stores")
          .select(
            "store_id, store:stores(id, name, slug, logo_url, whatsapp_number, is_verified, plan_tier, business_hours, special_hours, neighborhood:neighborhoods(name))"
          )
          .eq("user_id", user.id);

        if (followedRows && Array.isArray(followedRows)) {
          followedStores = followedRows
            .map((row: Record<string, unknown>) => {
              const rawStore = row.store as
                | Record<string, unknown>
                | null
                | undefined;
              if (!rawStore) return null;
              return mapStoreRecord(rawStore);
            })
            .filter((s): s is StoreSummary => s !== null);
        }
      } catch {
        // Mantém lista vazia caso relação ainda não exista
      }
    }
  }

  return (
    <MinhaContaClient
      isAuthenticated={isAuthenticated}
      isSupabaseReady={supabaseReady}
      profile={profile}
      initialSavedProducts={savedProducts}
      initialFollowedStores={followedStores}
      neighborhoods={neighborhoods}
      initialTab={initialTab}
      emailPendingConfirmation={emailPendingConfirmation}
      ownStore={ownStore}
    />
  );
}

