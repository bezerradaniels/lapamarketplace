# Etapa 2: Design System & Componentes Reaproveitáveis

## Direcionamento Visual ("Soft Modern App-like")
Interface mobile-first adaptada para desktop, inspirada em apps modernos de e-commerce:
* **Superfícies:** Fundo geral `bg-slate-50` (`#F8FAFC`), containers principais em `bg-white` e fundos de fotos de produto/inputs sempre em cinza suave `bg-slate-100/80` (`#F1F5F9`).
* **Botões Primários e Destaques:** Alto contraste com `bg-slate-900 text-white` (`#0F172A`), formato pílula `rounded-full`.
* **Ações de WhatsApp:** `bg-emerald-600 hover:bg-emerald-700 text-white rounded-full`.
* **Badges de Oferta / Notificação:** `bg-rose-500 text-white rounded-full`.
* **Geometria:** Cards e banners `rounded-3xl`, fotos de produtos `rounded-2xl`, botões e inputs `rounded-full`. Sem bordas pesadas (usar `border border-slate-100` e sombras difusas suaves).

---

## Componentes para Construir (`components/ui/` e `components/layout/`)

### 1. Primitivos de UI (`components/ui/`)
* **`Button.tsx`:** Variantes `primary` (`bg-slate-900 text-white`), `secondary` (`bg-slate-100 text-slate-800`), `whatsapp` (`bg-emerald-600 text-white`), `outline` (`border border-slate-200 text-slate-800`) e `ghost`. Suporte a tamanhos (`sm`, `md`, `lg`), ícone à esquerda/direita e spinner `isLoading`.
* **`Input.tsx` e `Select.tsx`:** Fundo `bg-slate-100/80 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all`, label superior e mensagem de erro.
* **`Badge.tsx`:** Variantes para desconto (`-20% OFF` em `bg-rose-500 text-white`), verificado (`bg-blue-50 text-blue-700`), condição e métodos de pagamento.
* **`StoreStatusBadge.tsx`:** Consome `getStoreOpenStatus` da Etapa 1 e renderiza uma pílula elegante com bolinha pulsante verde (`Aberta agora`), amarela (`Almoço / Fecha logo`) ou cinza/vermelha (`Fechada`), mais modal/tooltip mostrando os horários da semana e horários especiais.
* **`CategoryPills.tsx`:** Carrossel horizontal (`overflow-x-auto no-scrollbar`) renderizando as categorias globais com ícones do `lucide-react` e estado ativo em `bg-slate-900 text-white`.
* **`PromoBanner.tsx`:** Card horizontal `rounded-3xl p-6` para destaques sazonais da cidade.
* **`SectionContainer.tsx`:** Cabeçalho de seção com título em `text-lg font-extrabold text-slate-900`, subtítulo opcional e link `"Ver tudo ->"` à direita.

### 2. Cartões de Negócio (`components/marketplace/`)
* **`ProductCardGrid.tsx` (Estilo Mercado Livre / Catálogo):**
  * Imagem em `aspect-square rounded-2xl bg-slate-100 relative overflow-hidden`.
  * Botão de Favoritar (`Heart` no canto superior direito da foto) e Badge de `% OFF` (calculado automaticamente se `promotional_price < price`) no canto superior esquerdo.
  * Nome da loja + bairro em texto pequeno (`text-[11px] text-slate-400`), título do produto (`text-sm font-semibold text-slate-800 line-clamp-1`), preço `De/Por` e botão circular `+` (`w-8 h-8 rounded-full bg-slate-900 text-white`) para adicionar direto à sacola.
* **`ProductFeedPost.tsx` (Estilo Instagram para Mobile):**
  * **Header do Post:** Avatar da loja, Nome da Loja + Selo Verificado, Bairro + `<StoreStatusBadge compact />` e botão `"Ver Loja"`.
  * **Mídia:** Carrossel horizontal (`snap-x snap-mandatory`) com a `image_url` principal e `gallery_urls` em proporção `aspect-[4/5] rounded-3xl bg-slate-100`.
  * **Footer de Conversão:** Botão de curtir/favoritar peça, Preço em destaque (`text-xl font-extrabold text-slate-900`), tamanhos disponíveis em pílulas, descrição curta e dois botões lado a lado: `"Por na Sacola"` (`secondary`) e `"Pedir no Zap"` (`primary` ou `whatsapp`).
* **`StoriesBar.tsx`:** Barra horizontal de avatares circulares com anel colorido gradiente para lojas Premium que possuem stories ativos nas últimas 24h (`store_stories`), abrindo um modal fullscreen ao clicar.

### 3. Navegação Global (`components/layout/`)
* **`MarketplaceHeader.tsx`:** Topo fixo com Logo, seletor rápido de Bairro/Cidade, Barra de Pesquisa global (`rounded-full bg-slate-100`), botão de Favoritos/Conta e ícone da Sacola com badge contador numérico.
* **`Footer.tsx`:** Rodapé completo exibindo bandeiras das formas de pagamento aceitas no marketplace, links rápidos de categorias, bairros de Bom Jesus da Lapa (ótimo para SEO local) e CTA `"Tem uma loja em Lapa? Crie seu catálogo grátis"`.

