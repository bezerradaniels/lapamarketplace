# Etapa 5: Painel do Lojista (`/painel`) & Super Admin do Portal (`/master`)

## Contexto e Regras de Negócio
Esta etapa entrega os dois centros de controle da plataforma:
1. **Painel do Lojista (`/painel`):** Onde o comerciante de Bom Jesus da Lapa cadastra produtos com filtros dinâmicos, gerencia horários especiais, posta Stories (se for Plano Premium) e acompanha visualizações e cliques no WhatsApp.
2. **Painel Master do Portal (`/master`):** Exclusivo para o administrador geral (`role = 'admin'`) gerenciar Bairros, Categorias Globais, Subcategorias, ativar o Selo Verificado e alterar o plano das lojas (`free` vs `premium`).

---

## Parte A: Painel do Lojista (`app/painel/`)

### 1. Layout e Dashboard (`app/painel/layout.tsx` e `page.tsx`)
* Header/Sidebar com nome da loja, badge do plano atual (`Gratuito` ou `Premium ⭐`), botão `"Copiar Link do Catálogo"` e botão `"Ver Minha Loja"`.
* **Cards de Métricas:** Total de Produtos Ativos, Total de Visualizações (`SUM(views_count)`), Total de Cliques no WhatsApp (`SUM(clicks_whatsapp)`) e Total de Seguidores da Loja.
* **Atalho de Stories (Plano Premium):** Se `store.plan_tier === 'premium'`, exibe botão para postar foto vertical que dura 24h no topo da Home do Marketplace, podendo vincular um produto específico. Se for `free`, exibe um card convidando para fazer upgrade para o Premium.

### 2. Gestão de Produtos com Filtros Condicionais (`/painel/produtos` e `/novo`)
* **Listagem (`/painel/produtos/page.tsx`):** Lista de produtos com miniatura, preço normal/promocional, contadores de views/cliques e um **Switch Instantâneo (`is_active`)** para pausar/ativar um produto esgotado sem deletá-lo (preservando o SEO).
* **Formulário Inteligente (`/painel/produtos/novo/page.tsx` e `[id]/editar/page.tsx`):**
  * Upload de foto principal + até 3 fotos extras (`gallery_urls`) para o bucket `lapa-imagens`.
  * Seleção de **Categoria Principal** e **Subcategoria** (puxando de `public.global_categories`).
  * **Renderização Condicional de Filtros (Crucial):** Ao selecionar a categoria principal, ler o JSON `filter_config` daquela categoria:
    * Se `has_gender === true`: exibir seletor `Feminino | Masculino | Unissex | Infantil`.
    * Se `has_size === true`: exibir grade de pílulas clicáveis com as `size_options` da categoria (ex: `P, M, G, GG` para roupas ou `34 ao 44` para calçados).
    * Se `has_voltage === true`: exibir seletor `220V | 110V | Bivolt`.
  * Campos de Preço (`price`) e Preço Promocional opcional (`promotional_price` — se preenchido, mostra preview de quantos `% OFF` aparecerão no card).

### 3. Configurações da Loja e Horários (`/painel/configuracoes/page.tsx`)
* Abas para editar:
  1. **Dados Gerais & Endereço:** Nome, Logo, Banner, WhatsApp, Instagram, Bairro e Endereço em texto.
  2. **Pagamentos & Entrega:** Atualizar checkboxes de `accepted_payments`, `installment_info`, opções de entrega e taxa.
  3. **Horário de Funcionamento & Horários Especiais:** Editor simples para Segunda a Sexta, Sábado e Domingo (incluindo horário de almoço) + lista dinâmica para adicionar **Horários Especiais** por data (ex: `"06/08/2026 - Romaria do Bom Jesus - Aberto das 07:00 às 21:00"` ou `"Feriado - Fechado"`).

---

## Parte B: Super Admin do Portal (`app/master/`)

### 1. Gestão de Lojas e Planos (`/master/lojas/page.tsx`)
* Tabela listando todas as lojas cadastradas em Bom Jesus da Lapa.
* Botões rápidos (Switches) para alterar `plan_tier` entre `'free'` e `'premium'` e ativar/desativar o selo `is_verified` (`Loja Verificada`).

### 2. Gestão de Categorias, Subcategorias e Bairros (`/master/taxonomia/page.tsx`)
* Interface para criar, editar, ordenar (`order_index`) e ativar/desativar **Categorias Globais** e **Subcategorias**, incluindo checkboxes para ligar `has_gender`, `has_size`, `has_voltage` e editar a lista `size_options`.
* Interface para adicionar, editar ou ocultar **Bairros** em `public.neighborhoods`.

---

## Prompt de Comando para o Antigravity
> "Leia `@docs/etapa-5-painel-lojista-e-master.md` e implemente o Painel do Lojista (`/painel`) com formulário de produtos de filtros dinâmicos e editor de horários especiais, além do Painel Super Admin (`/master`) para gestão de lojas, planos, categorias e bairros."

