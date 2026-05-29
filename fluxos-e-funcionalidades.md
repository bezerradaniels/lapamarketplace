# Fluxos, Papéis e Funcionalidades — Zapable

> Este documento define os papéis do sistema, os fluxos de cada usuário e as
> funcionalidades esperadas em cada área. Serve como base para o planejamento
> técnico (banco de dados, rotas, componentes) e deve ser lido junto com o
> `CLAUDE.md`.

**Última atualização:** 22 de abril de 2026

---

## 1. Papéis do sistema

O sistema tem quatro tipos de usuário, com escopos completamente distintos.

### 1.1 Admin da plataforma (`role: platform_admin`)

Acessa o **Painel Admin** (rota interna, não indexada, não listada publicamente).
Pode haver múltiplos admins (equipe interna). Gerenciados por convite.

**Responsabilidades:**
- Visualizar e gerenciar todas as lojas cadastradas
- Suspender, reativar ou excluir lojas
- Visualizar métricas gerais da plataforma (lojas ativas, MRR, churn)
- Gerenciar planos e limites (via `plan_features`)
- Gerenciar coupons de assinatura (via Stripe Dashboard ou painel interno)
- Emitir suporte avançado (impersonate lojista para diagnóstico)
- Convidar e remover outros admins da plataforma
- Acessar log de eventos de billing (`billing_events`)

**O que NÃO faz:**
- Não acessa dados de pedidos ou clientes individuais de cada loja (privacidade)
- Não gerencia produtos de nenhuma loja

---

### 1.2 Lojista / Owner (`role: owner`)

Acessa o **Dashboard da Loja**. Cada conta é vinculada a uma única loja
(1 conta = 1 loja). É o único que tem controle total sobre a loja.

**Responsabilidades:**
- Configurar a loja (nome, slug, logo, banner, cores, WhatsApp)
- Gerenciar produtos (criar, editar, arquivar, categorizar)
- Visualizar e gerenciar todos os pedidos da loja
- Visualizar e gerenciar todos os clientes da loja
- Adicionar, editar e remover vendedores
- Personalizar o catálogo público (tema, layout, informações da loja)
- Gerenciar sua assinatura (upgrade, downgrade, cancelamento, faturas)
- Configurar coupons de desconto para clientes (cupons de loja, independentes do Stripe)
- Ver analytics da loja (visitas, pedidos, receita)
- Acessar suporte

**O que NÃO faz:**
- Não acessa outras lojas
- Não acessa o Painel Admin

---

### 1.3 Vendedor (`role: seller`)

Acessa o **Dashboard da Loja** com visão restrita. É criado e vinculado
pelo lojista. Cada vendedor pertence a uma única loja.

**Responsabilidades:**
- Ver e gerenciar **apenas os pedidos atribuídos a ele**
- Atualizar status dos pedidos atribuídos
- Ver o perfil dos clientes vinculados aos seus pedidos

**O que NÃO faz:**
- Não vê pedidos de outros vendedores
- Não vê pedidos não atribuídos
- Não gerencia produtos
- Não acessa configurações da loja
- Não acessa billing
- Não acessa analytics
- Não adiciona ou remove outros vendedores

---

### 1.4 Cliente final (sem conta)

Acessa o **Catálogo Público** (`{slug}.zapable.com.br`). Não cria conta.
A sessão é mantida apenas no lado do cliente (carrinho em memória / localStorage).

**Pode fazer:**
- Navegar pelos produtos do catálogo
- Filtrar por categoria
- Ver detalhe de produto
- Adicionar ao carrinho
- Fazer checkout com nome, telefone e e-mail
- Receber confirmação do pedido com código
- Abrir o WhatsApp com o resumo do pedido pré-formatado

**Não pode:**
- Criar conta
- Acompanhar histórico de pedidos (acessa pelo código de confirmação)
- Acessar o dashboard de qualquer loja

---

## 2. Fluxos de cadastro e autenticação

### 2.1 Cadastro de Admin da plataforma

```
Convite por e-mail (enviado por outro admin)
  → Link de convite com token assinado
  → Tela de criação de senha
  → Acesso ao Painel Admin
```

- Não existe cadastro público para admin.
- O primeiro admin é criado via seed/script manual no Supabase.
- Admins subsequentes são convidados pelo painel.

---

### 2.2 Cadastro de Lojista (Owner)

```
Landing page → CTA "Criar minha loja"
  → Tela de cadastro: nome, e-mail, senha
  → Verificação de e-mail (Supabase Auth)
  → Onboarding obrigatório (ver seção 2.3)
  → Dashboard da loja (com trial ativo)
```

Regras:
- 1 e-mail = 1 conta = 1 loja.
- O trial de 14 dias começa **após a conclusão do onboarding**, não no cadastro.
- Enquanto o onboarding não está completo, o usuário fica preso na tela de onboarding.

---

### 2.3 Onboarding do Lojista (obrigatório)

O lojista não acessa o dashboard completo antes de concluir as etapas:

```
Passo 1 — Dados da loja
  - Nome da loja (obrigatório)
  - Slug/URL da loja (gerado automaticamente a partir do nome, editável)
  - Número de WhatsApp com DDD (obrigatório, formato +55)
  - Segmento/categoria da loja (dropdown, opcional)

Passo 2 — Escolha do plano
  - Exibe os 3 planos (Básico / Pro / Premium) com preços e limites
  - Botão "Iniciar trial de 14 dias grátis" nos 3 planos (Básico, Pro e Premium)
  - Redireciona para Stripe Checkout
  - Ao voltar do Stripe com sucesso → continua o onboarding

Passo 3 — Adicionar o primeiro produto
  - Formulário simplificado: nome, preço, foto (opcional), categoria (opcional)
  - Obrigatório adicionar pelo menos 1 produto para concluir
  - Botão "Pular por agora" NÃO existe — é requisito para publicar o catálogo

Passo 4 — Conclusão
  - Exibe a URL do catálogo público (`{slug}.zapable.com.br`)
  - Botão "Ver meu catálogo" e "Ir para o dashboard"
  - Trial começa a contar a partir deste momento
```

> **Todos os planos oferecem 14 dias de trial sem cartão**, incluindo o Básico.
> Ao fim do trial sem pagamento, o catálogo é suspenso até o lojista assinar.

---

### 2.4 Login de Lojista / Vendedor

```
Tela de login unificada
  → Autenticação via Supabase Auth (e-mail + senha)
  → Verifica role na tabela store_members
    → role = owner  → Dashboard completo
    → role = seller → Dashboard restrito (só pedidos atribuídos)
  → Se onboarding não foi concluído → redireciona para onboarding
  → Se assinatura suspensa → banner de aviso, acesso limitado ao billing
```

- Não há login social (Google, etc.) no MVP.
- "Esqueci minha senha" via Supabase Auth (e-mail de reset).

---

### 2.5 Cadastro de Vendedor

O vendedor **não se cadastra sozinho**. O fluxo é:

```
Lojista acessa Dashboard → Configurações → Vendedores → "Convidar vendedor"
  → Informa nome e e-mail do vendedor
  → Sistema envia e-mail de convite com link assinado
  → Vendedor clica no link → tela de criação de senha
  → Conta criada com role = seller, vinculada à loja do lojista
  → Vendedor acessa o dashboard restrito
```

Regras:
- O vendedor só existe no contexto da loja que o convidou.
- Um e-mail não pode ser vendedor de mais de uma loja no MVP.
- O lojista pode remover um vendedor a qualquer momento.
- Limite de vendedores por plano é verificado antes de enviar o convite.

---

## 3. Áreas do sistema e funcionalidades

### 3.1 Painel Admin (`/admin/*`)

Rota protegida, acessível apenas por `platform_admin`. Não aparece no sitemap público.

| Seção | Funcionalidades |
|---|---|
| **Visão geral** | Total de lojas, lojas ativas, MRR estimado, novos cadastros (gráfico) |
| **Lojas** | Listar todas as lojas, buscar por nome/slug/e-mail, ver detalhes, suspender, reativar, excluir |
| **Planos** | Ver distribuição de lojas por plano; editar limites de `plan_features` |
| **Billing** | Log de eventos Stripe (`billing_events`), status de pagamentos por loja |
| **Admins** | Listar admins da plataforma, convidar novo admin, revogar acesso |
| **Suporte** | Ver mensagens abertas no suporte de todas as lojas |

---

### 3.2 Dashboard Lojista (`/(dashboard)/*`)

Acessível por `owner` (completo) e `seller` (restrito — ver seção 3.3).

#### Início (Home)
- Resumo do dia: pedidos novos, receita do período, clientes novos
- Atalhos rápidos: novo produto, ver pedidos, compartilhar catálogo
- Banner de trial (se ativo) com contador de dias restantes
- Alerta de assinatura suspensa / pagamento pendente (se aplicável)

#### Pedidos
- Cards de resumo no topo: pedidos aguardando envio, aguardando pagamento, gráfico de performance de vendas por período
- Lista de todos os pedidos da loja (owner) ou pedidos atribuídos (seller)
- Filtros: status, data, vendedor atribuído, busca por nome/código/produto
- Detalhe do pedido: itens, cliente, status, histórico de mudanças, vendedor responsável
- Ações: mudar status (novo → em atendimento → concluído → cancelado), atribuir a vendedor, abrir WhatsApp do cliente
- **Criação manual de pedido** ("Novo pedido"): selecionar cliente cadastrado ou criar novo cliente, selecionar vendedor responsável, adicionar produtos — útil para pedidos recebidos por telefone ou WhatsApp direto

#### Produtos
- Cards de alerta no topo: estoque mínimo, fora de estoque, sem foto, sem preço, com vendas, sem vendas, sem categoria
- Lista de produtos com foto, nome, código de barras/SKU, data de atualização, preço, estoque
- Filtros: busca por título/código de barras/SKU, categoria, subcategoria
- **Botão "Gerar PDF"** do catálogo (Pro/Premium)
- **Cadastro de produto** (modal) — campos básicos:
  - Título (até 125 caracteres)
  - Descrição com rich text (bold, itálico, alinhamento, listas) — até 10.000 caracteres
  - Botão "Gerar descrição com IA" (Pro/Premium)
  - Fotos (upload múltiplo, máximo 8 imagens, drag-and-drop)
  - Preço de venda
- **Edição detalhada do produto** — organizada em 4 abas:
  - **Informações Gerais**: título, descrição (com IA), categoria, subcategoria, código de barras (EAN/GTIN), SKU interno (com geração automática), especificações (condição: novo/usado, unidade de venda, recorrência de compra, marca), botão "Analisar produto" com IA competitiva (Pro/Premium)
  - **Estoque e variações**: toggle "Este produto possui variações?", estoque total, estoque reservado vs. disponível, alerta de estoque mínimo configurável
  - **Fotos**: galeria principal (até 8 fotos), reordenação por drag-and-drop, botão "Ver no meu catálogo"
  - **Preço**: preço de venda, preço de custo, margem de lucro calculada automaticamente, análise competitiva via IA (requer código de barras)
- Arquivar e excluir produto
- Botão "Ver no meu catálogo" fixo no rodapé da edição

#### Clientes
- Cards de filtros inteligentes no topo: clientes com recompra em atraso, com aniversário esta semana, com possível recompra, com compras complementares
- Lista de clientes com busca, filtro por tag e por vendedor responsável
- Ações rápidas na linha: abrir WhatsApp, enviar e-mail, ver pedidos, editar, excluir
- **Cadastro/edição de cliente** — campos:
  - Foto do cliente
  - Nome (obrigatório), WhatsApp com DDD +55 (obrigatório), telefone secundário (opcional)
  - CPF ou CNPJ (opcional), aniversário (DD/MM)
  - E-mail, site, links de redes sociais (Instagram, Facebook, etc.)
  - Vendedor responsável (vinculado ao cliente, não só ao pedido)
  - Tags (categorização livre, multi-valor)
  - Categorias e produtos de interesse (vinculação a categorias/produtos do catálogo)
  - Perfil e observações (rich text) + botão "Gerar Perfil" com IA (Pro/Premium)
- **Criação manual de cliente** também disponível na tela de Novo Pedido

#### Vendedores
- Listar vendedores ativos com seus pedidos vinculados
- Convidar novo vendedor por e-mail (limitado por plano)
- Remover vendedor (acesso revogado imediatamente)
- Ver pedidos atribuídos a cada vendedor

#### Catálogo (personalização)
A área de personalização do catálogo é dividida em subseções acessadas por menu lateral interno:

**Informações Gerais**
- Nome da loja, CNPJ (para exibição), slogan (+ IA), texto "Sobre nós" (+ IA)
- Indicação de restrição de idade (+18): sim/não
- Idioma do catálogo (pt-BR — único no MVP)
- Moeda (BRL — único no MVP)
- Mostrar produtos fora de estoque no catálogo: sim/não
- Ordem de exibição dos produtos (alfabética A-Z, por preço, por cadastro, etc.)
- Pré-visualização ao vivo (desktop e mobile) no lado direito da tela

**Logo, banner e cores**
- Upload do logo (512×512px recomendado)
- Upload do banner do catálogo
- Paleta de cor primária (seletor de cor pré-definidas + custom)

**WhatsApp e contatos**
- Número de WhatsApp para receber pedidos (+55, obrigatório)
- Telefone de contato visível no catálogo
- E-mail de contato visível no catálogo
- Endereço da loja (CEP, logradouro, número, bairro, cidade, estado) — exibe mapa no catálogo

**Pedidos e carrinho**
- Ativar/desativar carrinho de compras (quando desativado, só botão direto para WhatsApp)
- Dados obrigatórios no checkout: solicitar forma de entrega, solicitar CPF/CNPJ, solicitar forma de pagamento
- Instruções de pagamento: título e mensagem exibidos na confirmação do pedido
- Ativar/desativar botão "Pedir via WhatsApp" direto no produto

**Métodos de pagamento** *(informativo — o lojista gerencia o pagamento diretamente com o cliente)*
- Checkboxes para exibir no catálogo quais métodos são aceitos: Dinheiro, Transferência, Cartão de crédito, Cartão de débito, PIX, Boleto, Link de pagamento

**Métodos de entrega**
- Formas de entrega oferecidas: Entrega em domicílio, Retirada na loja, Serviço de quarto, Entrega digital
- Campo de texto livre: informações especiais sobre entrega (ex.: "Frete grátis acima de R$200")
- Configuração de frete: "Combinar via WhatsApp" (único modo no MVP)

**Categorias**
- Criar, editar, reordenar e excluir categorias
- Criar, editar e excluir subcategorias vinculadas a cada categoria
- Visualização de como as categorias aparecem no catálogo público

**Links sociais**
- Instagram, X (Twitter), Facebook, YouTube, Kwai, TikTok
- Exibidos na página "Sobre nós" do catálogo

**Site do catálogo**
- Visualizar e editar slug da URL (`{slug}.zapable.com.br`)
- Aviso de que alterar o slug quebra links já compartilhados

**Código QR**
- Gerar e baixar QR code do catálogo

**Avançado**
- Configurações extras (a definir conforme necessidade)

#### Analytics
- Visitas ao catálogo (pageviews por dia)
- Pedidos por período
- Produtos mais visualizados / mais pedidos
- Origem dos pedidos (MVP: dados básicos do Supabase; sem GA)

#### Billing
- Plano atual, data de renovação, status da assinatura
- Botão "Gerenciar assinatura" → Stripe Customer Portal
- Histórico de faturas com download do PDF/NFSe
- Upgrade / downgrade de plano
- Alerta de downgrade quando limites seriam excedidos

#### Suporte
- Chat/inbox simples com a equipe da plataforma
- Histórico de mensagens

#### Configurações da loja
- Dados da loja (nome, slug, WhatsApp, segmento)
- Conta do lojista (nome, e-mail, senha)
- Zona de perigo: excluir loja / encerrar conta

---

### 3.3 Dashboard Vendedor (visão restrita)

O vendedor acessa o mesmo front-end do lojista, mas as rotas e dados são filtrados.

| Rota | Acesso do Vendedor |
|---|---|
| `/` (Home) | ✓ Resumo limitado (só seus pedidos) |
| `/orders` | ✓ Apenas pedidos atribuídos a ele |
| `/orders/[id]` | ✓ Apenas se o pedido for dele |
| `/products` | ✗ Redirecionado |
| `/customers` | ✓ Apenas clientes dos seus pedidos |
| `/sellers` | ✗ Redirecionado |
| `/catalog` | ✗ Redirecionado |
| `/analytics` | ✗ Redirecionado |
| `/billing` | ✗ Redirecionado |
| `/support` | ✓ Pode abrir chamados |
| `/settings` | ✓ Apenas dados pessoais (nome, senha) |

---

### 3.4 Catálogo Público (`{slug}.zapable.com.br/*`)

Sem autenticação. Resolvido client-side pelo subdomínio.

| Rota | Página |
|---|---|
| `/` | Home: header, banner, seção de ofertas especiais, busca, filtros de categoria, grid de produtos |
| `/product/[slug]` | Detalhe do produto: galeria, info, preço, quantidade, estoque, botão WhatsApp direto + carrinho |
| `/checkout` | Checkout unificado: dados do cliente, resumo do pedido, cupom, observação |
| `/order/[code]` | Confirmação: código do pedido, resumo, instruções de pagamento, botão WhatsApp |
| `/about` | Sobre a loja: texto, contato, endereço + mapa, redes sociais |
| `/unavailable` | Loja suspensa ou sem assinatura ativa |

#### Anatomia da Home do catálogo

```
Header
  └── Logo | Menu (Info, Sobre nós, Compartilhar) | Ícone de busca | Sacolinha (contador)

Banner
  └── Imagem full-width configurada pelo lojista

Seção "Ofertas Especiais" (se configurada)
  └── Até 4 produtos em destaque com ribbon de desconto
  └── Ordenação horizontal em scroll

Barra de busca + ordenação
  └── Campo de busca por texto
  └── Seletor de ordenação (A-Z, menor preço, etc.)

Filtros de categoria
  └── Chips horizontais: Todos | [Categoria 1] | [Categoria 2] | ...
  └── Cada categoria pode ter subcategorias em dropdown

Grid de produtos
  └── Desktop: 4 colunas | Mobile: 2 colunas
  └── Card de produto: imagem, título, preço original + preço com desconto (se houver),
      botão "Adicionar" (carrinho ativo) ou "Pedir via WhatsApp" (carrinho inativo)
      + link "Mais informações"

Footer
  └── Formas de pagamento aceitas (ícones)
  └── Formas de envio (ícones)
  └── Contato (telefone, e-mail, endereço + link Google Maps)
  └── Selos de segurança (SSL, Google Safe Browsing)
  └── Copyright
```

#### Anatomia da página de produto

- Galeria de fotos com thumbnails navegáveis
- Nome, marca, categoria, condição, unidade, código de barras
- Preço (com preço original riscado se houver desconto)
- Seletor de quantidade (+/-)
- Estoque disponível visível
- Botão "Adicionar ao pedido" (carrinho) e/ou "Pedir pelo WhatsApp" (direto)
- Descrição completa
- Footer igual ao da home (formas de pagamento, entrega, contato, mapa)

#### Anatomia do checkout

**Lado esquerdo — Seus dados:**
- Nome (obrigatório)
- Celular com DDD +55 (obrigatório)
- E-mail (obrigatório — definido junto com Daniel)
- Toggle "Salvar estas informações para a próxima compra" (localStorage)

**Lado direito — Seu pedido:**
- Lista de itens com foto, nome, preço e quantidade
- Total de itens e valor total
- Campo "Aplicar cupom" com botão Aplicar
- Campo "Adicionar uma observação" (texto livre)
- Botão "Enviar pedido"

#### Fluxo de compra (cliente final)

```
[Com carrinho ativo]
Catálogo → Produto → "Adicionar" → (mais produtos) → Sacolinha
  → Checkout: preenche dados, aplica cupom (opcional), observação (opcional)
  → "Enviar pedido"
    → Pedido salvo no Supabase (status: novo)
    → Página de confirmação: código #XXXXX, instruções de pagamento do lojista
    → Botão "Combinar Pagamento" → abre WhatsApp do lojista com mensagem:
        "Olá! Fiz um pedido. Código: #XXXXX
         [itens, quantidades e preços]
         Total: R$ XX,XX
         Nome: [nome] | Cel: [celular] | E-mail: [email]
         Observação: [texto]"

[Com carrinho inativo — botão WhatsApp direto]
Catálogo → Produto → "Pedir pelo WhatsApp"
  → Abre WhatsApp do lojista com mensagem pré-formatada do produto
  → Pedido NÃO é salvo no Supabase (conversa direta, sem rastreamento)
```

- O pagamento é combinado diretamente pelo WhatsApp (fora da plataforma).
- A plataforma não processa pagamento do cliente final em nenhum cenário.
- Dados salvos no localStorage ficam disponíveis apenas no mesmo dispositivo/browser.

---

## 4. Modelo de dados — visão geral dos relacionamentos

```
platform_admins
  └── id, user_id (FK → auth.users), created_at

stores
  └── id, slug, name, cnpj, whatsapp, contact_phone, contact_email,
      slogan, about, logo_url, banner_url, primary_color,
      address (jsonb: cep, street, number, neighborhood, city, state),
      social_links (jsonb: instagram, facebook, youtube, tiktok, kwai, twitter),
      age_restricted (bool), show_out_of_stock (bool),
      product_order (enum), cart_enabled (bool),
      whatsapp_button_enabled (bool),
      checkout_require_delivery (bool), checkout_require_document (bool),
      checkout_require_payment_method (bool),
      checkout_title (text), checkout_message (text),
      payment_methods (jsonb: dinheiro, pix, transferencia, cartao_credito,
                               cartao_debito, boleto, link_pagamento),
      delivery_methods (jsonb: domicilio, retirada, servico_quarto, digital),
      delivery_info (text),
      created_at, deleted_at

store_members
  └── store_id, user_id, role (owner | seller), created_at

subscriptions
  └── store_id, status, plan_id, stripe_customer_id,
      stripe_subscription_id, current_period_end,
      trial_ends_at, cancel_at_period_end

categories
  └── id, store_id, name, slug, position

subcategories
  └── id, category_id, store_id, name, slug, position

products
  └── id, store_id, name, slug, description, sku, barcode, barcode_type,
      brand, condition (novo|usado), unit, purchase_recurrence,
      price, cost_price,
      category_id, subcategory_id,
      stock, stock_alert_threshold,
      has_variations (bool),
      is_featured (bool),        # aparece na seção de ofertas especiais
      discount_pct (nullable),   # percentual de desconto exibido no catálogo
      status (active|archived),
      created_at, updated_at

product_images
  └── id, product_id, url, position

customers
  └── id, store_id, name, whatsapp, phone_secondary,
      document_type (cpf|cnpj), document_number,
      birthday (MM-DD), email, website,
      social_links (jsonb),
      seller_id (vendedor responsável, nullable),
      profile_notes (text),
      created_at

customer_tags
  └── customer_id, tag (text)

customer_interests
  └── customer_id, category_id (nullable), product_id (nullable)

orders
  └── id, store_id, code (único por loja, ex: A3F7K),
      source (catalog | manual),   # catalog = catálogo público; manual = criado no dashboard
      status (novo|em_atendimento|concluido|cancelado),
      customer_id (nullable, FK → customers),
      customer_name, customer_phone, customer_email,
      seller_id (nullable),
      coupon_id (nullable),
      subtotal, discount_amount, total,
      note (observação do cliente),
      payment_instruction_sent (bool),
      created_at, updated_at

order_items
  └── id, order_id, product_id, product_name, quantity, unit_price, total_price

coupons
  └── id, store_id, code, type (percent|fixed),
      value, min_order_value (nullable),
      max_uses (nullable), uses_count,
      expires_at (nullable), active (bool)

plans                   # seed data
plan_features           # limites por plano (seed)
invoices                # espelho do Stripe
billing_events          # log de webhooks Stripe
```

---

## 5. Fluxo de estados da assinatura

```
[Cadastro + Onboarding]
      │
      └─ Todos os planos → trial_ativo (14 dias, sem cartão)
                │
                ├─ Adiciona cartão antes do fim → ATIVO (recorrente)
                │
                └─ Não pagou → SUSPENSO
                        │
                        ├─ Paga → ATIVO
                        └─ 90 dias suspenso → e-mail LGPD → exclusão agendada

[Ativo]
  ├─ Pagamento falha → SUSPENSO imediatamente + e-mail ao lojista
  ├─ Cancela → ATIVO até fim do ciclo → SUSPENSO
  └─ Downgrade → ATIVO no plano atual até fim do ciclo → novo plano

[Suspenso]
  → Catálogo público retorna página /unavailable
  → Dashboard acessível para o lojista pagar/reativar
  → Vendedores não conseguem logar (acesso bloqueado)
```

---

## 6. Conexões entre módulos (dependências)

```
Auth (Supabase)
  └── alimenta → store_members → define role → controla acesso no dashboard

Onboarding
  └── cria → store + subscription + primeiro produto

Stripe (webhooks)
  └── atualiza → subscriptions + invoices + billing_events
  └── dispara → nfse-issuer (Edge Fn) → emite NFSe → salva em Storage

Pedido (catálogo público)
  └── cria → orders + order_items
  └── cria/atualiza → customers
  └── abre → WhatsApp (wa.me link, lado cliente)

Dashboard (pedidos)
  └── lê → orders filtrado por store_id + role
  └── atualiza → orders.status, orders.seller_id

IA (Edge Functions via Gemini)
  └── ai-description → products.description
  └── ai-slogan → stores.slogan
  └── ai-customer-profile → leitura de orders/customers, retorna sumário
  └── ai-product-analysis → usa barcode para análise competitiva → exibida no dashboard

Analytics
  └── lê → orders, products, pageviews (tabela própria)
  └── exibe → dashboard/analytics
```

---

## 7. Regras de negócio críticas

1. **Slug da loja é imutável após publicação.** Mudar o slug quebra links compartilhados. Deve haver aviso explícito antes de permitir edição.

2. **Limite de produtos e vendedores é verificado no servidor**, nunca só no front. A Edge Function ou a mutation do Supabase verifica `plan_features` antes de inserir.

3. **Pedidos nunca são deletados.** Apenas arquivados (soft delete). O histórico é permanente para fins de auditoria e atendimento.

4. **Estoque é indicativo.** Não bloqueia a compra. O lojista recebe alerta quando o estoque atinge o limite configurado, mas o produto continua disponível no catálogo.

5. **O catálogo só é acessível se a assinatura está ativa** (ou trial ativo). A verificação `canAccessCatalog(store)` é feita no carregamento do catálogo público.

6. **Downgrade com limite excedido bloqueia o processo.** O lojista precisa arquivar produtos ou remover vendedores antes de o downgrade ser efetivado.

7. **Vendedor removido perde acesso imediatamente.** O registro em `store_members` é deletado; na próxima requisição autenticada o acesso é negado.

8. **CPF/CNPJ do lojista é validado com checksum** no cadastro de billing (necessário para emissão de NFSe).

9. **Número de WhatsApp é obrigatório** para publicar o catálogo. Sem ele, o fluxo de pedido não tem destino.

10. **Código do pedido é único por loja**, gerado como string curta legível (ex: `#A3F7K`), não UUID. Facilita a comunicação via WhatsApp.

11. **Cupom é validado no servidor** antes de aplicar o desconto. O front exibe o resultado (válido/inválido/expirado), mas a lógica de desconto é calculada no Supabase.

12. **Pedido via WhatsApp direto (carrinho desativado) não é registrado** no banco. O lojista controla esses pedidos fora da plataforma. Apenas pedidos via checkout são persistidos.

13. **"Salvar dados para próxima compra" usa localStorage**, não o banco. A privacidade do cliente final é preservada — nenhum dado é armazenado no servidor sem um pedido associado.

14. **Produtos em destaque (Ofertas Especiais)** são selecionados pelo lojista via `products.is_featured = true`. Máximo de 4 destaques simultâneos. A seção só aparece no catálogo se ao menos 1 produto estiver marcado.

15. **Análise competitiva de produto por IA** requer código de barras preenchido. Sem ele, o botão permanece desabilitado com mensagem explicativa.

---

## 8. Próximos passos técnicos (ordem sugerida)

Com este mapeamento em mãos, a sequência de implementação recomendada é:

1. **Setup do repositório** — `create-next-app`, estrutura de pastas do `CLAUDE.md`, Tailwind, shadcn/ui, ESLint, Prettier, Vitest.
2. **Supabase — schema v1** — tabelas `stores`, `store_members`, `products`, `categories`, `orders`, `order_items`, `customers` + RLS completo.
3. **Auth** — cadastro, login, reset de senha (Supabase Auth). Middleware Next.js para proteger rotas.
4. **Onboarding do lojista** — 4 passos, integração com Stripe Checkout para escolha de plano.
5. **Dashboard base** — shell com sidebar, topbar, guard de role (owner vs seller).
6. **Feature: Products** — CRUD completo, primeiro módulo vertical testável.
7. **Catálogo público** — resolução de subdomínio, exibição de produtos, carrinho, checkout, pedido → WhatsApp.
8. **Feature: Orders** — recepção e gestão de pedidos no dashboard.
9. **Billing** — webhooks Stripe, Customer Portal, faturas, NFSe.
10. **Painel Admin** — após o core da plataforma estar estável.
11. **IA, analytics, QR code, PDF** — features adicionais dos planos Pro/Premium.

---

_Última atualização: 22 de abril de 2026 — Revisão completa com base no PDF do plano original: cadastro rico de cliente, edição detalhada de produto (SKU, código de barras, variações, preço de custo/margem, IA competitiva), subseções completas de personalização do catálogo, catálogo público detalhado (ofertas especiais, footer, checkout com cupom/observação/salvar dados), criação manual de pedido, métodos de pagamento/entrega informativos, modelo de dados expandido._

_Este documento deve ser atualizado sempre que um fluxo for revisado ou uma decisão de produto for tomada._
