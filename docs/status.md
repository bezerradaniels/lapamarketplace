# Zapable — status do projeto

_Atualizado em 25/04/2026._

Documento vivo com tudo que já foi entregue e o que falta para o MVP.
A fonte da verdade do escopo é o `CLAUDE.md` na raiz; este arquivo só rastreia
**execução**.

Health check atual: `tsc → 0 erros · lint → 0 erros · build → ok`.

---

## 1. O que já está feito

### 1.1 Fundação

- Stack Vite 5 + React 19 + TypeScript strict + React Router v6.
- Tailwind com tokens próprios (`z-green`, `z-lime`, `z-lilac`, `z-bg`,
  `z-text`, `z-border`, `shadow-z*`) + DM Sans via `@fontsource/dm-sans` +
  Hugeicons free como icon-set único.
- `class-variance-authority` para variantes; primitivos shadcn-style
  feitos à mão (Button, Input, Field, Label, Textarea, Card, Badge, Logo)
  em `src/components/ui/`.
- Aliases `@/*` → `src/*` configurados.

### 1.2 Multi-tenancy

- `src/lib/tenant/`:
  - `resolveStoreSlug()` reconhece prod (`*.zapable.com.br`) **e** dev
    (`*.localhost`).
  - `buildStoreUrl(slug)` gera link público respeitando ambiente
    (http/https, porta, root domain).
  - `useCurrentStore` (anon, resolve do hostname).
  - `useActiveStore` (autenticado, primeira loja do usuário).
- App roteia `StoreLayout` quando há slug no host, senão dashboard/marketing.

### 1.3 Marketing

- LandingPage com Hero dark, "Como funciona", Features, ProductPreview
  (mockup do dashboard + catálogo), Testimonials, PricingSection, FinalCTA.
- PricingPage com `PricingTable` + `FaqAccordion` (6 FAQs).
- `MarketingNavbar` sticky + `MarketingFooter` dark.
- `PLANS` em `src/config/plans.ts`: Básico R$ 4,99 / Pro R$ 9,99 / Premium
  R$ 29,99 (BRL, mensal).

### 1.4 Auth

- Supabase Auth wrappers em `src/features/auth/`:
  signUp / signIn / signOut / `requestPasswordReset` + hooks de mutação.
- Páginas:
  - `LoginPage` — Field + Button + link "esqueci minha senha".
  - `SignupPage` — Field, checkbox custom (Controller + Tick02Icon),
    aceite de termos.
  - `ForgotPasswordPage` — duplo estado (form ↔ "verifique seu e-mail").
- `AuthShell` compartilhado (Logo, título, subtítulo, largura
  configurável).

### 1.5 Onboarding (criação de loja)

- `OnboardingPage` reescrito como wizard 3 passos:
  1. **Dados** — nome (auto-slugifica), slug com sufixo `.{ROOT_DOMAIN}`,
     WhatsApp via `PhoneInput` (mask BR).
  2. **Personalização** — 7 presets de cor + color picker custom + slogan
     ("Gerar com IA" desabilitado, hook futuro).
  3. **Pronto** — sucesso, copy URL, ir para dashboard, abrir catálogo.
- Validação por step via `form.trigger()`; trata `SlugTakenError` voltando
  ao step 0.
- Trigger SQL `start_store_trial` cria automaticamente uma `subscription`
  `trialing` (plan `pro`, `trial_ends_at = now+14d`) ao inserir a store.

### 1.6 Dashboard shell

- `Sidebar` 200px com Logo + 8 itens (Início, Pedidos, Produtos, Clientes,
  Vendedores, Catálogo, Assinatura, Suporte) + Sair, todos com Hugeicons.
- `Topbar` 56px com nome da loja + URL pública (link via `buildStoreUrl`),
  busca, notificações (bell), avatar com iniciais.
- `DashboardLayout` faz redirect:
  - `!session` → `/entrar`
  - `myStores=[]` → `/nova-loja`
- Hospeda `<Toaster />` (sonner) + `useOrderNotifications` em todas as
  páginas filhas.

### 1.7 Páginas internas do dashboard (todas no design system)

- **HomePage** — banner trial real (com `trialDaysLeft`), 4 stat cards
  com chip colorido, mini bar chart real dos últimos 7 dias, tabela de 5
  últimos pedidos com Badge tonal por status.
- **OrdersPage** — split-view 1fr/360px, Badge tonal por status, painel
  de detalhes com WhatsApp link, bloco de Observações, status pickers
  como chips redondos.
- **ProductsPage** — header com contagem **vs limite do plano**, CTA
  "Aumentar limite" quando atingiu, banner amber inline, lista com chip
  de categoria + Badge "Promo" lilac + preço com strikethrough quando há
  promoção.
- **NewProductPage / EditProductPage** — header com voltar, ProductForm
  em card. New bloqueia via `Navigate` se atingiu limite.
- **CustomersPage** — search com SearchIcon overlay, tabela `bg-z-bg2/60`
  uppercase, link WhatsApp por linha, empty state ilustrado.
- **SellersPage** — form Field/Button, lista com avatar de iniciais +
  Badge tonal (Dono=green, Vendedor=lilac), botão remover hover rose.
  Limite "X/Y" + banner upgrade quando estourado.
- **CatalogPage** — 3 cards (Identidade / Contato / Logo). Cor principal
  dentro de `<fieldset disabled>` quando `!canUse('theme')` com link
  "🔒 Disponível no Pro".
- **BillingPage** — banner status real (Badge tonal por
  `SubscriptionStatus`), 3 cards de planos (vindos do banco), botões
  Stripe Checkout / Portal funcionais, lista de invoices com link
  Stripe + NFSe.
- **SupportPage** — 3 canais (WhatsApp / E-mail / Central) + form de
  mensagem.

### 1.8 Catálogo público (storefront)

- **StoreLayout** — banner sticky com cor da loja, logo (ou ícone
  fallback), nome, slogan, toolbar branca com busca + cart-icon com badge
  contador. Footer "Powered by zapable".
- **`UnavailableScreen`** quando: store não existe, **trial expirado**,
  ou subscription inativa (lê `getStoreCatalogStatus` RPC).
- **StorePage** — chips de categoria sticky no topo, cards com:
  - Eyebrow `CATEGORIA` uppercase tracking-wider.
  - Badge `XX% OFF` lilac quando há promo.
  - Preço promocional (cor da loja) + preço original riscado.
  - Botão **"Adicionar"** outline (border preta, hover invertido).
- **ProductPage** — galeria com thumbnails laterais (border ativa na cor
  da loja), título, preço com promo + Badge `-X% OFF`, stepper de
  quantidade, dual CTA (cor da loja + WhatsApp), descrição.
- **CartPage** — items em cards com stepper inline, cupom (placeholder
  `DANI10` = 10%, `TODO(coupon-slice)`), summary, CTAs sticky.
- **CheckoutPage** — 2 colunas (form / resumo sticky), Dados pessoais
  (Field), Forma de entrega ("Combinar pelo WhatsApp" único), Observações,
  CTA "Confirmar pedido" (WhatsApp icon).
- **OrderConfirmationPage** — card centrado com check verde, número do
  pedido na cor da loja, CTA lime "Abrir WhatsApp" + secundário.
- **StoreAboutPage** (`/sobre`) — card central com logo + nome + slogan,
  contato, CTA verde WhatsApp.

### 1.9 Cart, Checkout e WhatsApp

- `effectivePrice(product)` honra promo em todo lugar:
  cart total, line items, checkout summary, mensagem WhatsApp.
- `buildOrderMessage(...)` em pt-BR com store, items, customer,
  observações, link da loja.

### 1.10 Billing

- **Schema** (`subscriptions`, `invoices`, `plan_features`,
  `billing_events`) com RLS estrita: members read; writes só
  service_role. RPC `store_catalog_status` SECURITY DEFINER expõe ao
  anon só `(status, trial_ends_at)`.
- **Stripe configurado**: 3 produtos + 3 prices BRL recurring monthly
  na conta `acct_1TPiLg1oLw5d2Hz3` (Price IDs cravados em `plan_features`
  via migration).
- **Edge Functions** Deno em `supabase/functions/`:
  - `_shared/cors.ts` + `_shared/auth.ts` (admin/user clients +
    `requireStoreMember`).
  - `stripe-checkout-session` — Checkout em modo subscription com
    card+boleto, metadata, allow_promotion_codes.
  - `stripe-portal-session` — Customer Portal session.
  - `stripe-webhook` — verifica `stripe-signature`, idempotência por
    `stripe_event_id`, trata `checkout.session.completed`,
    `customer.subscription.{created,updated,deleted}`,
    `invoice.{paid,payment_failed,finalized}`, `customer.updated`.
- **Front**:
  - `useSubscription`, `useInvoices`, `usePlanFeatures`,
    `useStoreCatalogStatus`, `useStartCheckout`, `useOpenPortal`.
  - `canAccessCatalog(status)` + `trialDaysLeft(status)`.
  - `usePlanLimits(storeId)` — `canUse('ai'|'pdf'|'theme')`,
    `productLimit`, `sellerLimit`. Single source of truth para gating.
- **Gating de UI ativo**: ProductsPage, NewProductPage, SellersPage,
  CatalogPage (cor) — todos consultam `usePlanLimits`, sem `if planId ===`
  hardcoded.

### 1.11 Realtime

- Migration `20260425225611_orders_realtime.sql` adiciona `orders` ao
  `supabase_realtime`.
- `useOrderNotifications(storeId)` montado em `DashboardLayout`:
  - Subscreve canal `orders:{storeId}` com filter `store_id=eq.{id}`.
  - Anti-spam de backlog (descarta payloads pré-`SUBSCRIBED`).
  - Invalida `ordersKeys.list(storeId)` no React Query.
  - Dispara toast (sonner) com "Novo pedido recebido" + ação "Ver pedido".

### 1.12 Banco de dados (12 migrations)

```
20260424142635_init_stores_and_members.sql
20260424144449_fix_set_updated_at_search_path.sql
20260424144929_products_init.sql
20260424145449_stores_add_whatsapp_phone.sql
20260424220829_orders_init.sql
20260425000000_storage_buckets.sql
20260425010000_storage_drop_public_select.sql
20260425100000_profiles_and_sellers.sql
20260425171318_billing_init.sql
20260425220605_billing_seed_stripe_price_ids.sql
20260425224301_products_add_category_and_promo.sql
20260425225611_orders_realtime.sql
```

### 1.13 Documentação

- `CLAUDE.md` — fonte da verdade do escopo.
- `docs/billing-runbook.md` — passo-a-passo CLI para pôr o Stripe em pé
  (db:push, secrets, deploy functions, registrar webhook, ligar portal).
- `docs/setup.md` — setup geral.

---

## 2. O que falta — backend

### 2.1 Edge Functions

- [ ] **`nfse-issuer`** — disparada após `invoice.paid` no webhook,
      chama NFE.io ou Enotas com CNPJ/CPF + endereço da loja, salva o
      PDF/XML em Supabase Storage `invoices/{store_id}/{invoice_id}.pdf`
      e popula `invoices.nfse_url`.
- [ ] **`ai-description`** — gera descrição de produto via Gemini.
      JWT obrigatório, rate-limit por loja, retorna texto pt-BR. Gated
      por `canUse('ai')` no front.
- [ ] **`ai-slogan`** — refina slogan da loja.
- [ ] **`ai-customer-profile`** — sumariza histórico de pedidos de um cliente.
- [ ] **`ai-product-analysis`** — análise competitiva (post-MVP, opcional).

### 2.2 Schema / RLS

- [ ] **Tabela `notifications`** — para histórico persistente do bell icon
      (in-app, distinto do toast efêmero). Realtime já está pronto, falta
      a tabela e o seed dos eventos (novo pedido / falha de pagamento /
      vendedor adicionado).
- [ ] **Tabela `store_coupons`** — cupons que o cliente final aplica no
      checkout (CartPage hoje só aceita o stub `DANI10`).
      Schema: `code`, `discount_type` (percent/fixed), `discount_value`,
      `expires_at`, `max_uses`, `used_count`, `min_order_in_cents`,
      `product_id` (null = qualquer produto), `category` (null = todas).
- [ ] **`order_coupon`** — registra qual cupom foi usado em qual pedido.
- [ ] **`product_views` / analytics próprios** — CLAUDE.md §19 lista
      "Own analytics" como MVP. Hoje só temos KPIs derivados de pedidos.
- [ ] **Soft-delete cleanup job** — CLAUDE.md §13.4: lojas sem assinatura
      ativa por 90 dias → e-mail LGPD; após 30 dias → deletar dados.
      Scheduled function (cron) ou Postgres pg_cron.

### 2.3 Storage / buckets

- [ ] Bucket `invoices` para os NFSe (já mencionado em 2.1, mas precisa
      criar com policy "service_role write, member read").
- [ ] Bucket `catalogs` para PDFs exportados (gated por `canUse('pdf')`).

### 2.4 Webhooks adicionais

- [ ] Re-validar plan na assinatura: hoje `customer.subscription.updated`
      sobrescreve `plan_id` baseado no `price.id`. Se o usuário trocar de
      plano via Portal, o downgrade deve respeitar CLAUDE.md §13.5
      (downgrade no fim do ciclo, não imediato — Stripe faz isso quando
      configurado, mas o Portal precisa estar com `proration_behavior:
      'none'`). **Validar configuração do Portal Stripe.**
- [ ] **Quando `subscription.status='unpaid'`** → marcar `subscriptions`
      como `unpaid` (CLAUDE.md §13.6 manda suspender no primeiro
      pagamento falho — hoje só viramos `past_due`). Ajustar
      `canAccessCatalog` se for esse o comportamento desejado.

### 2.5 Operações

- [ ] Rodar `npm run db:push && npm run db:types` em produção.
- [ ] Setar secrets via `supabase secrets set ...` (ver
      `docs/billing-runbook.md`).
- [ ] Deploy das 3 Edge Functions atuais.
- [ ] Registrar webhook endpoint no dashboard Stripe com os 8 eventos
      listados.
- [ ] Ligar **Customer Portal** nas Settings do Stripe (cancel at period
      end + plan switching habilitado).
- [ ] Habilitar PIX no Stripe (post-MVP, ver runbook).

---

## 3. O que falta — frontend

### 3.1 Notifications

- [ ] **Bell dropdown no Topbar** — hoje o bell é decorativo. Plug em
      `notifications` (vai ser criado em 2.2) + badge com count de não
      lidas.
- [ ] Marcar como lida ao clicar no item; "Marcar todas como lidas".

### 3.2 IA

- [ ] **OnboardingPage step 2** — botão "Gerar com IA" do slogan tem o
      handler stub. Plug em `ai-slogan` quando a function subir.
- [ ] **ProductForm** — botão "Gerar descrição com IA" abaixo do campo
      Descrição (gated por `canUse('ai')`).
- [ ] **CustomersPage** — drawer de detalhes com botão "Resumo do cliente
      com IA" (`ai-customer-profile`).

### 3.3 PDF e QR

- [ ] **Exportar catálogo em PDF** (gated por `canUse('pdf')`) — botão
      em CatalogPage ou ProductsPage. Lib `@react-pdf/renderer` ou
      gerar HTML→PDF via Edge Function (Puppeteer no Deno é problemático;
      mais simples no client com pdf-lib).
- [ ] **QR code da URL pública** — botão "Compartilhar" em CatalogPage,
      gera QR + link `wa.me`. Lib `qrcode` (já tem `src/lib/qrcode/`
      reservado).

### 3.4 Cupons (storefront)

- [ ] CartPage: trocar o `if coupon === 'DANI10'` por chamada real à
      tabela `store_coupons` com validação (expirado? max_uses? produto
      certo? min_order?).
- [ ] CheckoutPage: passar `coupon_id` para `useCreateOrder`.
- [ ] Dashboard: tela de gerenciar cupons (criar / editar / ver uso).

### 3.5 LGPD

- [ ] Página `/privacidade` em pt-BR.
- [ ] Banner de consentimento de cookies (essencial-only por padrão).
- [ ] Em `/dashboard/configuracoes` (a criar): botões "Exportar meus
      dados" (gera JSON com pedidos+produtos+clientes da store) e
      "Excluir minha conta" (soft-delete + agendar purge em 30d).
- [ ] Contato do DPO no rodapé.

### 3.6 i18n

- [ ] Configurar `i18next` em `src/lib/i18n/`.
- [ ] Mover toda copy hardcoded (atualmente espalhada nos componentes)
      para `locales/pt-BR.json`. Não adicionar outros locales (CLAUDE.md
      §9: pt-BR only at launch). É um refactor por arquivo.
- [ ] `useTranslation()` em todos os componentes.

### 3.7 Polimento e bugs conhecidos

- [ ] Build atual: chunk `index-*.js` 551 kB (160 kB gzip). Adicionar
      `manualChunks` em `vite.config.ts` para separar Supabase/Stripe/
      Hugeicons.
- [ ] 8 warnings do React Compiler em `form.watch(...)` —
      tecnicamente OK, mas avaliar trocar por `useWatch` ou suprimir
      via `// eslint-disable-next-line react-hooks/incompatible-library`.
- [ ] **Mobile responsiveness** — sidebar 200px é fixa hoje; precisa
      virar drawer em < 768px com hamburger no Topbar.
- [ ] **Acessibilidade** — passar com axe / Lighthouse no dashboard e
      catálogo público; adicionar `<label>` faltantes, aria attrs em
      botões só-ícone, focus visible.

### 3.8 Realtime - próximos eventos

- [ ] Toast no dashboard quando produto fica com **estoque baixo**
      (após order INSERT, derivar `stock < 5` e disparar evento).
- [ ] Toast quando vendedor é adicionado pelo dono.

### 3.9 Tests

- [ ] Vitest para utils críticos (`effectivePrice`, `canAccessCatalog`,
      `trialDaysLeft`, `buildStoreUrl`, `parseMoneyToCents`).
- [ ] Component tests do `Field`, `ProductForm`, `CartPage`.
- [ ] **Playwright E2E** dos 3 fluxos críticos do CLAUDE.md §17:
  1. Owner cadastra, cria produto.
  2. Cliente coloca pedido na loja pública.
  3. Owner vê pedido aparecer no dashboard (live via realtime).

---

## 4. Roadmap sugerido das próximas slices

Em ordem de impacto vs esforço:

1. **Cupons (storefront)** — alta percepção de valor, aproveita o
   placeholder que já mostramos no CartPage. Requer 1 migration + tela
   de admin.
2. **AI helpers** — diferencial de marketing forte, gating já está
   pronto via `canUse('ai')`. Mais valioso depois que a primeira loja
   real começar a popular catálogo.
3. **Bell dropdown + tabela `notifications`** — fecha o loop do realtime
   que acabamos de entregar. Pequeno mas visível.
4. **NFSe** — emissão automática só dispara quando há fatura paga, então
   pode esperar o billing rodar em produção. Imprescindível antes da
   primeira cobrança real.
5. **PDF + QR** — features pagas (Pro), pode esperar até ter clientes.
6. **LGPD** — bloqueante para qualquer publicidade legítima no Brasil.
   Fazer antes do go-live.
7. **i18n migration + tests + responsiveness mobile** — refactor
   contínuo, encaixar entre slices.
8. **Cleanup job 90d / cron** — só importa quando houver lojas
   abandonadas; pós go-live.

---

## 5. Como contribuir uma nova slice

1. Ler `CLAUDE.md` (não desviar do escopo Brazil-only).
2. Criar feature em `src/features/<x>/` seguindo a estrutura existente.
3. Migration nova + `npm run db:push && npm run db:types` se mudar
   schema.
4. Atualizar este `status.md` movendo o item de §2/§3 para §1.
5. `npx tsc -p tsconfig.app.json --noEmit && npm run lint && npm run build`
   antes de commitar.
