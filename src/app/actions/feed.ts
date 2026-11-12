"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  DEFAULT_LAPA_BUSINESS_HOURS,
  FALLBACK_GLOBAL_CATEGORIES,
  FALLBACK_NEIGHBORHOODS,
} from "@/lib/panel-data";
import { getStoreOpenStatus } from "@/lib/store-hours";
import { sanitizeStoreSlug } from "@/lib/utils";
import type {
  GlobalCategory,
  NeighborhoodItem,
  PaymentMethod,
  ProductCondition,
  ProductGender,
  ProductItem,
  ProductVoltage,
  StoreSummary,
  StoreWithStories,
} from "@/types/marketplace";

/**
 * Lojas de demonstração ricas em Bom Jesus da Lapa para fallback quando o Supabase
 * ainda não possui dados populados.
 */
const CATALOG_STORES: StoreSummary[] = [
  {
    id: "store-1",
    name: "Bella Moda Lapa",
    slug: "bella-moda-lapa",
    avatar_url:
      "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=250&q=80",
    banner_url:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80",
    description:
      "Moda feminina, alfaiataria e vestidos leves no coração de Bom Jesus da Lapa. Enviamos motoboy para todos os bairros!",
    neighborhood: "Centro",
    neighborhood_id: "centro",
    neighborhood_slug: "centro",
    address: "Av. Manoel Novaes, 120 - Centro (Ao lado da Caixa)",
    instagram: "@bellamodalapa",
    whatsapp: "5577999112233",
    is_verified: true,
    plan: "premium",
    business_hours: DEFAULT_LAPA_BUSINESS_HOURS,
    special_hours: [
      {
        id: "sp-1",
        date: "2026-08-06",
        label: "Romaria do Bom Jesus (Horário Estendido)",
        isClosed: false,
        openTime: "07:00",
        closeTime: "21:00",
      },
    ],
    payment_methods: ["pix", "credit_card", "debit_card", "cash", "crediario"],
    installment_info: "Até 3x sem juros no cartão ou 10% OFF no Pix",
    has_delivery: true,
    has_pickup: true,
    delivery_fee_type: "free",
    delivery_fee: 0,
    followers_count: 148,
  },
  {
    id: "store-2",
    name: "Império dos Calçados",
    slug: "imperio-dos-calcados",
    avatar_url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=250&q=80",
    banner_url:
      "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1400&q=80",
    description:
      "Tênis esportivos, sandálias, rasteiras e calçados para toda a família em Bom Jesus da Lapa.",
    neighborhood: "São Gotardo",
    neighborhood_id: "sao-gotardo",
    neighborhood_slug: "sao-gotardo",
    address: "Av. Santa Catarina, 410 - São Gotardo",
    instagram: "@imperiodoscalcadoslapa",
    whatsapp: "5577999445566",
    is_verified: true,
    plan: "premium",
    business_hours: DEFAULT_LAPA_BUSINESS_HOURS,
    special_hours: [],
    payment_methods: ["pix", "credit_card", "debit_card", "cash"],
    installment_info: "Em até 4x sem juros no cartão",
    has_delivery: true,
    has_pickup: true,
    delivery_fee_type: "combine",
    delivery_fee: 0,
    followers_count: 92,
  },
  {
    id: "store-3",
    name: "Lapa Tech & Celulares",
    slug: "lapa-tech-celulares",
    avatar_url:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=250&q=80",
    banner_url:
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1400&q=80",
    description:
      "Smartphones, fones Bluetooth, caixas de som JBL e assistência especializada com garantia local.",
    neighborhood: "Centro",
    neighborhood_id: "centro",
    neighborhood_slug: "centro",
    address: "Rua Floriano Peixoto, 85 - Centro",
    instagram: "@lapatechcelulares",
    whatsapp: "5577999778899",
    is_verified: true,
    plan: "premium",
    business_hours: DEFAULT_LAPA_BUSINESS_HOURS,
    special_hours: [],
    payment_methods: ["pix", "credit_card", "debit_card", "payment_link"],
    installment_info: "Até 12x no cartão com acréscimo da maquininha",
    has_delivery: true,
    has_pickup: true,
    delivery_fee_type: "fixed",
    delivery_fee: 5,
    followers_count: 64,
  },
  {
    id: "store-4",
    name: "Casa & Conforto Lapa",
    slug: "casa-conforto-lapa",
    avatar_url:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=250&q=80",
    banner_url:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80",
    description:
      "Ventiladores, eletroportáteis, jogos de cama e utilidades domésticas com entrega rápida.",
    neighborhood: "Parque Verde",
    neighborhood_id: "parque-verde",
    neighborhood_slug: "parque-verde",
    address: "Rua das Palmeiras, 50 - Parque Verde",
    instagram: "@casaconfortolapa",
    whatsapp: "5577999001122",
    is_verified: true,
    plan: "free",
    business_hours: DEFAULT_LAPA_BUSINESS_HOURS,
    special_hours: [],
    payment_methods: ["pix", "credit_card", "cash", "crediario"],
    installment_info: "Crediário próprio da loja em até 5x",
    has_delivery: true,
    has_pickup: true,
    delivery_fee_type: "free",
    delivery_fee: 0,
    followers_count: 37,
  },
];

const CATALOG_PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    title: "Conjunto Alfaiataria Linho Off-White",
    slug: "conjunto-alfaiataria-linho",
    description:
      "Tecido leve e fresco perfeito para o clima de Bom Jesus da Lapa. Disponível para prova na loja ou entrega via motoboy.",
    price: 199.9,
    promotional_price: 159.9,
    image_url:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
    ],
    sizes: ["P", "M", "G", "GG"],
    gender: "Feminino",
    voltage: null,
    condition: "new",
    category_id: "cat-moda",
    category_slug: "moda",
    subcategory_id: "sub-vestidos",
    subcategory_slug: "vestidos-conjuntos",
    is_active: true,
    views_count: 428,
    clicks_whatsapp: 39,
    created_at: "2026-11-11T11:00:00Z",
    store: CATALOG_STORES[0],
  },
  {
    id: "prod-2",
    title: "Tênis Esportivo Ultra Comfort Vermelho",
    slug: "tenis-esportivo-ultra-comfort",
    description:
      "Solado macio em EVA de alta absorção. Ideal para caminhada na Avenida Manoel Novaes e academia.",
    price: 289.9,
    promotional_price: 229.9,
    image_url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80",
    ],
    sizes: ["38", "39", "40", "41", "42"],
    gender: "Unissex",
    voltage: null,
    condition: "new",
    category_id: "cat-calcados",
    category_slug: "calcados",
    subcategory_id: "sub-tenis",
    subcategory_slug: "tenis-esportivos",
    is_active: true,
    views_count: 356,
    clicks_whatsapp: 31,
    created_at: "2026-11-11T10:30:00Z",
    store: CATALOG_STORES[1],
  },
  {
    id: "prod-3",
    title: "Fone Bluetooth Noise Cancelling Pro",
    slug: "fone-bluetooth-noise-cancelling",
    description:
      "Bateria de até 30 horas, carregamento rápido USB-C e garantia direto na loja física no Centro.",
    price: 249.0,
    promotional_price: 189.0,
    image_url:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [],
    sizes: [],
    gender: null,
    voltage: "Bivolt",
    condition: "new",
    category_id: "cat-eletronicos",
    category_slug: "eletronicos",
    subcategory_id: "sub-audio",
    subcategory_slug: "fones-audio",
    is_active: true,
    views_count: 290,
    clicks_whatsapp: 24,
    created_at: "2026-11-11T09:45:00Z",
    store: CATALOG_STORES[2],
  },
  {
    id: "prod-4",
    title: "Ventilador Turbo Silencioso 40cm 6 Pás",
    slug: "ventilador-turbo-silencioso-40cm",
    description:
      "Super vento e silencioso, ideal para o calor de Bom Jesus da Lapa. Pronta-entrega hoje mesmo.",
    price: 219.9,
    promotional_price: 179.9,
    image_url:
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [],
    sizes: [],
    gender: null,
    voltage: "220V",
    condition: "new",
    category_id: "cat-casa",
    category_slug: "casa-eletro",
    subcategory_id: "sub-eletrodomesticos",
    subcategory_slug: "eletrodomesticos",
    is_active: true,
    views_count: 410,
    clicks_whatsapp: 46,
    created_at: "2026-11-11T09:00:00Z",
    store: CATALOG_STORES[3],
  },
  {
    id: "prod-5",
    title: "Vestido Midi Floral Sol de Verão",
    slug: "vestido-midi-floral-sol",
    description:
      "Vestido fluido em viscose premium com alças reguláveis e forro duplo.",
    price: 159.9,
    promotional_price: 119.9,
    image_url:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [],
    sizes: ["P", "M", "G"],
    gender: "Feminino",
    voltage: null,
    condition: "new",
    category_id: "cat-moda",
    category_slug: "moda",
    subcategory_id: "sub-vestidos",
    subcategory_slug: "vestidos-conjuntos",
    is_active: true,
    views_count: 312,
    clicks_whatsapp: 27,
    created_at: "2026-11-10T18:00:00Z",
    store: CATALOG_STORES[0],
  },
  {
    id: "prod-6",
    title: "Sandália Rasteira Couro Dourada",
    slug: "sandalia-rasteira-couro-dourada",
    description:
      "Palmilha acolchoada super confortável com tiras metalizadas elegantes.",
    price: 119.9,
    promotional_price: 89.9,
    image_url:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [],
    sizes: ["34", "35", "36", "37", "38", "39"],
    gender: "Feminino",
    voltage: null,
    condition: "new",
    category_id: "cat-calcados",
    category_slug: "calcados",
    subcategory_id: "sub-sandalias",
    subcategory_slug: "sandalias-rasteiras",
    is_active: true,
    views_count: 204,
    clicks_whatsapp: 19,
    created_at: "2026-11-10T15:20:00Z",
    store: CATALOG_STORES[1],
  },
  {
    id: "prod-7",
    title: "Smartwatch Ultra Series 9 + Pulseira Extra",
    slug: "smartwatch-ultra-series-9",
    description:
      "Notificações de WhatsApp, monitoramento esportivo e tela AMOLED de alta definição.",
    price: 249.0,
    promotional_price: 199.0,
    image_url:
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [],
    sizes: ["Único"],
    gender: "Unissex",
    voltage: "Bivolt",
    condition: "new",
    category_id: "cat-eletronicos",
    category_slug: "eletronicos",
    subcategory_id: "sub-smartphones",
    subcategory_slug: "smartphones-capinhas",
    is_active: true,
    views_count: 275,
    clicks_whatsapp: 22,
    created_at: "2026-11-10T12:10:00Z",
    store: CATALOG_STORES[2],
  },
  {
    id: "prod-8",
    title: "Bolsa Tiracolo Couro Legítimo Caramelo",
    slug: "bolsa-tiracolo-couro-caramelo",
    description:
      "Acabamento artesanal com alça regulável e metais dourados inoxidáveis.",
    price: 179.9,
    promotional_price: null,
    image_url:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [],
    sizes: ["Único"],
    gender: "Feminino",
    voltage: null,
    condition: "new",
    category_id: "cat-acessorios",
    category_slug: "acessorios",
    subcategory_id: "sub-bolsas",
    subcategory_slug: "bolsas-carteiras",
    is_active: true,
    views_count: 195,
    clicks_whatsapp: 14,
    created_at: "2026-11-09T14:00:00Z",
    store: CATALOG_STORES[0],
  },
];

const CATALOG_STORIES: StoreWithStories[] = [
  {
    store: CATALOG_STORES[0],
    hasUnseen: true,
    stories: [
      {
        id: "st-1",
        store_id: "store-1",
        media_url:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
        caption: "Coleção nova de verão acabou de chegar na loja do Centro! ✨",
        product_title: "Conjunto Alfaiataria Linho Off-White",
        product_price: 159.9,
        cta_url: "/bella-moda-lapa/conjunto-alfaiataria-linho",
        created_at: new Date().toISOString(),
      },
      {
        id: "st-2",
        store_id: "store-1",
        media_url:
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
        caption: "Vestidos leves com desconto especial hoje no Pix!",
        product_title: "Vestido Midi Floral Sol de Verão",
        product_price: 119.9,
        cta_url: "/bella-moda-lapa/vestido-midi-floral-sol",
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    store: CATALOG_STORES[1],
    hasUnseen: true,
    stories: [
      {
        id: "st-3",
        store_id: "store-2",
        media_url:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
        caption:
          "Reposição de numeração do 38 ao 42! Entrega rápida em São Gotardo e Centro.",
        product_title: "Tênis Esportivo Ultra Comfort Vermelho",
        product_price: 229.9,
        cta_url: "/imperio-dos-calcados/tenis-esportivo-ultra-comfort",
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    store: CATALOG_STORES[2],
    hasUnseen: true,
    stories: [
      {
        id: "st-4",
        store_id: "store-3",
        media_url:
          "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=900&q=80",
        caption: "Fones Bluetooth e Smartwatches em oferta relâmpago!",
        product_title: "Smartwatch Ultra Series 9 + Pulseira Extra",
        product_price: 199.0,
        cta_url: "/lapa-tech-celulares/smartwatch-ultra-series-9",
        created_at: new Date().toISOString(),
      },
    ],
  },
];

/**
 * Intercala produtos de lojas diferentes (Round-Robin ponderado por Premium + Recência)
 * para garantir que uma única loja nunca domine 10 posts seguidos no feed.
 */
function interleaveProductsByStore(products: ProductItem[]): ProductItem[] {
  if (products.length <= 2) return products;

  // Ordena primeiro priorizando lojas Premium e lançamentos mais recentes
  const sorted = [...products].sort((a, b) => {
    const aPremium = a.store.plan === "premium" ? 1 : 0;
    const bPremium = b.store.plan === "premium" ? 1 : 0;
    if (aPremium !== bPremium) return bPremium - aPremium;

    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });

  // Agrupa por loja preservando a ordem interna
  const buckets = new Map<string, ProductItem[]>();
  for (const prod of sorted) {
    const sId = prod.store.id;
    const list = buckets.get(sId) ?? [];
    list.push(prod);
    buckets.set(sId, list);
  }

  const interleaved: ProductItem[] = [];
  const storeQueues = Array.from(buckets.values());
  let remaining = sorted.length;

  while (remaining > 0) {
    for (const queue of storeQueues) {
      if (queue.length > 0) {
        const nextItem = queue.shift()!;
        interleaved.push(nextItem);
        remaining--;
      }
    }
  }

  return interleaved;
}

/**
 * Carrega o catálogo completo de lojas, produtos ativos, categorias e bairros
 * do Supabase (ou retorna o catálogo de demonstração quando não configurado/vazio).
 */
async function loadCatalogSnapshot(): Promise<{
  stores: StoreSummary[];
  products: ProductItem[];
  categories: GlobalCategory[];
  neighborhoods: NeighborhoodItem[];
  stories: StoreWithStories[];
  userId: string | null;
  followedStoreIds: string[];
  savedProductIds: string[];
}> {
  if (!isSupabaseConfigured()) {
    return {
      stores: CATALOG_STORES,
      products: CATALOG_PRODUCTS,
      categories: FALLBACK_GLOBAL_CATEGORIES,
      neighborhoods: FALLBACK_NEIGHBORHOODS,
      stories: CATALOG_STORIES,
      userId: null,
      followedStoreIds: ["store-1", "store-2"],
      savedProductIds: [],
    };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

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
        slug: nb.slug ? String(nb.slug) : sanitizeStoreSlug(String(nb.name)),
        is_active: nb.is_active !== false,
      }));
    }

    let categories = FALLBACK_GLOBAL_CATEGORIES;
    const { data: dbCategories } = await supabase
      .from("global_categories")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (dbCategories && dbCategories.length > 0) {
      categories = dbCategories.map((c: Record<string, unknown>, idx: number) => ({
        id: String(c.id),
        name: String(c.name || "Categoria"),
        slug: String(c.slug || c.id),
        parent_id: c.parent_id ? String(c.parent_id) : null,
        order_index:
          typeof c.order_index === "number" ? c.order_index : idx + 1,
        is_active: c.is_active !== false,
        filter_config:
          (c.filter_config as GlobalCategory["filter_config"]) || {},
      }));
    }

    // Lojas
    let stores = CATALOG_STORES;
    const { data: dbStores } = await supabase.from("stores").select("*");
    if (dbStores && dbStores.length > 0) {
      stores = dbStores.map((raw: Record<string, unknown>) => {
        const nbId = String(raw.neighborhood_id || "centro");
        const matchedNb = neighborhoods.find(
          (n) => n.id === nbId || n.slug === nbId
        );
        const rawPlan = String(raw.plan_tier || raw.plan || "free");

        return {
          id: String(raw.id),
          name: String(raw.name || "Loja Parceira"),
          slug: String(raw.slug || raw.id),
          avatar_url:
            (raw.avatar_url as string | null) ??
            (raw.logo_url as string | null) ??
            null,
          banner_url: (raw.banner_url as string | null) ?? null,
          description:
            (raw.description as string | null) ??
            (raw.bio as string | null) ??
            null,
          neighborhood: matchedNb?.name || "Centro",
          neighborhood_id: nbId,
          neighborhood_slug:
            matchedNb?.slug || sanitizeStoreSlug(matchedNb?.name || "centro"),
          address: String(raw.address || "Bom Jesus da Lapa - BA"),
          instagram: (raw.instagram as string | null) ?? null,
          whatsapp: String(raw.whatsapp || ""),
          is_verified: Boolean(raw.is_verified),
          plan: rawPlan === "premium" ? "premium" : "free",
          business_hours:
            (raw.business_hours as StoreSummary["business_hours"]) ||
            DEFAULT_LAPA_BUSINESS_HOURS,
          special_hours: Array.isArray(raw.special_hours)
            ? (raw.special_hours as StoreSummary["special_hours"])
            : [],
          payment_methods: Array.isArray(raw.accepted_payments)
            ? (raw.accepted_payments as PaymentMethod[])
            : Array.isArray(raw.payment_methods)
            ? (raw.payment_methods as PaymentMethod[])
            : ["pix", "credit_card", "cash"],
          installment_info: (raw.installment_info as string | null) ?? null,
          has_delivery: raw.has_delivery !== false,
          has_pickup: raw.has_pickup !== false,
          delivery_fee_type:
            (raw.delivery_fee_type as StoreSummary["delivery_fee_type"]) ||
            "combine",
          delivery_fee:
            raw.delivery_fee != null ? Number(raw.delivery_fee) : 0,
          followers_count: Number(raw.followers_count || 0),
        };
      });
    }

    // Produtos ativos
    let products = CATALOG_PRODUCTS;
    const { data: dbProducts } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (dbProducts && dbProducts.length > 0) {
      const storeMap = new Map(stores.map((s) => [s.id, s]));
      const catMap = new Map(categories.map((c) => [c.id, c]));

      products = dbProducts
        .map((p: Record<string, unknown>) => {
          const store =
            storeMap.get(String(p.store_id)) || CATALOG_STORES[0];
          const mainCat = catMap.get(String(p.category_id));
          const subCat = p.subcategory_id
            ? catMap.get(String(p.subcategory_id))
            : undefined;

          return {
            id: String(p.id),
            title: String(p.title || p.name || "Produto"),
            slug: String(
              p.slug || sanitizeStoreSlug(String(p.title || p.id))
            ),
            description: (p.description as string | null) ?? null,
            price: Number(p.price || 0),
            promotional_price:
              p.promotional_price != null ? Number(p.promotional_price) : null,
            image_url: String(
              p.image_url ||
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
            ),
            gallery_urls: Array.isArray(p.gallery_urls)
              ? (p.gallery_urls as string[])
              : [],
            sizes: Array.isArray(p.sizes)
              ? (p.sizes as string[])
              : Array.isArray(p.available_sizes)
              ? (p.available_sizes as string[])
              : [],
            gender: (p.gender as ProductGender | null) ?? null,
            voltage: (p.voltage as ProductVoltage | null) ?? null,
            condition: (p.condition as ProductCondition) || "new",
            category_id: String(p.category_id || "cat-moda"),
            category_slug: mainCat?.slug || String(p.category_slug || "moda"),
            subcategory_id: p.subcategory_id ? String(p.subcategory_id) : null,
            subcategory_slug: subCat?.slug || null,
            is_active: p.is_active !== false,
            views_count: Number(p.views_count || 0),
            clicks_whatsapp: Number(p.clicks_whatsapp || 0),
            created_at: p.created_at
              ? String(p.created_at)
              : new Date().toISOString(),
            store,
          };
        })
        .filter((p) => p.is_active !== false);
    }

    // Lojas seguidas e favoritos do usuário logado
    let followedStoreIds: string[] = [];
    let savedProductIds: string[] = [];

    if (user) {
      const [{ data: followedRows }, { data: savedRows }] = await Promise.all([
        supabase
          .from("followed_stores")
          .select("store_id")
          .eq("user_id", user.id),
        supabase
          .from("saved_products")
          .select("product_id")
          .eq("user_id", user.id),
      ]);

      if (followedRows) {
        followedStoreIds = followedRows.map((r: Record<string, unknown>) =>
          String(r.store_id)
        );
      }
      if (savedRows) {
        savedProductIds = savedRows.map((r: Record<string, unknown>) =>
          String(r.product_id)
        );
      }
    }

    // Stories ativos nas últimas 24h de lojas Premium
    let stories = CATALOG_STORIES;
    const nowIso = new Date().toISOString();
    const { data: dbStories } = await supabase
      .from("store_stories")
      .select("*")
      .gte("expires_at", nowIso)
      .order("created_at", { ascending: false });

    if (dbStories && dbStories.length > 0) {
      const storeMap = new Map(stores.map((s) => [s.id, s]));
      const prodMap = new Map(products.map((p) => [p.id, p]));
      const grouped = new Map<string, StoreWithStories>();

      for (const st of dbStories as Array<Record<string, unknown>>) {
        const sId = String(st.store_id);
        const store = storeMap.get(sId);
        if (!store || store.plan !== "premium") continue;

        const linkedProd = st.product_id
          ? prodMap.get(String(st.product_id))
          : undefined;

        const group = grouped.get(sId) ?? {
          store,
          hasUnseen: true,
          stories: [],
        };

        group.stories.push({
          id: String(st.id),
          store_id: sId,
          media_url: String(st.media_url || st.image_url || ""),
          caption: (st.caption as string | null) ?? null,
          product_id: st.product_id ? String(st.product_id) : null,
          product_title: linkedProd?.title ?? null,
          product_price:
            linkedProd?.promotional_price ?? linkedProd?.price ?? null,
          cta_url: linkedProd
            ? `/${store.slug}/${linkedProd.slug || linkedProd.id}`
            : `/${store.slug}`,
          created_at: String(st.created_at || nowIso),
        });

        grouped.set(sId, group);
      }

      if (grouped.size > 0) {
        stories = Array.from(grouped.values());
      }
    }

    return {
      stores,
      products,
      categories,
      neighborhoods,
      stories,
      userId: user?.id ?? null,
      followedStoreIds,
      savedProductIds,
    };
  } catch {
    return {
      stores: CATALOG_STORES,
      products: CATALOG_PRODUCTS,
      categories: FALLBACK_GLOBAL_CATEGORIES,
      neighborhoods: FALLBACK_NEIGHBORHOODS,
      stories: CATALOG_STORIES,
      userId: null,
      followedStoreIds: ["store-1", "store-2"],
      savedProductIds: [],
    };
  }
}

export interface GetMarketplaceFeedInput {
  page?: number;
  pageSize?: number;
  tab?: "explorar" | "seguindo";
  userId?: string | null;
  categorySlug?: string | null;
  neighborhoodSlug?: string | null;
  onlyOpenNow?: boolean;
  onlyPromo?: boolean;
}

export interface GetMarketplaceFeedOutput {
  items: ProductItem[];
  page: number;
  nextPage: number | null;
  hasMore: boolean;
  total: number;
}

/**
 * 1. Algoritmo de Busca do Feed e Paginação (`getMarketplaceFeed`):
 * - Filtra apenas produtos com `is_active = true` trazendo dados da loja e bairro.
 * - Na aba `seguindo`: filtra apenas produtos de lojas presentes em `followed_stores` para o `userId` logado.
 * - Na aba `explorar`: prioriza produtos de lojas `plan_tier = 'premium'` e lançamentos recentes,
 *   intercalando lojas diferentes para que uma única loja não domine 10 posts seguidos no feed.
 */
export async function getMarketplaceFeed(
  input: GetMarketplaceFeedInput = {}
): Promise<GetMarketplaceFeedOutput> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.max(1, input.pageSize ?? 6);
  const tab = input.tab ?? "explorar";

  const snapshot = await loadCatalogSnapshot();
  let list = snapshot.products.filter((p) => p.is_active !== false);

  // Filtro por Categoria
  if (input.categorySlug && input.categorySlug !== "all") {
    const catSlugLower = input.categorySlug.toLowerCase();
    list = list.filter(
      (p) =>
        p.category_slug?.toLowerCase() === catSlugLower ||
        p.category_id?.toLowerCase() === catSlugLower ||
        p.subcategory_slug?.toLowerCase() === catSlugLower
    );
  }

  // Filtro por Bairro de Bom Jesus da Lapa
  if (
    input.neighborhoodSlug &&
    input.neighborhoodSlug !== "all" &&
    input.neighborhoodSlug !== "Toda Bom Jesus da Lapa"
  ) {
    const nbClean = sanitizeStoreSlug(input.neighborhoodSlug);
    list = list.filter(
      (p) =>
        sanitizeStoreSlug(p.store.neighborhood) === nbClean ||
        p.store.neighborhood_slug === nbClean ||
        p.store.neighborhood_id === nbClean
    );
  }

  // Filtro por Promoções (produtos com promotional_price menor que o preço original)
  if (input.onlyPromo) {
    list = list.filter(
      (p) =>
        p.promotional_price != null &&
        p.promotional_price > 0 &&
        p.promotional_price < p.price
    );
  }

  // Filtro por Lojas Abertas Agora
  if (input.onlyOpenNow) {
    list = list.filter((p) => {
      const status = getStoreOpenStatus({
        businessHours: p.store.business_hours,
        specialHours: p.store.special_hours,
        isOpenOverride: p.store.is_open_override,
      });
      return status.isOpen;
    });
  }

  // Filtro da aba 'seguindo' vs intercalação da aba 'explorar'
  if (tab === "seguindo") {
    const followedSet = new Set(snapshot.followedStoreIds);
    list = list.filter((p) => followedSet.has(p.store.id));
    list.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  } else {
    list = interleaveProductsByStore(list);
  }

  const total = list.length;
  const start = (page - 1) * pageSize;
  const items = list.slice(start, start + pageSize);
  const hasMore = start + pageSize < total;

  return {
    items,
    page,
    nextPage: hasMore ? page + 1 : null,
    hasMore,
    total,
  };
}

/**
 * Carrega todos os blocos da Home Híbrida (Mobile Feed Social + Desktop Catálogo)
 */
export async function getMarketplaceHomeData() {
  const snapshot = await loadCatalogSnapshot();
  const interleaved = interleaveProductsByStore(snapshot.products);

  // Ofertas do Dia em Lapa (produtos com promotional_price ativo)
  const dailyOffers = interleaved.filter(
    (p) => p.promotional_price != null && p.promotional_price < p.price
  );

  // Lojas em Destaque (priorizando verificadas e premium)
  const featuredStores = [...snapshot.stores].sort((a, b) => {
    const aPrem = a.plan === "premium" ? 1 : 0;
    const bPrem = b.plan === "premium" ? 1 : 0;
    if (aPrem !== bPrem) return bPrem - aPrem;
    return (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0);
  });

  return {
    stories: snapshot.stories,
    categories: snapshot.categories,
    neighborhoods: snapshot.neighborhoods,
    dailyOffers,
    featuredStores,
    recentProducts: interleaved,
    initialFeed: interleaved.slice(0, 6),
    hasMoreFeed: interleaved.length > 6,
    userId: snapshot.userId,
    followedStoreIds: snapshot.followedStoreIds,
    savedProductIds: snapshot.savedProductIds,
  };
}

export interface ExploreFiltersInput {
  q?: string;
  categoria?: string;
  subcategoria?: string;
  bairro?: string;
  tamanho?: string;
  genero?: string;
  voltagem?: string;
  condicao?: string;
  pagamento?: string;
  precoMax?: number | null;
  abertas?: boolean;
  promocao?: boolean;
}

/**
 * Busca avançada da página `/explorar` com filtros profundos de categoria,
 * bairro, lojas abertas agora (`getStoreOpenStatus` em memória), promoção,
 * filtros dinâmicos (`tamanho`, `genero`, `voltagem`, `condicao`) e pagamento.
 */
export async function searchMarketplaceProducts(
  filters: ExploreFiltersInput = {}
) {
  const snapshot = await loadCatalogSnapshot();
  let results = interleaveProductsByStore(snapshot.products);

  // 1. Busca textual (q)
  if (filters.q && filters.q.trim()) {
    const qLower = filters.q.trim().toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(qLower) ||
        (p.description && p.description.toLowerCase().includes(qLower)) ||
        p.store.name.toLowerCase().includes(qLower) ||
        p.store.neighborhood.toLowerCase().includes(qLower)
    );
  }

  // 2. Categoria Principal
  if (filters.categoria && filters.categoria !== "all") {
    const catLower = filters.categoria.toLowerCase();
    results = results.filter(
      (p) =>
        p.category_slug?.toLowerCase() === catLower ||
        p.category_id?.toLowerCase() === catLower
    );
  }

  // 3. Subcategoria
  if (filters.subcategoria && filters.subcategoria !== "all") {
    const subLower = filters.subcategoria.toLowerCase();
    results = results.filter(
      (p) =>
        p.subcategory_slug?.toLowerCase() === subLower ||
        p.subcategory_id?.toLowerCase() === subLower
    );
  }

  // 4. Bairro da Loja em Lapa
  if (
    filters.bairro &&
    filters.bairro !== "all" &&
    filters.bairro !== "Toda Bom Jesus da Lapa"
  ) {
    const nbSlug = sanitizeStoreSlug(filters.bairro);
    results = results.filter(
      (p) =>
        sanitizeStoreSlug(p.store.neighborhood) === nbSlug ||
        p.store.neighborhood_slug === nbSlug ||
        p.store.neighborhood_id === nbSlug
    );
  }

  // 5. Apenas Lojas Abertas Agora (usando getStoreOpenStatus em memória)
  if (filters.abertas) {
    results = results.filter((p) => {
      const status = getStoreOpenStatus({
        businessHours: p.store.business_hours,
        specialHours: p.store.special_hours,
        isOpenOverride: p.store.is_open_override,
      });
      return status.isOpen;
    });
  }

  // 6. Apenas Produtos em Promoção
  if (filters.promocao) {
    results = results.filter(
      (p) => p.promotional_price != null && p.promotional_price < p.price
    );
  }

  // 7. Tamanho / Numeração
  if (filters.tamanho && filters.tamanho !== "all") {
    const targetSize = filters.tamanho.trim().toLowerCase();
    results = results.filter((p) =>
      (p.sizes || []).some((s) => s.toLowerCase() === targetSize)
    );
  }

  // 8. Gênero
  if (filters.genero && filters.genero !== "all") {
    const targetGender = filters.genero.trim().toLowerCase();
    results = results.filter(
      (p) => (p.gender || "").toLowerCase() === targetGender
    );
  }

  // 9. Voltagem
  if (filters.voltagem && filters.voltagem !== "all") {
    const targetVoltage = filters.voltagem.trim().toLowerCase();
    results = results.filter(
      (p) => (p.voltage || "").toLowerCase() === targetVoltage
    );
  }

  // 10. Condição (Novo / Seminovo)
  if (filters.condicao && filters.condicao !== "all") {
    results = results.filter((p) => p.condition === filters.condicao);
  }

  // 11. Forma de Pagamento Aceita pela Loja
  if (filters.pagamento && filters.pagamento !== "all") {
    const method = filters.pagamento as PaymentMethod;
    results = results.filter((p) =>
      (p.store.payment_methods || []).includes(method)
    );
  }

  // 12. Preço Máximo
  if (
    filters.precoMax != null &&
    !Number.isNaN(filters.precoMax) &&
    filters.precoMax > 0
  ) {
    const maxPrice = Number(filters.precoMax);
    results = results.filter((p) => {
      const effective =
        p.promotional_price != null && p.promotional_price < p.price
          ? p.promotional_price
          : p.price;
      return effective <= maxPrice;
    });
  }

  return {
    products: results,
    categories: snapshot.categories,
    neighborhoods: snapshot.neighborhoods,
    savedProductIds: snapshot.savedProductIds,
  };
}

/**
 * Busca os dados completos da Vitrine Individual do Lojista (`/[storeSlug]`).
 */
export async function getStoreFrontBySlug(storeSlug: string) {
  const snapshot = await loadCatalogSnapshot();
  const cleanSlug = sanitizeStoreSlug(storeSlug);

  const store = snapshot.stores.find(
    (s) => sanitizeStoreSlug(s.slug) === cleanSlug || s.id === storeSlug
  );

  if (!store) {
    return null;
  }

  const storeProducts = snapshot.products.filter(
    (p) => p.store.id === store.id && p.is_active !== false
  );

  // Categorias presentes nos produtos da loja
  const categoryMap = new Map<string, { slug: string; name: string; count: number }>();
  for (const prod of storeProducts) {
    const catSlug = prod.category_slug || "outros";
    const matchedGlobal = snapshot.categories.find(
      (c) => c.slug === catSlug || c.id === prod.category_id
    );
    const label = matchedGlobal?.name || "Destaques";
    const existing = categoryMap.get(catSlug);
    if (existing) {
      existing.count += 1;
    } else {
      categoryMap.set(catSlug, { slug: catSlug, name: label, count: 1 });
    }
  }

  const isFollowing = snapshot.followedStoreIds.includes(store.id);

  return {
    store,
    products: storeProducts,
    storeCategories: Array.from(categoryMap.values()),
    isFollowing,
    savedProductIds: snapshot.savedProductIds,
  };
}

/**
 * Busca os dados de Detalhe do Produto (`/[storeSlug]/[productSlug]`).
 */
export async function getProductDetailBySlugs(
  storeSlug: string,
  productSlug: string
) {
  const snapshot = await loadCatalogSnapshot();
  const cleanStoreSlug = sanitizeStoreSlug(storeSlug);
  const cleanProductSlug = sanitizeStoreSlug(productSlug);

  const product =
    snapshot.products.find(
      (p) =>
        (sanitizeStoreSlug(p.store.slug) === cleanStoreSlug ||
          p.store.id === storeSlug) &&
        (sanitizeStoreSlug(p.slug || "") === cleanProductSlug ||
          p.id === productSlug)
    ) ||
    snapshot.products.find(
      (p) =>
        sanitizeStoreSlug(p.slug || "") === cleanProductSlug ||
        p.id === productSlug
    );

  if (!product) {
    return null;
  }

  const relatedProducts = snapshot.products
    .filter((p) => p.store.id === product.store.id && p.id !== product.id)
    .slice(0, 4);

  const isSaved = snapshot.savedProductIds.includes(product.id);

  return {
    product,
    store: product.store,
    relatedProducts,
    isSaved,
  };
}

/**
 * Incrementa silenciosamente `views_count` ao abrir a página do produto.
 */
export async function incrementProductViewAction(productId: string) {
  if (!productId || !isSupabaseConfigured()) return;

  try {
    const supabase = await createClient();
    const { data: row } = await supabase
      .from("products")
      .select("views_count")
      .eq("id", productId)
      .maybeSingle();

    if (row) {
      const nextViews = Number(row.views_count || 0) + 1;
      await supabase
        .from("products")
        .update({ views_count: nextViews })
        .eq("id", productId);
    }
  } catch {
    // Falha silenciosa para não bloquear renderização
  }
}

/**
 * Incrementa silenciosamente `clicks_whatsapp` quando o cliente clica em "Comprar Agora" / "Pedir no Zap".
 */
export async function incrementProductWhatsappClickAction(productId: string) {
  if (!productId || !isSupabaseConfigured()) return;

  try {
    const supabase = await createClient();
    const { data: row } = await supabase
      .from("products")
      .select("clicks_whatsapp")
      .eq("id", productId)
      .maybeSingle();

    if (row) {
      const nextClicks = Number(row.clicks_whatsapp || 0) + 1;
      await supabase
        .from("products")
        .update({ clicks_whatsapp: nextClicks })
        .eq("id", productId);
    }
  } catch {
    // Falha silenciosa
  }
}

