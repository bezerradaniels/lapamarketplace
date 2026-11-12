import { createClient } from "@/lib/supabase/server";
import { requireAdminPage, requireUserPage } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  DaySchedule,
  GlobalCategory,
  MasterCohortWeek,
  MasterDashboardData,
  MasterStoreLead,
  MasterUserItem,
  MerchantProduct,
  MerchantStoreConfig,
  NeighborhoodItem,
} from "@/types/marketplace";

export const DEFAULT_LAPA_BUSINESS_HOURS: Record<number, DaySchedule> = {
  1: {
    dayOfWeek: 1,
    dayLabel: "Segunda-feira",
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  },
  2: {
    dayOfWeek: 2,
    dayLabel: "Terça-feira",
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  },
  3: {
    dayOfWeek: 3,
    dayLabel: "Quarta-feira",
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  },
  4: {
    dayOfWeek: 4,
    dayLabel: "Quinta-feira",
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  },
  5: {
    dayOfWeek: 5,
    dayLabel: "Sexta-feira",
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  },
  6: {
    dayOfWeek: 6,
    dayLabel: "Sábado",
    isClosed: false,
    openTime: "08:00",
    closeTime: "13:00",
    lunchStart: null,
    lunchEnd: null,
  },
  0: {
    dayOfWeek: 0,
    dayLabel: "Domingo",
    isClosed: true,
    openTime: "08:00",
    closeTime: "12:00",
    lunchStart: null,
    lunchEnd: null,
  },
};

export const FALLBACK_GLOBAL_CATEGORIES: GlobalCategory[] = [
  // Categorias Principais
  {
    id: "cat-moda",
    name: "Moda & Roupas",
    slug: "moda",
    parent_id: null,
    order_index: 1,
    is_active: true,
    filter_config: {
      has_gender: true,
      has_size: true,
      size_options: ["PP", "P", "M", "G", "GG", "XG"],
      has_voltage: false,
    },
  },
  {
    id: "cat-calcados",
    name: "Calçados",
    slug: "calcados",
    parent_id: null,
    order_index: 2,
    is_active: true,
    filter_config: {
      has_gender: true,
      has_size: true,
      size_options: [
        "34",
        "35",
        "36",
        "37",
        "38",
        "39",
        "40",
        "41",
        "42",
        "43",
        "44",
      ],
      has_voltage: false,
    },
  },
  {
    id: "cat-eletronicos",
    name: "Celulares & Eletrônicos",
    slug: "eletronicos",
    parent_id: null,
    order_index: 3,
    is_active: true,
    filter_config: {
      has_gender: false,
      has_size: false,
      size_options: [],
      has_voltage: true,
    },
  },
  {
    id: "cat-casa",
    name: "Casa, Móveis & Eletro",
    slug: "casa-eletro",
    parent_id: null,
    order_index: 4,
    is_active: true,
    filter_config: {
      has_gender: false,
      has_size: false,
      size_options: [],
      has_voltage: true,
    },
  },
  {
    id: "cat-acessorios",
    name: "Bolsas, Relógios & Acessórios",
    slug: "acessorios",
    parent_id: null,
    order_index: 5,
    is_active: true,
    filter_config: {
      has_gender: true,
      has_size: true,
      size_options: ["Único", "P", "M", "G"],
      has_voltage: false,
    },
  },

  // Subcategorias de Moda & Roupas
  {
    id: "sub-vestidos",
    name: "Vestidos & Conjuntos",
    slug: "vestidos-conjuntos",
    parent_id: "cat-moda",
    order_index: 1,
    is_active: true,
    filter_config: {},
  },
  {
    id: "sub-camisas",
    name: "Camisas & Blusas",
    slug: "camisas-blusas",
    parent_id: "cat-moda",
    order_index: 2,
    is_active: true,
    filter_config: {},
  },
  {
    id: "sub-jeans",
    name: "Calças, Shorts & Jeans",
    slug: "calcas-jeans",
    parent_id: "cat-moda",
    order_index: 3,
    is_active: true,
    filter_config: {},
  },
  {
    id: "sub-fitness",
    name: "Moda Praia & Fitness",
    slug: "moda-praia-fitness",
    parent_id: "cat-moda",
    order_index: 4,
    is_active: true,
    filter_config: {},
  },

  // Subcategorias de Calçados
  {
    id: "sub-tenis",
    name: "Tênis & Esportivos",
    slug: "tenis-esportivos",
    parent_id: "cat-calcados",
    order_index: 1,
    is_active: true,
    filter_config: {},
  },
  {
    id: "sub-sandalias",
    name: "Sandálias & Rasteiras",
    slug: "sandalias-rasteiras",
    parent_id: "cat-calcados",
    order_index: 2,
    is_active: true,
    filter_config: {},
  },
  {
    id: "sub-sapatos",
    name: "Sapatos Sociais & Botas",
    slug: "sapatos-botas",
    parent_id: "cat-calcados",
    order_index: 3,
    is_active: true,
    filter_config: {},
  },

  // Subcategorias de Celulares & Eletrônicos
  {
    id: "sub-smartphones",
    name: "Smartphones & Capinhas",
    slug: "smartphones-capinhas",
    parent_id: "cat-eletronicos",
    order_index: 1,
    is_active: true,
    filter_config: {},
  },
  {
    id: "sub-audio",
    name: "Fones, Caixas de Som & Áudio",
    slug: "fones-audio",
    parent_id: "cat-eletronicos",
    order_index: 2,
    is_active: true,
    filter_config: {},
  },
  {
    id: "sub-eletroportateis",
    name: "Carregadores & Cabos",
    slug: "carregadores-cabos",
    parent_id: "cat-eletronicos",
    order_index: 3,
    is_active: true,
    filter_config: {},
  },

  // Subcategorias de Casa, Móveis & Eletro
  {
    id: "sub-eletrodomesticos",
    name: "Eletrodomésticos & Ventiladores",
    slug: "eletrodomesticos",
    parent_id: "cat-casa",
    order_index: 1,
    is_active: true,
    filter_config: {},
  },
  {
    id: "sub-cama-mesa",
    name: "Cama, Mesa & Banho",
    slug: "cama-mesa-banho",
    parent_id: "cat-casa",
    order_index: 2,
    is_active: true,
    filter_config: {},
  },

  // Subcategorias de Bolsas & Acessórios
  {
    id: "sub-bolsas",
    name: "Bolsas, Mochilas & Carteiras",
    slug: "bolsas-carteiras",
    parent_id: "cat-acessorios",
    order_index: 1,
    is_active: true,
    filter_config: {},
  },
  {
    id: "sub-relogios",
    name: "Relógios, Óculos & Semijoias",
    slug: "relogios-oculos",
    parent_id: "cat-acessorios",
    order_index: 2,
    is_active: true,
    filter_config: {},
  },
];

export const FALLBACK_NEIGHBORHOODS: NeighborhoodItem[] = [
  { id: "centro", name: "Centro", slug: "centro", is_active: true },
  { id: "sao-joao", name: "São João", slug: "sao-joao", is_active: true },
  {
    id: "parque-verde",
    name: "Parque Verde",
    slug: "parque-verde",
    is_active: true,
  },
  {
    id: "sao-gotardo",
    name: "São Gotardo",
    slug: "sao-gotardo",
    is_active: true,
  },
  { id: "beira-rio", name: "Beira Rio", slug: "beira-rio", is_active: true },
  { id: "maravilha", name: "Maravilha", slug: "maravilha", is_active: true },
  { id: "primavera", name: "Primavera", slug: "primavera", is_active: true },
  { id: "cavalhada", name: "Cavalhada", slug: "cavalhada", is_active: true },
  { id: "amaralina", name: "Amaralina", slug: "amaralina", is_active: true },
  { id: "shangri-la", name: "Shangri-lá", slug: "shangri-la", is_active: true },
  {
    id: "lagoa-grande",
    name: "Lagoa Grande",
    slug: "lagoa-grande",
    is_active: true,
  },
  {
    id: "nova-brasilia",
    name: "Nova Brasília",
    slug: "nova-brasilia",
    is_active: true,
  },
  {
    id: "joao-paulo-ii",
    name: "João Paulo II",
    slug: "joao-paulo-ii",
    is_active: true,
  },
];

export const DEMO_MERCHANT_STORE: MerchantStoreConfig = {
  id: "store-1",
  name: "Bella Moda Lapa",
  slug: "bella-moda-lapa",
  avatar_url:
    "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=250&q=80",
  banner_url:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
  description:
    "Moda feminina, alfaiataria e vestidos leves no coração de Bom Jesus da Lapa. Enviamos motoboy para todos os bairros!",
  whatsapp: "5577999112233",
  instagram: "@bellamodalapa",
  neighborhood_id: "centro",
  neighborhood_name: "Centro",
  address: "Av. Manoel Novaes, 120 - Centro (Ao lado da Caixa)",
  plan_tier: "premium",
  is_verified: true,
  accepted_payments: ["pix", "credit_card", "debit_card", "cash", "crediario"],
  installment_info: "Até 3x sem juros no cartão ou 10% OFF no Pix",
  has_delivery: true,
  has_pickup: true,
  delivery_fee_type: "free",
  delivery_fee: 0,
  business_hours: DEFAULT_LAPA_BUSINESS_HOURS,
  special_hours: [
    {
      id: "sp-1",
      date: "2026-08-06",
      label: "Romaria do Bom Jesus",
      isClosed: false,
      openTime: "07:00",
      closeTime: "21:00",
    },
  ],
  followers_count: 148,
};

export const DEMO_ALL_STORES: MerchantStoreConfig[] = [
  DEMO_MERCHANT_STORE,
  {
    id: "store-2",
    name: "Império dos Calçados",
    slug: "imperio-dos-calcados",
    avatar_url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=250&q=80",
    banner_url: null,
    description: "Tênis esportivos, sandálias e calçados para toda a família.",
    whatsapp: "5577999445566",
    instagram: "@imperiodoscalcadoslapa",
    neighborhood_id: "sao-gotardo",
    neighborhood_name: "São Gotardo",
    address: "Av. Santa Catarina, 410 - São Gotardo",
    plan_tier: "premium",
    is_verified: true,
    accepted_payments: ["pix", "credit_card", "debit_card", "cash"],
    installment_info: "Em até 4x sem juros",
    has_delivery: true,
    has_pickup: true,
    delivery_fee_type: "combine",
    delivery_fee: 0,
    business_hours: DEFAULT_LAPA_BUSINESS_HOURS,
    special_hours: [],
    followers_count: 92,
  },
  {
    id: "store-3",
    name: "Lapa Tech & Celulares",
    slug: "lapa-tech-celulares",
    avatar_url:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=250&q=80",
    banner_url: null,
    description:
      "Smartphones, fones Bluetooth, caixas de som e assistência especializada.",
    whatsapp: "5577999778899",
    instagram: "@lapatechcelulares",
    neighborhood_id: "centro",
    neighborhood_name: "Centro",
    address: "Rua Floriano Peixoto, 85 - Centro",
    plan_tier: "free",
    is_verified: false,
    accepted_payments: ["pix", "credit_card", "payment_link"],
    installment_info: "Até 12x no cartão",
    has_delivery: true,
    has_pickup: true,
    delivery_fee_type: "fixed",
    delivery_fee: 5,
    business_hours: DEFAULT_LAPA_BUSINESS_HOURS,
    special_hours: [],
    followers_count: 64,
  },
  {
    id: "store-4",
    name: "Casa & Conforto Lapa",
    slug: "casa-conforto-lapa",
    avatar_url:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=250&q=80",
    banner_url: null,
    description: "Ventiladores, eletroportáteis e enxovais em Bom Jesus da Lapa.",
    whatsapp: "5577999001122",
    instagram: "@casaconfortolapa",
    neighborhood_id: "parque-verde",
    neighborhood_name: "Parque Verde",
    address: "Rua das Palmeiras, 50 - Parque Verde",
    plan_tier: "free",
    is_verified: true,
    accepted_payments: ["pix", "credit_card", "cash", "crediario"],
    installment_info: "Crediário próprio em até 5x",
    has_delivery: true,
    has_pickup: true,
    delivery_fee_type: "free",
    delivery_fee: 0,
    business_hours: DEFAULT_LAPA_BUSINESS_HOURS,
    special_hours: [],
    followers_count: 37,
  },
];

export const DEMO_MERCHANT_PRODUCTS: MerchantProduct[] = [
  {
    id: "prod-1",
    store_id: "store-1",
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
    category_id: "cat-moda",
    subcategory_id: "sub-vestidos",
    gender: "Feminino",
    sizes: ["P", "M", "G", "GG"],
    voltage: null,
    condition: "new",
    is_active: true,
    views_count: 428,
    clicks_whatsapp: 39,
    created_at: "2026-11-10T10:00:00Z",
  },
  {
    id: "prod-2",
    store_id: "store-1",
    title: "Vestido Midi Floral Sol de Verão",
    slug: "vestido-midi-floral-sol",
    description:
      "Vestido fluido em viscose premium com alças reguláveis e forro duplo.",
    price: 159.9,
    promotional_price: 119.9,
    image_url:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [],
    category_id: "cat-moda",
    subcategory_id: "sub-vestidos",
    gender: "Feminino",
    sizes: ["P", "M", "G"],
    voltage: null,
    condition: "new",
    is_active: true,
    views_count: 312,
    clicks_whatsapp: 27,
    created_at: "2026-11-09T14:30:00Z",
  },
  {
    id: "prod-4",
    store_id: "store-1",
    title: "Bolsa Tiracolo Couro Legítimo Caramelo",
    slug: "bolsa-tiracolo-couro-caramelo",
    description:
      "Acabamento artesanal com alça regulável e metais dourados inoxidáveis.",
    price: 179.9,
    promotional_price: null,
    image_url:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [],
    category_id: "cat-acessorios",
    subcategory_id: "sub-bolsas",
    gender: "Feminino",
    sizes: ["Único"],
    voltage: null,
    condition: "new",
    is_active: true,
    views_count: 195,
    clicks_whatsapp: 14,
    created_at: "2026-11-08T09:15:00Z",
  },
  {
    id: "prod-5",
    store_id: "store-1",
    title: "Camisa Linho Masculina Branca Romaria",
    slug: "camisa-linho-masculina-branca",
    description: "Corte confortável e fresco, ideal para eventos e passeios.",
    price: 139.9,
    promotional_price: 109.9,
    image_url:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [],
    category_id: "cat-moda",
    subcategory_id: "sub-camisas",
    gender: "Masculino",
    sizes: ["M", "G", "GG"],
    voltage: null,
    condition: "new",
    is_active: false,
    views_count: 84,
    clicks_whatsapp: 6,
    created_at: "2026-11-05T16:00:00Z",
  },
];

export async function fetchMerchantDashboardData(): Promise<{
  store: MerchantStoreConfig;
  products: MerchantProduct[];
  categories: GlobalCategory[];
  neighborhoods: NeighborhoodItem[];
  isSupabaseReady: boolean;
}> {
  await requireUserPage("/painel");

  const supabaseReady = isSupabaseConfigured();
  if (!supabaseReady) {
    return {
      store: DEMO_MERCHANT_STORE,
      products: DEMO_MERCHANT_PRODUCTS,
      categories: FALLBACK_GLOBAL_CATEGORIES,
      neighborhoods: FALLBACK_NEIGHBORHOODS,
      isSupabaseReady: false,
    };
  }

  try {
    const supabase = await createClient();

    // 1. Categorias Globais
    let categories = FALLBACK_GLOBAL_CATEGORIES;
    const { data: dbCategories } = await supabase
      .from("global_categories")
      .select("*")
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

    // 2. Bairros
    let neighborhoods = FALLBACK_NEIGHBORHOODS;
    const { data: dbNeighborhoods } = await supabase
      .from("neighborhoods")
      .select("*")
      .order("name", { ascending: true });

    if (dbNeighborhoods && dbNeighborhoods.length > 0) {
      neighborhoods = dbNeighborhoods.map((nb: Record<string, unknown>) => ({
        id: String(nb.id),
        name: String(nb.name),
        slug: nb.slug ? String(nb.slug) : undefined,
        is_active: nb.is_active !== false,
      }));
    }

    // 3. Loja do usuário autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let store = DEMO_MERCHANT_STORE;
    let products = DEMO_MERCHANT_PRODUCTS;

    if (user) {
      const { data: dbStore } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (dbStore) {
        const raw = dbStore as Record<string, unknown>;
        const nbId = String(raw.neighborhood_id || neighborhoods[0]?.id || "centro");
        const matchedNb = neighborhoods.find((n) => n.id === nbId);

        // Contar seguidores da loja
        const { count: followersCount } = await supabase
          .from("followed_stores")
          .select("*", { count: "exact", head: true })
          .eq("store_id", raw.id);

        const rawPlan = String(raw.plan_tier || raw.plan || "free");

        store = {
          id: String(raw.id),
          owner_id: String(raw.owner_id || user.id),
          name: String(raw.name || "Minha Loja"),
          slug: String(raw.slug || "minha-loja"),
          avatar_url:
            (raw.avatar_url as string | null) ??
            (raw.logo_url as string | null) ??
            null,
          banner_url: (raw.banner_url as string | null) ?? null,
          description:
            (raw.description as string | null) ??
            (raw.bio as string | null) ??
            null,
          whatsapp: String(raw.whatsapp || ""),
          instagram: (raw.instagram as string | null) ?? null,
          neighborhood_id: nbId,
          neighborhood_name: matchedNb?.name || "Centro",
          address: String(raw.address || ""),
          plan_tier: rawPlan === "premium" ? "premium" : "free",
          is_verified: Boolean(raw.is_verified),
          accepted_payments: Array.isArray(raw.accepted_payments)
            ? (raw.accepted_payments as MerchantStoreConfig["accepted_payments"])
            : Array.isArray(raw.payment_methods)
            ? (raw.payment_methods as MerchantStoreConfig["accepted_payments"])
            : ["pix", "credit_card", "cash"],
          installment_info: (raw.installment_info as string | null) ?? null,
          has_delivery: raw.has_delivery !== false,
          has_pickup: raw.has_pickup !== false,
          delivery_fee_type:
            (raw.delivery_fee_type as MerchantStoreConfig["delivery_fee_type"]) ||
            "combine",
          delivery_fee:
            raw.delivery_fee != null ? Number(raw.delivery_fee) : 0,
          business_hours:
            (raw.business_hours as Record<number, DaySchedule>) ||
            DEFAULT_LAPA_BUSINESS_HOURS,
          special_hours: Array.isArray(raw.special_hours)
            ? (raw.special_hours as MerchantStoreConfig["special_hours"])
            : [],
          followers_count: followersCount ?? 0,
        };

        // 4. Produtos da loja
        const { data: dbProducts } = await supabase
          .from("products")
          .select("*")
          .eq("store_id", store.id)
          .order("created_at", { ascending: false });

        if (dbProducts) {
          products = dbProducts.map((p: Record<string, unknown>) => ({
            id: String(p.id),
            store_id: String(p.store_id || store.id),
            title: String(p.title || p.name || "Produto"),
            slug: p.slug ? String(p.slug) : undefined,
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
            category_id: String(p.category_id || "cat-moda"),
            subcategory_id: p.subcategory_id ? String(p.subcategory_id) : null,
            gender: (p.gender as MerchantProduct["gender"]) ?? null,
            sizes: Array.isArray(p.sizes) ? (p.sizes as string[]) : [],
            voltage: (p.voltage as MerchantProduct["voltage"]) ?? null,
            condition: (p.condition as MerchantProduct["condition"]) || "new",
            is_active: p.is_active !== false,
            views_count: Number(p.views_count || 0),
            clicks_whatsapp: Number(p.clicks_whatsapp || 0),
            created_at: p.created_at ? String(p.created_at) : undefined,
          }));
        } else {
          products = [];
        }
      }
    }

    return {
      store,
      products,
      categories,
      neighborhoods,
      isSupabaseReady: true,
    };
  } catch {
    return {
      store: DEMO_MERCHANT_STORE,
      products: DEMO_MERCHANT_PRODUCTS,
      categories: FALLBACK_GLOBAL_CATEGORIES,
      neighborhoods: FALLBACK_NEIGHBORHOODS,
      isSupabaseReady: false,
    };
  }
}

export async function fetchMasterPortalData(): Promise<{
  stores: MerchantStoreConfig[];
  categories: GlobalCategory[];
  neighborhoods: NeighborhoodItem[];
  isSupabaseReady: boolean;
}> {
  await requireAdminPage("/master");

  const supabaseReady = isSupabaseConfigured();
  if (!supabaseReady) {
    return {
      stores: DEMO_ALL_STORES,
      categories: FALLBACK_GLOBAL_CATEGORIES,
      neighborhoods: FALLBACK_NEIGHBORHOODS,
      isSupabaseReady: false,
    };
  }

  try {
    const supabase = await createClient();

    let neighborhoods = FALLBACK_NEIGHBORHOODS;
    const { data: dbNeighborhoods } = await supabase
      .from("neighborhoods")
      .select("*")
      .order("name", { ascending: true });

    if (dbNeighborhoods && dbNeighborhoods.length > 0) {
      neighborhoods = dbNeighborhoods.map((nb: Record<string, unknown>) => ({
        id: String(nb.id),
        name: String(nb.name),
        slug: nb.slug ? String(nb.slug) : undefined,
        is_active: nb.is_active !== false,
      }));
    }

    let categories = FALLBACK_GLOBAL_CATEGORIES;
    const { data: dbCategories } = await supabase
      .from("global_categories")
      .select("*")
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

    let stores = DEMO_ALL_STORES;
    const { data: dbStores } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false });

    if (dbStores && dbStores.length > 0) {
      stores = dbStores.map((raw: Record<string, unknown>) => {
        const nbId = String(raw.neighborhood_id || "centro");
        const matchedNb = neighborhoods.find((n) => n.id === nbId);
        const rawPlan = String(raw.plan_tier || raw.plan || "free");

        return {
          id: String(raw.id),
          owner_id: raw.owner_id ? String(raw.owner_id) : undefined,
          name: String(raw.name || "Loja"),
          slug: String(raw.slug || raw.id),
          avatar_url:
            (raw.avatar_url as string | null) ??
            (raw.logo_url as string | null) ??
            null,
          banner_url: (raw.banner_url as string | null) ?? null,
          description: (raw.description as string | null) ?? null,
          whatsapp: String(raw.whatsapp || ""),
          instagram: (raw.instagram as string | null) ?? null,
          neighborhood_id: nbId,
          neighborhood_name: matchedNb?.name || "Centro",
          address: String(raw.address || ""),
          plan_tier: rawPlan === "premium" ? "premium" : "free",
          is_verified: Boolean(raw.is_verified),
          accepted_payments: Array.isArray(raw.accepted_payments)
            ? (raw.accepted_payments as MerchantStoreConfig["accepted_payments"])
            : ["pix"],
          installment_info: (raw.installment_info as string | null) ?? null,
          has_delivery: raw.has_delivery !== false,
          has_pickup: raw.has_pickup !== false,
          delivery_fee_type:
            (raw.delivery_fee_type as MerchantStoreConfig["delivery_fee_type"]) ||
            "combine",
          delivery_fee:
            raw.delivery_fee != null ? Number(raw.delivery_fee) : 0,
          business_hours:
            (raw.business_hours as Record<number, DaySchedule>) ||
            DEFAULT_LAPA_BUSINESS_HOURS,
          special_hours: Array.isArray(raw.special_hours)
            ? (raw.special_hours as MerchantStoreConfig["special_hours"])
            : [],
          followers_count: Number(raw.followers_count || 0),
        };
      });
    }

    return {
      stores,
      categories,
      neighborhoods,
      isSupabaseReady: true,
    };
  } catch {
    return {
      stores: DEMO_ALL_STORES,
      categories: FALLBACK_GLOBAL_CATEGORIES,
      neighborhoods: FALLBACK_NEIGHBORHOODS,
      isSupabaseReady: false,
    };
  }
}

export async function fetchMasterDashboardData(): Promise<MasterDashboardData> {
  await requireAdminPage("/master");

  const portalData = await fetchMasterPortalData();
  const stores = portalData.stores;
  const totalStores = stores.length;
  const premiumStores = stores.filter((s) => s.plan_tier === "premium").length;

  const cohorts: MasterCohortWeek[] = [
    {
      weekLabel: "06 a 12 Nov",
      daysAgoLabel: "Esta semana",
      signups: 14,
      hasProductsPercent: 78.5,
      hasProductsCount: 11,
      catalogReadyPercent: 42.8,
      catalogReadyCount: 6,
      hasWhatsappOrdersPercent: 28.5,
      hasWhatsappOrdersCount: 4,
      paidPercent: 7.1,
      paidCount: 1,
    },
    {
      weekLabel: "30 Out a 05 Nov",
      daysAgoLabel: "7 dias atrás",
      signups: 12,
      hasProductsPercent: 83.3,
      hasProductsCount: 10,
      catalogReadyPercent: 58.3,
      catalogReadyCount: 7,
      hasWhatsappOrdersPercent: 41.6,
      hasWhatsappOrdersCount: 5,
      paidPercent: 16.6,
      paidCount: 2,
    },
    {
      weekLabel: "23 a 29 Out",
      daysAgoLabel: "14 dias atrás",
      signups: 15,
      hasProductsPercent: 86.6,
      hasProductsCount: 13,
      catalogReadyPercent: 66.6,
      catalogReadyCount: 10,
      hasWhatsappOrdersPercent: 53.3,
      hasWhatsappOrdersCount: 8,
      paidPercent: 20.0,
      paidCount: 3,
    },
    {
      weekLabel: "16 a 22 Out",
      daysAgoLabel: "21 dias atrás",
      signups: 10,
      hasProductsPercent: 90.0,
      hasProductsCount: 9,
      catalogReadyPercent: 70.0,
      catalogReadyCount: 7,
      hasWhatsappOrdersPercent: 60.0,
      hasWhatsappOrdersCount: 6,
      paidPercent: 30.0,
      paidCount: 3,
    },
  ];

  const upgradeOpportunities: MasterStoreLead[] = [
    {
      id: "opp-1",
      name: "Bella Moda Lapa",
      slug: "bella-moda-lapa",
      avatar_url:
        "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=250&q=80",
      neighborhood: "Centro",
      whatsapp: "5577999112233",
      productsCount: 18,
      viewsCount: 2450,
      whatsappClicks: 182,
      plan_tier: "free",
      createdAtDaysAgo: 14,
    },
    {
      id: "opp-2",
      name: "Império dos Calçados",
      slug: "imperio-dos-calcados",
      avatar_url:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=250&q=80",
      neighborhood: "São Gotardo",
      whatsapp: "5577999445566",
      productsCount: 24,
      viewsCount: 3120,
      whatsappClicks: 210,
      plan_tier: "free",
      createdAtDaysAgo: 18,
    },
    {
      id: "opp-3",
      name: "Lapa Tech & Celulares",
      slug: "lapa-tech-celulares",
      avatar_url:
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=250&q=80",
      neighborhood: "Centro",
      whatsapp: "5577998887766",
      productsCount: 15,
      viewsCount: 1890,
      whatsappClicks: 144,
      plan_tier: "free",
      createdAtDaysAgo: 8,
    },
    {
      id: "opp-4",
      name: "Cantinho do Bebê Lapa",
      slug: "cantinho-do-bebe-lapa",
      avatar_url: null,
      neighborhood: "São João",
      whatsapp: "5577991234567",
      productsCount: 12,
      viewsCount: 1240,
      whatsappClicks: 96,
      plan_tier: "free",
      createdAtDaysAgo: 5,
    },
  ];

  const stalledOnboarding: MasterStoreLead[] = [
    {
      id: "stall-1",
      name: "Mercadinho São Francisco",
      slug: "mercadinho-sao-francisco",
      avatar_url: null,
      neighborhood: "Parque Verde",
      whatsapp: "5577998112244",
      productsCount: 0,
      viewsCount: 42,
      whatsappClicks: 0,
      plan_tier: "free",
      createdAtDaysAgo: 4,
    },
    {
      id: "stall-2",
      name: "Farmácia Central Lapa",
      slug: "farmacia-central-lapa",
      avatar_url: null,
      neighborhood: "Centro",
      whatsapp: "5577999556677",
      productsCount: 0,
      viewsCount: 38,
      whatsappClicks: 0,
      plan_tier: "free",
      createdAtDaysAgo: 6,
    },
  ];

  return {
    weeklyTarget: {
      periodLabel: "06 Nov a 12 Nov (Dia 7 de 7)",
      newReactivated: 14,
      newReactivatedGoal: 20,
      churn: 3,
      churnLimit: 5,
      netGrowth: 11,
      netGrowthGoal: 15,
      lastWeek: {
        newReactivated: 12,
        churn: 2,
        netGrowth: 10,
      },
    },
    macroKpis: {
      payingSubscribers: Math.max(premiumStores, 14),
      onTrialNow: 8,
      activeVisitors15d: 4820,
      totalStoresEver: Math.max(totalStores, 48),
    },
    cohorts,
    upgradeOpportunities,
    stalledOnboarding,
    engagement: {
      totalViews: 28450,
      totalWhatsappClicks: 1840,
      totalProducts: 342,
      conversionRate: 6.47,
    },
    neighborhoodsDistribution: [
      { name: "Centro", count: 20, percentage: 41.6 },
      { name: "São Gotardo", count: 11, percentage: 22.9 },
      { name: "São João", count: 7, percentage: 14.5 },
      { name: "Parque Verde", count: 5, percentage: 10.4 },
      { name: "Beira Rio", count: 3, percentage: 6.2 },
      { name: "Lagoa Grande", count: 2, percentage: 4.4 },
    ],
    categoriesDistribution: [
      { name: "Moda & Vestuário", count: 16, percentage: 33.3 },
      { name: "Calçados & Bolsas", count: 10, percentage: 20.8 },
      { name: "Celulares & Tech", count: 8, percentage: 16.6 },
      { name: "Restaurantes & Delivery", count: 6, percentage: 12.5 },
      { name: "Casa & Móveis", count: 5, percentage: 10.4 },
      { name: "Outros", count: 3, percentage: 6.4 },
    ],
    isSupabaseReady: portalData.isSupabaseReady,
  };
}

export const DEMO_MASTER_USERS: MasterUserItem[] = [
  {
    id: "user-1",
    full_name: "Daniel Bezerra",
    email: "daniel@lapamarketplace.com.br",
    whatsapp: "5577999112233",
    role: "admin",
    avatar_url: null,
    neighborhood_name: "Centro",
    created_at: "2026-08-01T10:00:00Z",
  },
  {
    id: "user-2",
    full_name: "Mariana Silva",
    email: "mariana.bella@gmail.com",
    whatsapp: "5577999112233",
    role: "merchant",
    avatar_url:
      "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=250&q=80",
    store_id: "store-1",
    store_name: "Bella Moda Lapa",
    store_slug: "bella-moda-lapa",
    neighborhood_name: "Centro",
    created_at: "2026-08-10T14:30:00Z",
  },
  {
    id: "user-3",
    full_name: "Carlos Eduardo Santos",
    email: "carlos.calcados@hotmail.com",
    whatsapp: "5577999445566",
    role: "merchant",
    avatar_url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=250&q=80",
    store_id: "store-2",
    store_name: "Império dos Calçados",
    store_slug: "imperio-dos-calcados",
    neighborhood_name: "São Gotardo",
    created_at: "2026-08-15T09:20:00Z",
  },
  {
    id: "user-4",
    full_name: "Lucas Ferreira",
    email: "lucas.tech@gmail.com",
    whatsapp: "5577998887766",
    role: "merchant",
    avatar_url:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=250&q=80",
    store_id: "store-3",
    store_name: "Lapa Tech & Celulares",
    store_slug: "lapa-tech-celulares",
    neighborhood_name: "Centro",
    created_at: "2026-09-02T16:15:00Z",
  },
  {
    id: "user-5",
    full_name: "Fernanda Oliveira",
    email: "fernanda.lapa@gmail.com",
    whatsapp: "5577998123456",
    role: "customer",
    avatar_url: null,
    neighborhood_name: "São João",
    created_at: "2026-09-12T11:45:00Z",
  },
  {
    id: "user-6",
    full_name: "Roberto Almeida",
    email: "roberto.almeida@gmail.com",
    whatsapp: "5577991987654",
    role: "customer",
    avatar_url: null,
    neighborhood_name: "Parque Verde",
    created_at: "2026-09-20T18:30:00Z",
  },
  {
    id: "user-7",
    full_name: "Juliana Mendes",
    email: "juliana.mendes@outlook.com",
    whatsapp: "5577998774411",
    role: "customer",
    avatar_url: null,
    neighborhood_name: "Beira Rio",
    created_at: "2026-10-05T08:10:00Z",
  },
  {
    id: "user-8",
    full_name: "Marcos Vinicius",
    email: "marcos.saofrancisco@gmail.com",
    whatsapp: "5577998112244",
    role: "merchant",
    avatar_url: null,
    store_id: "stall-1",
    store_name: "Mercadinho São Francisco",
    store_slug: "mercadinho-sao-francisco",
    neighborhood_name: "Parque Verde",
    created_at: "2026-11-08T15:00:00Z",
  },
];

export async function fetchMasterUsersData(): Promise<{
  users: MasterUserItem[];
  isSupabaseReady: boolean;
}> {
  await requireAdminPage("/master");

  const supabaseReady = isSupabaseConfigured();
  if (!supabaseReady) {
    return {
      users: DEMO_MASTER_USERS,
      isSupabaseReady: false,
    };
  }

  try {
    const supabase = await createClient();

    const [{ data: dbProfiles }, { data: dbStores }, { data: dbNeighborhoods }] =
      await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("stores").select("id, name, slug, owner_id"),
        supabase.from("neighborhoods").select("id, name"),
      ]);

    if (!dbProfiles || dbProfiles.length === 0) {
      return {
        users: DEMO_MASTER_USERS,
        isSupabaseReady: true,
      };
    }

    const nbMap = new Map<string, string>();
    (dbNeighborhoods || []).forEach((nb: Record<string, unknown>) => {
      nbMap.set(String(nb.id), String(nb.name));
    });

    const storeOwnerMap = new Map<string, { id: string; name: string; slug: string }>();
    (dbStores || []).forEach((st: Record<string, unknown>) => {
      if (st.owner_id) {
        storeOwnerMap.set(String(st.owner_id), {
          id: String(st.id),
          name: String(st.name || "Loja"),
          slug: String(st.slug || st.id),
        });
      }
    });

    const users: MasterUserItem[] = dbProfiles.map((p: Record<string, unknown>) => {
      const pId = String(p.id);
      const matchedStore = storeOwnerMap.get(pId);
      const nbId = p.default_neighborhood_id ? String(p.default_neighborhood_id) : "";
      const rawRole = String(p.role || "customer");
      const role: "customer" | "merchant" | "admin" =
        rawRole === "admin"
          ? "admin"
          : rawRole === "merchant" || Boolean(matchedStore)
          ? "merchant"
          : "customer";

      return {
        id: pId,
        full_name: String(p.full_name || "Usuário"),
        email: String(p.email || ""),
        whatsapp: p.whatsapp ? String(p.whatsapp) : null,
        role,
        avatar_url: (p.avatar_url as string | null) ?? null,
        store_id: matchedStore?.id ?? null,
        store_name: matchedStore?.name ?? null,
        store_slug: matchedStore?.slug ?? null,
        neighborhood_name: nbMap.get(nbId) ?? (nbId ? "Centro" : null),
        created_at: String(p.created_at || new Date().toISOString()),
      };
    });

    return {
      users,
      isSupabaseReady: true,
    };
  } catch {
    return {
      users: DEMO_MASTER_USERS,
      isSupabaseReady: false,
    };
  }
}

