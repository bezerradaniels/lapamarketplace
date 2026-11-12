/**
 * Lojas e produtos de demonstração (mockups) usados quando o Supabase ainda não
 * tem lojas cadastradas. Categorias com os mesmos `id`/`slug` de `global_categories`.
 *
 * 2 farmácias · 2 lojas de suplementos · 2 joalherias · 2 sapatarias ·
 * 2 lojas de celulares · 2 lojas de informática.
 */
import type {
  DaySchedule,
  ProductItem,
  StoreSummary,
  StoreWithStories,
} from "@/types/marketplace";

/* ---------- Categorias (ids reais de global_categories) ---------- */

export const DEMO_CATEGORIES = {
  moda: { id: "713b85ff-d9af-4bc3-a1c7-5ce2c994c2b3", slug: "moda-vestuario" },
  calcados: { id: "bd8c5a95-39ff-4471-b401-b151aa9aec3d", slug: "calcados-bolsas" },
  eletronicos: { id: "9c586e3e-22c3-4ddc-8466-684445b3a35e", slug: "celulares-eletronicos" },
  casa: { id: "65f1de27-526c-4c2b-85b0-527c70c69773", slug: "casa-moveis-eletro" },
  beleza: { id: "62c70936-cbcb-401e-b5ed-b4044b78d569", slug: "beleza-perfumaria" },
} as const;

const SUB = {
  roupasFemininas: { id: "b6082ecc-6e8e-4d0d-b3a2-4492ca7d37ff", slug: "roupas-femininas" },
  acessorios: { id: "e5bb391b-89c0-4233-85ca-9714ae187a1e", slug: "acessorios-relogios-oculos" },
  tenis: { id: "ff118894-69bf-435c-b4ef-a6f55015405f", slug: "tenis" },
  sandalias: { id: "a3e7093d-cc1d-4acd-90a4-8a1e90ac935f", slug: "sandalias-rasteiras" },
  sapatos: { id: "8a60f36b-7ada-45a2-8791-99d00df44fb5", slug: "sapatos-botas" },
  bolsas: { id: "e4fe06a7-cf33-4534-93be-cc30568c3034", slug: "bolsas-malas-mochilas" },
  smartphones: { id: "c792374d-654d-445f-9f79-c65e80d2c3dd", slug: "smartphones" },
  capinhas: { id: "b312e5a8-b414-4e4b-a7c3-37dc090afce0", slug: "capinhas-peliculas-cabos" },
  fones: { id: "2efecff2-35fc-4e08-9e80-b2852f83b98c", slug: "fones-caixas-som" },
  informatica: { id: "e547fcea-4af1-4329-855b-f0875f06d062", slug: "informatica-notebooks" },
  games: { id: "af5aa3ea-641f-40fd-a3f9-0c6ddc9f5c3c", slug: "games-consoles" },
  climatizacao: { id: "e064d1eb-f0a6-4743-ad8c-0a7317b30ad4", slug: "climatizacao" },
  skincare: { id: "e71c95c4-bc68-46bb-9ffc-82f71bacc0fc", slug: "maquiagem-skincare" },
  cabelos: { id: "7d1b6b0e-6f96-4101-9a6f-6d1717215127", slug: "cabelos-barbearia" },
  suplementos: { id: "cf8933dd-c6ec-4c40-9412-2f0e72c6ed3c", slug: "suplementos-vitaminas" },
} as const;

/** Mapeia os slugs antigos dos mocks originais para as categorias reais. */
export const LEGACY_CATEGORY_MAP: Record<
  string,
  { category: { id: string; slug: string }; sub: { id: string; slug: string } }
> = {
  "vestidos-conjuntos": { category: DEMO_CATEGORIES.moda, sub: SUB.roupasFemininas },
  "tenis-esportivos": { category: DEMO_CATEGORIES.calcados, sub: SUB.tenis },
  "sandalias-rasteiras": { category: DEMO_CATEGORIES.calcados, sub: SUB.sandalias },
  "fones-audio": { category: DEMO_CATEGORIES.eletronicos, sub: SUB.fones },
  "smartphones-capinhas": { category: DEMO_CATEGORIES.eletronicos, sub: SUB.smartphones },
  eletrodomesticos: { category: DEMO_CATEGORIES.casa, sub: SUB.climatizacao },
  "bolsas-carteiras": { category: DEMO_CATEGORIES.calcados, sub: SUB.bolsas },
};

/* ---------- Helpers ---------- */

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

function hours(
  weekday: [string, string],
  saturday: [string, string] | null,
  sunday: [string, string] | null,
  lunch: [string, string] | null = null
): Record<number, DaySchedule> {
  const day = (d: number, h: [string, string] | null, withLunch: boolean): DaySchedule =>
    h
      ? {
          dayOfWeek: d,
          isClosed: false,
          openTime: h[0],
          closeTime: h[1],
          lunchStart: withLunch && lunch ? lunch[0] : null,
          lunchEnd: withLunch && lunch ? lunch[1] : null,
        }
      : { dayOfWeek: d, isClosed: true };
  return {
    0: day(0, sunday, false),
    1: day(1, weekday, true),
    2: day(2, weekday, true),
    3: day(3, weekday, true),
    4: day(4, weekday, true),
    5: day(5, weekday, true),
    6: day(6, saturday, false),
  };
}

const PHARMACY_HOURS = hours(["07:00", "22:00"], ["07:00", "22:00"], ["08:00", "20:00"]);
const MALL_HOURS = hours(["08:00", "19:00"], ["08:00", "17:00"], null);
const SHOP_HOURS = hours(["08:00", "18:00"], ["08:00", "13:00"], null, ["12:00", "14:00"]);
const EVENING_HOURS = hours(["09:00", "20:00"], ["09:00", "18:00"], ["09:00", "13:00"]);

type StoreSeed = Omit<StoreSummary, "neighborhood_id" | "special_hours" | "followers_count"> & {
  followers_count: number;
};

function store(seed: StoreSeed): StoreSummary {
  return {
    ...seed,
    neighborhood_id: seed.neighborhood_slug,
    special_hours: [],
    city: "Bom Jesus da Lapa",
  };
}

type ProductSeed = Pick<
  ProductItem,
  "id" | "title" | "slug" | "description" | "price" | "image_url"
> &
  Partial<
    Pick<
      ProductItem,
      | "promotional_price"
      | "gallery_urls"
      | "sizes"
      | "colors"
      | "gender"
      | "voltage"
      | "stock"
      | "views_count"
      | "clicks_whatsapp"
      | "created_at"
    >
  > & {
    category: { id: string; slug: string };
    sub: { id: string; slug: string };
  };

function product(s: StoreSummary, seed: ProductSeed): ProductItem {
  const { category, sub, ...rest } = seed;
  return {
    promotional_price: null,
    gallery_urls: [],
    sizes: [],
    gender: null,
    voltage: null,
    views_count: 120,
    clicks_whatsapp: 8,
    created_at: "2026-10-28T12:00:00Z",
    ...rest,
    condition: "new",
    category_id: category.id,
    category_slug: category.slug,
    subcategory_id: sub.id,
    subcategory_slug: sub.slug,
    is_active: true,
    store: s,
  };
}

/* ---------- Lojas ---------- */

const farmaciaSaoFrancisco = store({
  id: "store-5",
  name: "Farmácia São Francisco",
  slug: "farmacia-sao-francisco",
  avatar_url: img("1631549916768-4119b2e5f926", 250),
  banner_url: img("1576602976047-174e57a47881", 1400),
  description:
    "Dermocosméticos, higiene e cuidados do dia a dia. Aberta até as 22h, inclusive domingo.",
  neighborhood: "Centro",
  neighborhood_slug: "centro",
  address: "Praça Marechal Deodoro, 32 - Centro",
  instagram: "@farmaciasaofranciscolapa",
  whatsapp: "5577999100501",
  is_verified: true,
  plan: "premium",
  business_hours: PHARMACY_HOURS,
  payment_methods: ["pix", "credit_card", "debit_card", "cash"],
  installment_info: "Até 3x sem juros no cartão acima de R$ 150",
  has_delivery: true,
  has_pickup: true,
  delivery_fee_type: "free",
  delivery_fee: 0,
  followers_count: 211,
  created_at: "2026-06-10T12:00:00Z",
});

const drogariaBomJesus = store({
  id: "store-6",
  name: "Drogaria Bom Jesus",
  slug: "drogaria-bom-jesus",
  avatar_url: img("1587854692152-cbe660dbde88", 250),
  banner_url: img("1584308666744-24d5c474f2ae", 1400),
  description:
    "Perfumaria, protetor solar e linha infantil com entrega por motoboy em Beira Rio e região.",
  neighborhood: "Beira Rio",
  neighborhood_slug: "beira-rio",
  address: "Av. Beira Rio, 615 - Beira Rio",
  instagram: "@drogariabomjesus",
  whatsapp: "5577999100602",
  is_verified: true,
  plan: "free",
  business_hours: PHARMACY_HOURS,
  payment_methods: ["pix", "credit_card", "debit_card", "cash", "crediario"],
  installment_info: "Crediário da casa em até 2x",
  has_delivery: true,
  has_pickup: true,
  delivery_fee_type: "fixed",
  delivery_fee: 4,
  followers_count: 86,
  created_at: "2026-11-02T12:00:00Z",
});

const forcaTotal = store({
  id: "store-7",
  name: "Força Total Suplementos",
  slug: "forca-total-suplementos",
  avatar_url: img("1534438327276-14e5300c3a48", 250),
  banner_url: img("1517836357463-d25dfeac3438", 1400),
  description:
    "Whey, creatina e pré-treinos das melhores marcas. Atendimento de quem treina com você.",
  neighborhood: "São João",
  neighborhood_slug: "sao-joao",
  address: "Rua Barão do Rio Branco, 210 - São João",
  instagram: "@forcatotallapa",
  whatsapp: "5577999100703",
  is_verified: true,
  plan: "premium",
  business_hours: EVENING_HOURS,
  payment_methods: ["pix", "credit_card", "debit_card"],
  installment_info: "Até 4x sem juros no cartão",
  has_delivery: true,
  has_pickup: true,
  delivery_fee_type: "fixed",
  delivery_fee: 5,
  followers_count: 174,
  created_at: "2026-07-01T12:00:00Z",
});

const vidaFit = store({
  id: "store-8",
  name: "Vida Fit Nutrição",
  slug: "vida-fit-nutricao",
  avatar_url: img("1571019613454-1cb2f99b2d8b", 250),
  banner_url: img("1593095948071-474c5cc2989d", 1400),
  description:
    "Suplementos, vitaminas e snacks proteicos. Monte seu kit e retire na loja no mesmo dia.",
  neighborhood: "Primavera",
  neighborhood_slug: "primavera",
  address: "Rua das Acácias, 77 - Primavera",
  instagram: "@vidafitlapa",
  whatsapp: "5577999100804",
  is_verified: false,
  plan: "free",
  business_hours: SHOP_HOURS,
  payment_methods: ["pix", "credit_card", "cash"],
  installment_info: "Até 2x no cartão",
  has_delivery: false,
  has_pickup: true,
  delivery_fee_type: "combine",
  delivery_fee: 0,
  followers_count: 41,
  created_at: "2026-10-30T12:00:00Z",
});

const ouroDaLapa = store({
  id: "store-9",
  name: "Ouro da Lapa Joias",
  slug: "ouro-da-lapa-joias",
  avatar_url: img("1515562141207-7a88fb7ce338", 250),
  banner_url: img("1602173574767-37ac01994b2a", 1400),
  description:
    "Joias em ouro 18k, alianças sob medida e consertos. Tradição de família no Centro da Lapa.",
  neighborhood: "Centro",
  neighborhood_slug: "centro",
  address: "Rua Coronel Martins, 18 - Centro",
  instagram: "@ourodalapa",
  whatsapp: "5577999100905",
  is_verified: true,
  plan: "premium",
  business_hours: SHOP_HOURS,
  payment_methods: ["pix", "credit_card", "debit_card", "crediario"],
  installment_info: "Até 10x sem juros no cartão",
  has_delivery: false,
  has_pickup: true,
  delivery_fee_type: "combine",
  delivery_fee: 0,
  followers_count: 263,
  created_at: "2026-03-15T12:00:00Z",
});

const brilhoPrata = store({
  id: "store-10",
  name: "Brilho Prata 925",
  slug: "brilho-prata-925",
  avatar_url: img("1611591437281-460bfbe1220a", 250),
  banner_url: img("1535632066927-ab7c9ab60908", 1400),
  description:
    "Semijoias e prata 925 com garantia. Presentes embalados prontos para entregar.",
  neighborhood: "Cavalhada",
  neighborhood_slug: "cavalhada",
  address: "Av. Juracy Magalhães, 402 - Cavalhada",
  instagram: "@brilhoprata925",
  whatsapp: "5577999101006",
  is_verified: false,
  plan: "free",
  business_hours: MALL_HOURS,
  payment_methods: ["pix", "credit_card", "cash"],
  installment_info: "Até 3x sem juros no cartão",
  has_delivery: true,
  has_pickup: true,
  delivery_fee_type: "free",
  delivery_fee: 0,
  followers_count: 58,
  created_at: "2026-11-06T12:00:00Z",
});

const passoFirme = store({
  id: "store-11",
  name: "Passo Firme Calçados",
  slug: "passo-firme-calcados",
  avatar_url: img("1549298916-b41d501d3772", 250),
  banner_url: img("1560769629-975ec94e6a86", 1400),
  description:
    "Sapatos sociais, botas e tênis casuais masculinos. Numeração do 37 ao 44.",
  neighborhood: "Centro",
  neighborhood_slug: "centro",
  address: "Rua Floriano Peixoto, 140 - Centro",
  instagram: "@passofirmelapa",
  whatsapp: "5577999101107",
  is_verified: true,
  plan: "premium",
  business_hours: MALL_HOURS,
  payment_methods: ["pix", "credit_card", "debit_card", "cash"],
  installment_info: "Até 5x sem juros no cartão",
  has_delivery: true,
  has_pickup: true,
  delivery_fee_type: "fixed",
  delivery_fee: 5,
  followers_count: 132,
  created_at: "2026-05-20T12:00:00Z",
});

const peDeOuro = store({
  id: "store-12",
  name: "Pé de Ouro Sapataria",
  slug: "pe-de-ouro-sapataria",
  avatar_url: img("1603808033192-082d6919d3e1", 250),
  banner_url: img("1525966222134-fcfa99b8ae77", 1400),
  description:
    "Tênis e calçados femininos com preço de fábrica. Troca fácil em até 30 dias.",
  neighborhood: "Maravilha",
  neighborhood_slug: "maravilha",
  address: "Rua do Comércio, 56 - Maravilha",
  instagram: "@pedeourosapataria",
  whatsapp: "5577999101208",
  is_verified: false,
  plan: "free",
  business_hours: SHOP_HOURS,
  payment_methods: ["pix", "credit_card", "cash", "crediario"],
  installment_info: "Crediário próprio em até 4x",
  has_delivery: true,
  has_pickup: true,
  delivery_fee_type: "combine",
  delivery_fee: 0,
  followers_count: 47,
  created_at: "2026-09-12T12:00:00Z",
});

const conectaCell = store({
  id: "store-13",
  name: "Conecta Cell",
  slug: "conecta-cell",
  avatar_url: img("1598327105666-5b89351aff97", 250),
  banner_url: img("1585060544812-6b45742d762f", 1400),
  description:
    "Smartphones lacrados com nota fiscal, capinhas, películas e assistência em 1 hora.",
  neighborhood: "Centro",
  neighborhood_slug: "centro",
  address: "Av. Manoel Novaes, 233 - Centro",
  instagram: "@conectacelllapa",
  whatsapp: "5577999101309",
  is_verified: true,
  plan: "premium",
  business_hours: EVENING_HOURS,
  payment_methods: ["pix", "credit_card", "debit_card", "payment_link"],
  installment_info: "Até 10x sem juros no cartão",
  has_delivery: true,
  has_pickup: true,
  delivery_fee_type: "free",
  delivery_fee: 0,
  followers_count: 305,
  created_at: "2026-04-08T12:00:00Z",
});

const mundoCelular = store({
  id: "store-14",
  name: "Mundo do Celular",
  slug: "mundo-do-celular",
  avatar_url: img("1610945265064-0e34e5519bbf", 250),
  banner_url: img("1556656793-08538906a9f8", 1400),
  description:
    "Seminovos revisados com garantia de 90 dias, fones e acessórios com preço justo.",
  neighborhood: "João Paulo II",
  neighborhood_slug: "joao-paulo-ii",
  address: "Rua Principal, 890 - João Paulo II",
  instagram: "@mundodocelularlapa",
  whatsapp: "5577999101410",
  is_verified: false,
  plan: "free",
  business_hours: SHOP_HOURS,
  payment_methods: ["pix", "credit_card", "cash"],
  installment_info: "Até 6x no cartão com acréscimo",
  has_delivery: true,
  has_pickup: true,
  delivery_fee_type: "fixed",
  delivery_fee: 6,
  followers_count: 72,
  created_at: "2026-10-25T12:00:00Z",
});

const lapaInformatica = store({
  id: "store-15",
  name: "Lapa Informática",
  slug: "lapa-informatica",
  avatar_url: img("1496181133206-80ce9b88a853", 250),
  banner_url: img("1593640408182-31c70c8268f5", 1400),
  description:
    "Notebooks, monitores e periféricos. Montagem de PC gamer e suporte técnico na loja.",
  neighborhood: "Centro",
  neighborhood_slug: "centro",
  address: "Rua Siqueira Campos, 61 - Centro",
  instagram: "@lapainformatica",
  whatsapp: "5577999101511",
  is_verified: true,
  plan: "premium",
  business_hours: MALL_HOURS,
  payment_methods: ["pix", "credit_card", "debit_card", "payment_link", "boleto"],
  installment_info: "Até 12x sem juros no cartão",
  has_delivery: true,
  has_pickup: true,
  delivery_fee_type: "free",
  delivery_fee: 0,
  followers_count: 189,
  created_at: "2026-02-18T12:00:00Z",
});

const byteShop = store({
  id: "store-16",
  name: "Byte Shop Computadores",
  slug: "byte-shop-computadores",
  avatar_url: img("1587202372775-e229f172b9d7", 250),
  banner_url: img("1547082299-de196ea013d6", 1400),
  description:
    "Peças, teclados mecânicos e mouses gamer. Upgrade de SSD e memória com instalação inclusa.",
  neighborhood: "Amaralina",
  neighborhood_slug: "amaralina",
  address: "Av. Brasil, 1.120 - Amaralina",
  instagram: "@byteshoplapa",
  whatsapp: "5577999101612",
  is_verified: false,
  plan: "free",
  business_hours: EVENING_HOURS,
  payment_methods: ["pix", "credit_card", "debit_card"],
  installment_info: "Até 6x sem juros no cartão",
  has_delivery: true,
  has_pickup: true,
  delivery_fee_type: "fixed",
  delivery_fee: 7,
  followers_count: 39,
  created_at: "2026-11-08T12:00:00Z",
});

export const DEMO_STORES: StoreSummary[] = [
  farmaciaSaoFrancisco,
  drogariaBomJesus,
  forcaTotal,
  vidaFit,
  ouroDaLapa,
  brilhoPrata,
  passoFirme,
  peDeOuro,
  conectaCell,
  mundoCelular,
  lapaInformatica,
  byteShop,
];

/* ---------- Produtos ---------- */

const B = DEMO_CATEGORIES;

export const DEMO_PRODUCTS: ProductItem[] = [
  // Farmácia São Francisco
  product(farmaciaSaoFrancisco, {
    id: "prod-101",
    title: "Protetor Solar Facial FPS 60 Toque Seco",
    slug: "protetor-solar-facial-fps-60",
    description:
      "Textura leve, sem brilho e resistente ao suor. Indispensável no sol da Lapa.",
    price: 89.9,
    promotional_price: 69.9,
    image_url: img("1556228578-8c89e6adf883"),
    stock: 3,
    views_count: 388,
    clicks_whatsapp: 41,
    created_at: "2026-11-11T08:00:00Z",
    category: B.beleza,
    sub: SUB.skincare,
  }),
  product(farmaciaSaoFrancisco, {
    id: "prod-102",
    title: "Sérum Facial Vitamina C 30ml",
    slug: "serum-facial-vitamina-c-30ml",
    description:
      "Antioxidante com ácido hialurônico. Uniformiza o tom e ilumina a pele.",
    price: 119.9,
    promotional_price: 94.9,
    image_url: img("1620916566398-39f1143ab7be"),
    views_count: 251,
    clicks_whatsapp: 19,
    created_at: "2026-11-07T10:00:00Z",
    category: B.beleza,
    sub: SUB.skincare,
  }),
  product(farmaciaSaoFrancisco, {
    id: "prod-103",
    title: "Kit Hidratante Corporal Pele Sensível",
    slug: "kit-hidratante-corporal-pele-sensivel",
    description: "Loção 400ml + sabonete líquido sem fragrância, dermatologicamente testados.",
    price: 64.9,
    image_url: img("1612817288484-6f916006741a"),
    created_at: "2026-10-20T10:00:00Z",
    category: B.beleza,
    sub: SUB.skincare,
  }),

  // Drogaria Bom Jesus
  product(drogariaBomJesus, {
    id: "prod-104",
    title: "Creme Hidratante Facial Noturno 50g",
    slug: "creme-hidratante-facial-noturno",
    description: "Recupera a barreira da pele durante a noite. Para todos os tipos de pele.",
    price: 74.9,
    promotional_price: 59.9,
    image_url: img("1598440947619-2c35fc9aa908"),
    created_at: "2026-11-09T09:00:00Z",
    category: B.beleza,
    sub: SUB.skincare,
  }),
  product(drogariaBomJesus, {
    id: "prod-105",
    title: "Multivitamínico A-Z com 60 Cápsulas",
    slug: "multivitaminico-a-z-60-capsulas",
    description: "Vitaminas e minerais para o dia a dia. Uma cápsula por dia.",
    price: 39.9,
    image_url: img("1584308666744-24d5c474f2ae"),
    stock: 2,
    created_at: "2026-11-01T09:00:00Z",
    category: B.beleza,
    sub: SUB.suplementos,
  }),
  product(drogariaBomJesus, {
    id: "prod-106",
    title: "Shampoo Antiqueda Fortalecedor 300ml",
    slug: "shampoo-antiqueda-fortalecedor",
    description: "Com cafeína e biotina, reduz a quebra e fortalece os fios.",
    price: 49.9,
    promotional_price: 42.9,
    image_url: img("1608248597279-f99d160bfcbc"),
    created_at: "2026-10-18T09:00:00Z",
    category: B.beleza,
    sub: SUB.cabelos,
  }),

  // Força Total Suplementos
  product(forcaTotal, {
    id: "prod-107",
    title: "Whey Protein Concentrado 900g Baunilha",
    slug: "whey-protein-concentrado-900g",
    description: "24g de proteína por dose, fácil de misturar. Sabor baunilha cremosa.",
    price: 149.9,
    promotional_price: 119.9,
    image_url: img("1593095948071-474c5cc2989d"),
    gallery_urls: [img("1610725664285-7c57e6eeac3f")],
    views_count: 512,
    clicks_whatsapp: 58,
    created_at: "2026-11-10T07:30:00Z",
    category: B.beleza,
    sub: SUB.suplementos,
  }),
  product(forcaTotal, {
    id: "prod-108",
    title: "Creatina Monohidratada 300g",
    slug: "creatina-monohidratada-300g",
    description: "100% pura, sem sabor. Ganho de força e desempenho no treino.",
    price: 99.9,
    image_url: img("1610725664285-7c57e6eeac3f"),
    stock: 1,
    views_count: 433,
    clicks_whatsapp: 47,
    created_at: "2026-11-04T07:30:00Z",
    category: B.beleza,
    sub: SUB.suplementos,
  }),
  product(forcaTotal, {
    id: "prod-109",
    title: "Pré-Treino Energy 300g Frutas Vermelhas",
    slug: "pre-treino-energy-300g",
    description: "Cafeína, beta-alanina e arginina para treinos mais intensos.",
    price: 119.9,
    promotional_price: 99.9,
    image_url: img("1594381898411-846e7d193883"),
    created_at: "2026-10-22T07:30:00Z",
    category: B.beleza,
    sub: SUB.suplementos,
  }),

  // Vida Fit Nutrição
  product(vidaFit, {
    id: "prod-110",
    title: "Kit Barras de Proteína 12 Unidades",
    slug: "kit-barras-de-proteina-12",
    description: "Sabores sortidos, 15g de proteína por barra e sem açúcar adicionado.",
    price: 89.9,
    promotional_price: 74.9,
    image_url: img("1622484212850-eb596d769edc"),
    created_at: "2026-11-08T11:00:00Z",
    category: B.beleza,
    sub: SUB.suplementos,
  }),
  product(vidaFit, {
    id: "prod-111",
    title: "Par de Halteres Emborrachados 5kg",
    slug: "par-halteres-emborrachados-5kg",
    description: "Pegada antiderrapante, ideal para treino em casa. Retire na loja.",
    price: 159.9,
    image_url: img("1594737625785-a6cbdabd333c"),
    created_at: "2026-10-15T11:00:00Z",
    category: B.beleza,
    sub: SUB.suplementos,
  }),
  product(vidaFit, {
    id: "prod-112",
    title: "Ômega 3 1000mg com 120 Cápsulas",
    slug: "omega-3-1000mg-120-capsulas",
    description: "Óleo de peixe purificado, alta concentração de EPA e DHA.",
    price: 69.9,
    image_url: img("1584017911766-d451b3d0e843"),
    stock: 3,
    created_at: "2026-10-30T11:00:00Z",
    category: B.beleza,
    sub: SUB.suplementos,
  }),

  // Ouro da Lapa Joias
  product(ouroDaLapa, {
    id: "prod-113",
    title: "Par de Alianças Ouro 18k Tradicional 4mm",
    slug: "par-aliancas-ouro-18k-4mm",
    description: "Gravação interna gratuita e ajuste de numeração na loja.",
    price: 2890.0,
    promotional_price: 2590.0,
    image_url: img("1605100804763-247f67b3557e"),
    sizes: ["14", "16", "18", "20", "22"],
    colors: ["#D4AF37"],
    views_count: 302,
    clicks_whatsapp: 36,
    created_at: "2026-11-05T10:00:00Z",
    category: B.moda,
    sub: SUB.acessorios,
  }),
  product(ouroDaLapa, {
    id: "prod-114",
    title: "Colar Ponto de Luz Ouro 18k",
    slug: "colar-ponto-de-luz-ouro-18k",
    description: "Corrente veneziana 45cm com zircônia cravejada. Acompanha caixa.",
    price: 890.0,
    image_url: img("1599643478518-a784e5dc4c8f"),
    colors: ["#D4AF37", "#E8C4B8"],
    stock: 2,
    created_at: "2026-10-12T10:00:00Z",
    category: B.moda,
    sub: SUB.acessorios,
  }),
  product(ouroDaLapa, {
    id: "prod-115",
    title: "Pulseira Elos Português Ouro 18k",
    slug: "pulseira-elos-portugues-ouro-18k",
    description: "Elos maciços com fecho gaveta de segurança. 19cm.",
    price: 1490.0,
    promotional_price: 1290.0,
    image_url: img("1573408301185-9146fe634ad0"),
    created_at: "2026-11-11T10:00:00Z",
    category: B.moda,
    sub: SUB.acessorios,
  }),

  // Brilho Prata 925
  product(brilhoPrata, {
    id: "prod-116",
    title: "Brinco Argola Prata 925 Cravejada",
    slug: "brinco-argola-prata-925",
    description: "Argola média 2cm com zircônias. Antialérgica.",
    price: 129.9,
    promotional_price: 99.9,
    image_url: img("1535632066927-ab7c9ab60908"),
    colors: ["#C0C0C0", "#D4AF37"],
    created_at: "2026-11-10T14:00:00Z",
    category: B.moda,
    sub: SUB.acessorios,
  }),
  product(brilhoPrata, {
    id: "prod-117",
    title: "Colar Corrente Delicada Prata 925",
    slug: "colar-corrente-delicada-prata",
    description: "Corrente 40cm com extensor e pingente coração.",
    price: 149.9,
    image_url: img("1617038220319-276d3cfab638"),
    colors: ["#C0C0C0"],
    created_at: "2026-10-28T14:00:00Z",
    category: B.moda,
    sub: SUB.acessorios,
  }),
  product(brilhoPrata, {
    id: "prod-118",
    title: "Colar de Pérolas com Fecho Prata 925",
    slug: "colar-perolas-fecho-prata-925",
    description: "Pérolas cultivadas de 6mm, 42cm. Embalagem de presente inclusa.",
    price: 219.9,
    image_url: img("1515562141207-7a88fb7ce338"),
    stock: 3,
    created_at: "2026-11-02T14:00:00Z",
    category: B.moda,
    sub: SUB.acessorios,
  }),

  // Passo Firme Calçados
  product(passoFirme, {
    id: "prod-119",
    title: "Sapato Social Couro Legítimo Preto",
    slug: "sapato-social-couro-preto",
    description: "Solado de borracha antiderrapante e palmilha em gel.",
    price: 259.9,
    promotional_price: 219.9,
    image_url: img("1614252235316-8c857d38b5f4"),
    sizes: ["38", "39", "40", "41", "42", "43"],
    colors: ["#111827", "#7C4A2D"],
    gender: "Masculino",
    created_at: "2026-11-09T10:00:00Z",
    category: B.calcados,
    sub: SUB.sapatos,
  }),
  product(passoFirme, {
    id: "prod-120",
    title: "Bota Chelsea Camurça Caramelo",
    slug: "bota-chelsea-camurca-caramelo",
    description: "Elástico lateral e acabamento artesanal. Conforto o dia todo.",
    price: 299.9,
    image_url: img("1520639888713-7851133b1ed0"),
    sizes: ["39", "40", "41", "42"],
    gender: "Masculino",
    stock: 2,
    created_at: "2026-10-26T10:00:00Z",
    category: B.calcados,
    sub: SUB.sapatos,
  }),
  product(passoFirme, {
    id: "prod-121",
    title: "Sapatênis Casual Couro Marrom",
    slug: "sapatenis-casual-couro-marrom",
    description: "Leve e versátil, combina com calça jeans e bermuda.",
    price: 189.9,
    promotional_price: 159.9,
    image_url: img("1533867617858-e7b97e060509"),
    sizes: ["38", "39", "40", "41", "42", "43", "44"],
    gender: "Masculino",
    created_at: "2026-11-03T10:00:00Z",
    category: B.calcados,
    sub: SUB.sapatos,
  }),

  // Pé de Ouro Sapataria
  product(peDeOuro, {
    id: "prod-122",
    title: "Tênis Casual Branco Plataforma",
    slug: "tenis-casual-branco-plataforma",
    description: "Cabedal em material sintético premium, fácil de limpar.",
    price: 169.9,
    promotional_price: 139.9,
    image_url: img("1595950653106-6c9ebd614d3a"),
    sizes: ["34", "35", "36", "37", "38"],
    gender: "Feminino",
    created_at: "2026-11-11T09:00:00Z",
    category: B.calcados,
    sub: SUB.tenis,
  }),
  product(peDeOuro, {
    id: "prod-123",
    title: "Tênis Retrô Branco e Laranja",
    slug: "tenis-retro-branco-laranja",
    description: "Amortecimento em gel e cabedal em couro sintético. Troca fácil.",
    price: 229.9,
    image_url: img("1600185365926-3a2ce3cdb9eb"),
    sizes: ["34", "35", "36", "37", "38", "39"],
    gender: "Feminino",
    created_at: "2026-10-24T09:00:00Z",
    category: B.calcados,
    sub: SUB.tenis,
  }),
  product(peDeOuro, {
    id: "prod-124",
    title: "Tênis Corrida Leve Respirável",
    slug: "tenis-corrida-leve-respiravel",
    description: "Cabedal em tela respirável, ideal para caminhada na orla.",
    price: 199.9,
    promotional_price: 169.9,
    image_url: img("1491553895911-0055eca6402d"),
    sizes: ["35", "36", "37", "38", "39"],
    gender: "Unissex",
    stock: 3,
    created_at: "2026-11-06T09:00:00Z",
    category: B.calcados,
    sub: SUB.tenis,
  }),

  // Conecta Cell
  product(conectaCell, {
    id: "prod-125",
    title: "Smartphone 128GB 5G Tela 6,6\" Preto",
    slug: "smartphone-128gb-5g-preto",
    description: "Lacrado com nota fiscal e 1 ano de garantia. Câmera tripla de 50MP.",
    price: 1899.0,
    promotional_price: 1699.0,
    image_url: img("1598327105666-5b89351aff97"),
    colors: ["#111827", "#2563EB", "#E5E7EB"],
    views_count: 620,
    clicks_whatsapp: 71,
    created_at: "2026-11-10T09:00:00Z",
    category: B.eletronicos,
    sub: SUB.smartphones,
  }),
  product(conectaCell, {
    id: "prod-126",
    title: "Fone Bluetooth TWS com Estojo",
    slug: "fone-bluetooth-tws-estojo",
    description: "Até 24h de bateria com o estojo e cancelamento de ruído nas chamadas.",
    price: 159.9,
    promotional_price: 129.9,
    image_url: img("1606220588913-b3aacb4d2f46"),
    voltage: "Bivolt",
    created_at: "2026-11-04T09:00:00Z",
    category: B.eletronicos,
    sub: SUB.fones,
  }),
  product(conectaCell, {
    id: "prod-127",
    title: "Smartwatch Fitness Tela AMOLED",
    slug: "smartwatch-fitness-amoled",
    description: "Monitor cardíaco, notificações e mais de 100 modos esportivos.",
    price: 349.0,
    image_url: img("1579586337278-3befd40fd17a"),
    stock: 2,
    created_at: "2026-10-27T09:00:00Z",
    category: B.eletronicos,
    sub: SUB.smartphones,
  }),

  // Mundo do Celular
  product(mundoCelular, {
    id: "prod-128",
    title: "Smartphone Seminovo 256GB Revisado",
    slug: "smartphone-seminovo-256gb",
    description: "Bateria acima de 85%, sem marcas de uso e garantia de 90 dias.",
    price: 2499.0,
    promotional_price: 2199.0,
    image_url: img("1610945265064-0e34e5519bbf"),
    stock: 1,
    created_at: "2026-11-08T15:00:00Z",
    category: B.eletronicos,
    sub: SUB.smartphones,
  }),
  product(mundoCelular, {
    id: "prod-129",
    title: "Capinha Antiimpacto + Película 3D",
    slug: "capinha-antiimpacto-pelicula-3d",
    description: "Kit proteção completa. Aplicação da película grátis na loja.",
    price: 49.9,
    promotional_price: 39.9,
    image_url: img("1603313011101-320f26a4f6f6"),
    created_at: "2026-10-29T15:00:00Z",
    category: B.eletronicos,
    sub: SUB.capinhas,
  }),
  product(mundoCelular, {
    id: "prod-130",
    title: "Headphone Bluetooth Dobrável",
    slug: "headphone-bluetooth-dobravel",
    description: "Graves reforçados, microfone embutido e entrada P2.",
    price: 129.9,
    image_url: img("1583394838336-acd977736f90"),
    voltage: "Bivolt",
    created_at: "2026-10-19T15:00:00Z",
    category: B.eletronicos,
    sub: SUB.fones,
  }),

  // Lapa Informática
  product(lapaInformatica, {
    id: "prod-131",
    title: "Notebook 15,6\" Core i5 8GB SSD 512GB",
    slug: "notebook-15-core-i5-8gb-ssd-512",
    description: "Windows 11, teclado numérico e tela Full HD antirreflexo.",
    price: 3499.0,
    promotional_price: 3199.0,
    image_url: img("1496181133206-80ce9b88a853"),
    gallery_urls: [img("1525547719571-a2d4ac8945e2")],
    voltage: "Bivolt",
    views_count: 471,
    clicks_whatsapp: 52,
    created_at: "2026-11-09T08:00:00Z",
    category: B.eletronicos,
    sub: SUB.informatica,
  }),
  product(lapaInformatica, {
    id: "prod-132",
    title: "Monitor 24\" Full HD IPS 75Hz",
    slug: "monitor-24-full-hd-ips",
    description: "Bordas finas, HDMI e VGA. Ideal para home office.",
    price: 899.0,
    image_url: img("1547082299-de196ea013d6"),
    voltage: "Bivolt",
    stock: 3,
    created_at: "2026-10-31T08:00:00Z",
    category: B.eletronicos,
    sub: SUB.informatica,
  }),
  product(lapaInformatica, {
    id: "prod-133",
    title: "Notebook Ultrafino 14\" 16GB SSD 512GB",
    slug: "notebook-ultrafino-14-16gb",
    description: "Leve, bateria de até 12h e carregamento USB-C.",
    price: 5299.0,
    image_url: img("1517336714731-489689fd1ca8"),
    voltage: "Bivolt",
    created_at: "2026-10-16T08:00:00Z",
    category: B.eletronicos,
    sub: SUB.informatica,
  }),

  // Byte Shop Computadores
  product(byteShop, {
    id: "prod-134",
    title: "PC Gamer Ryzen 5 + RTX 16GB RAM",
    slug: "pc-gamer-ryzen-5-rtx",
    description: "Montado e testado na loja, com Windows instalado e 1 ano de garantia.",
    price: 5999.0,
    promotional_price: 5499.0,
    image_url: img("1587202372775-e229f172b9d7"),
    gallery_urls: [img("1593640408182-31c70c8268f5")],
    voltage: "Bivolt",
    stock: 1,
    views_count: 398,
    clicks_whatsapp: 44,
    created_at: "2026-11-10T16:00:00Z",
    category: B.eletronicos,
    sub: SUB.games,
  }),
  product(byteShop, {
    id: "prod-135",
    title: "Teclado Mecânico RGB Switch Blue",
    slug: "teclado-mecanico-rgb-switch-blue",
    description: "ABNT2, anti-ghosting e iluminação personalizável.",
    price: 249.9,
    promotional_price: 199.9,
    image_url: img("1587829741301-dc798b83add3"),
    created_at: "2026-11-05T16:00:00Z",
    category: B.eletronicos,
    sub: SUB.informatica,
  }),
  product(byteShop, {
    id: "prod-136",
    title: "Mouse Sem Fio Silencioso 1600 DPI",
    slug: "mouse-sem-fio-silencioso",
    description: "Clique silencioso, pilha inclusa e receptor nano USB.",
    price: 69.9,
    image_url: img("1527864550417-7fd91fc51a46"),
    created_at: "2026-10-21T16:00:00Z",
    category: B.eletronicos,
    sub: SUB.informatica,
  }),
];

/* ---------- Stories (lojas Premium) ---------- */

const now = () => new Date().toISOString();

export const DEMO_STORIES: StoreWithStories[] = [
  {
    store: farmaciaSaoFrancisco,
    hasUnseen: true,
    stories: [
      {
        id: "st-101",
        store_id: farmaciaSaoFrancisco.id,
        media_url: img("1556228578-8c89e6adf883", 900),
        caption: "Semana do protetor solar: até 22% OFF e entrega grátis no Centro! ☀️",
        product_title: "Protetor Solar Facial FPS 60 Toque Seco",
        product_price: 69.9,
        cta_url: "/farmacia-sao-francisco/protetor-solar-facial-fps-60",
        created_at: now(),
      },
    ],
  },
  {
    store: forcaTotal,
    hasUnseen: true,
    stories: [
      {
        id: "st-102",
        store_id: forcaTotal.id,
        media_url: img("1593095948071-474c5cc2989d", 900),
        caption: "Whey chegou com preço de lançamento. Corre que é por tempo limitado! 💪",
        product_title: "Whey Protein Concentrado 900g Baunilha",
        product_price: 119.9,
        cta_url: "/forca-total-suplementos/whey-protein-concentrado-900g",
        created_at: now(),
      },
    ],
  },
  {
    store: ouroDaLapa,
    hasUnseen: true,
    stories: [
      {
        id: "st-103",
        store_id: ouroDaLapa.id,
        media_url: img("1605100804763-247f67b3557e", 900),
        caption: "Alianças em ouro 18k com gravação grátis. Agende sua visita!",
        product_title: "Par de Alianças Ouro 18k Tradicional 4mm",
        product_price: 2590,
        cta_url: "/ouro-da-lapa-joias/par-aliancas-ouro-18k-4mm",
        created_at: now(),
      },
    ],
  },
  {
    store: conectaCell,
    hasUnseen: true,
    stories: [
      {
        id: "st-104",
        store_id: conectaCell.id,
        media_url: img("1598327105666-5b89351aff97", 900),
        caption: "Smartphone 5G em até 10x sem juros. Retire hoje no Centro.",
        product_title: "Smartphone 128GB 5G Tela 6,6\" Preto",
        product_price: 1699,
        cta_url: "/conecta-cell/smartphone-128gb-5g-preto",
        created_at: now(),
      },
    ],
  },
];
