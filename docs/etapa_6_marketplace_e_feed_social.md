# Etapa 6: O Marketplace Público, Feed Social Mobile & Vitrine do Lojista

## Contexto e Regras de Negócio
Esta etapa conecta todos os dados cadastrados pelos lojistas de Bom Jesus da Lapa aos componentes visuais da Etapa 2, criando a experiência híbrida:
* **No Celular (Mobile):** Feed Social com rolagem infinita estilo Instagram (com abas **Explorar** e **Seguindo**) + barra de Stories de 24h no topo.
* **No Computador (Desktop) e na Busca:** Vitrine estilo Mercado Livre com banners, carrossel de categorias, ofertas em destaque e filtros laterais profundos.
* **No Link Individual (`/[storeSlug]`):** O catálogo próprio do lojista para ele usar na bio do Instagram dele.

---

## Tarefas desta Etapa para o Agente (Antigravity)

### 1. Algoritmo de Busca do Feed e Paginação (`app/actions/feed.ts`)
* Criar função `getMarketplaceFeed({ page, tab, userId, categorySlug, neighborhoodSlug })`:
  * Filtra apenas produtos com `is_active = true` trazendo os dados da loja (`stores`) e bairro (`neighborhoods`).
  * Na aba **`seguindo`**: filtra apenas produtos de lojas presentes em `public.followed_stores` para o `userId` logado.
  * Na aba **`explorar`**: prioriza produtos de lojas `plan_tier = 'premium'` e lançamentos recentes, intercalando lojas diferentes para que uma única loja não domine 10 posts seguidos no feed.

### 2. Home Híbrida (`app/(marketplace)/page.tsx`)
* **Topo Comum:** `<MarketplaceHeader />` + `<StoriesBar />` (exibindo stories ativos de lojas Premium) + `<CategoryPills />`.
* **Visão Mobile (`md:hidden`):**
  * Seletor de abas fixo: **"Explorar Lapa"** | **"Seguindo"**.
  * Lista vertical de `<ProductFeedPost />` com paginação automática ao rolar até o fim da tela (`IntersectionObserver`).
* **Visão Desktop (`hidden md:block`):**
  * `<PromoBanner />` no topo.
  * Seção **"🔥 Ofertas do Dia em Lapa"** (produtos com `promotional_price` ativo).
  * Seção **"⭐ Lojas em Destaque"** (cards das lojas verificadas/premium com status `<StoreStatusBadge />`).
  * Seção **"📦 Novidades no Comércio Local"** em grid de 4 a 5 colunas (`<ProductCardGrid />`).

### 3. Página de Explorar e Filtros Avançados (`app/(marketplace)/explorar/page.tsx`)
* Página de busca global (`/explorar?q=...&categoria=...&bairro=...&tamanho=...&precoMax=...`).
* Barra de filtros (drawer no mobile, sidebar no desktop) permitindo filtrar por:
  * **Categoria e Subcategoria**
  * **Bairro da Loja em Lapa**
  * **Apenas Lojas Abertas Agora** (usando `getStoreOpenStatus` em memória)
  * **Apenas Produtos em Promoção**
  * **Filtros Dinâmicos da Categoria:** Tamanho/Numeração, Gênero, Voltagem e Condição (`Novo` / `Seminovo`).
  * **Forma de Pagamento Aceita pela Loja** (ex: *Aceita Cartão / Crediário*).

### 4. Vitrine Individual do Lojista (`app/[storeSlug]/page.tsx`)
* **SSR + `generateMetadata`:** Título e OpenGraph dinâmicos para ficar perfeito quando compartilhado no WhatsApp/Instagram.
* **Cabeçalho Completo da Loja:** Banner, Avatar, Nome + Selo Verificado, Bairro + Endereço em texto, `<StoreStatusBadge />` (mostrando se está aberta agora + horários especiais), botão **"Seguir Loja"** e contadores.
* **Barra de Busca Interna da Loja** + Pílulas com as categorias internas da loja (`store_categories`).
* **Grid de Produtos da Loja** (`grid-cols-2 md:grid-cols-4 gap-4`).
* **Rodapé da Loja:** Exibe claramente todas as **Formas de Pagamento Aceitas** (`accepted_payments`), regras de parcelamento (`installment_info`), opções de entrega e horários de funcionamento completos.

### 5. Página de Detalhe do Produto e SEO Local (`app/[storeSlug]/[productSlug]/page.tsx`)
* Incrementa silenciosamente `views_count` do produto.
* Galeria de fotos, preço `De/Por`, seletor de tamanho (se o produto tiver `available_sizes`), informações de pagamento e entrega da loja, e `Sticky Bottom Bar` com botões `"Adicionar à Sacola"` e `"Comprar Agora"`.

---

## Prompt de Comando para o Antigravity
> "Leia `@docs/etapa-6-marketplace-e-feed-social.md` e construa a Home Híbrida (Feed Social Mobile + Grid Desktop), a página `/explorar` com filtros avançados, a vitrine individual `/[storeSlug]` e a página de produto `/[storeSlug]/[productSlug]`."