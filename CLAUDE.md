# CLAUDE.md

This file is the single source of truth for Claude Code when working on this
repository. It documents the architecture, folder structure, conventions, and
operational rules of the project. Keep it concise, accurate, and up to date.

---

## 1. Project Overview

**Name:** Lapa Marketplace

**Slogan:** "Transforme sua loja em um catálogo pronto para o WhatsApp."

**Domain:** lapamarketplace.com.br (store URLs: `{slug}.lapamarketplace.com.br`)

**One-liner:** A multi-tenant SaaS that lets shop owners (lojistas) publish a
shareable online catalog (unique URL per store) and receive orders via
WhatsApp, with a dashboard to manage products, orders, and customers.

**Target market (MVP):** **Brazil only.** All UX, content, currency, tax
documents, legal copy, and support are built for Brazilian lojistas and
Brazilian end customers. Do **not** add non-Brazilian currency, locale,
or compliance features without explicit discussion — international
expansion is a post-MVP concern.

**Primary users:**
- **Store owner (lojista / owner):** creates and manages the catalog.
- **Seller (vendedor):** scoped user tied to a store, handles assigned orders.
- **End customer:** browses the catalog, adds to cart, checks out without
  creating an account. The order is persisted and then opened in WhatsApp.

**Distribution model:** each store is served at `{slug}.lapamarketplace.com.br`
(e.g. `danibezerra.lapamarketplace.com.br`), resolved client-side via wildcard DNS.

**Regional defaults:**
- Locale: `pt-BR` (single locale at launch).
- Currency: `BRL` (R$), formatted via `Intl.NumberFormat('pt-BR', { currency: 'BRL' })`.
- Timezone: `America/Sao_Paulo` for all user-facing dates.
- Phone format: `+55` country code, E.164 for storage, masked `(DDD) 9XXXX-XXXX` for display.
- Tax IDs: CPF (individuals) and CNPJ (businesses), validated with checksum.
- Address format: CEP + UF (Brazilian states) — not a generic international schema.

---

## 2. Tech Stack

| Layer          | Choice                                         |
| -------------- | ---------------------------------------------- |
| Framework      | Vite 5 + React 19 (SPA, **static build**)      |
| Language       | TypeScript (strict mode)                       |
| Routing        | React Router DOM v6                            |
| UI kit         | Tailwind CSS + shadcn/ui                       |
| State          | React Query (server state) + Zustand (UI state)|
| Forms          | React Hook Form + Zod                          |
| i18n           | i18next + react-i18next (pt-BR only at launch; structure ready for future locales) |
| Backend/DB     | Supabase (Postgres, Auth, Storage, Realtime)   |
| AI             | Google Gemini, called from Supabase Edge Fns   |
| Billing        | Stripe (Subscriptions + Customer Portal)       |
| Invoicing      | NFE.io (or Enotas) for automatic NFSe          |
| Hosting        | Hostinger shared hosting (static artifact)     |
| CI/CD          | GitHub Actions (build + FTP/SSH deploy)        |
| Package mgr    | npm                                            |
| Tests          | Vitest + Testing Library + Playwright (E2E)    |
| Lint/format    | ESLint + Prettier                              |

**No custom backend server.** The client talks to Supabase directly using
Row-Level Security (RLS). Only privileged operations (AI calls, any
third-party secrets) go through Supabase Edge Functions.

---

## 3. Guiding Principles

1. **Clean Code first.** Small functions with single responsibility,
   descriptive names, no dead code. If a file grows past ~200 lines, consider
   splitting it.
2. **Feature-based organization.** Group code by business capability
   (`products`, `orders`, `customers`), not by technical layer.
3. **Keep the structure shallow.** Prefer 2–3 levels of nesting over deep
   hierarchies. New developers should find things in under 30 seconds.
4. **Colocate tests.** A component's test lives next to it
   (`Button.tsx` + `Button.test.tsx`).
5. **Explicit over clever.** Readable code beats terse code.
6. **Dumb UI, smart hooks.** Components render; hooks handle data fetching,
   mutations, and business rules.
7. **Types are documentation.** Prefer a `type`/`interface` over a comment.
8. **One export per file (default rule).** Exceptions allowed for tightly
   related small utilities (e.g. a set of Zod schemas).
9. **No `any`.** Use `unknown` and narrow. If you must, leave a `// TODO`.
10. **Migrations are code.** Every schema change is a file in
    `supabase/migrations/`, committed to git.

---

## 4. Folder Structure

The top-level layout is intentionally flat and predictable.

```
.
├── .github/
│   └── workflows/           # GitHub Actions (CI + deploy)
├── docs/                    # Architecture notes, ADRs, runbooks
├── locales/                 # i18n translations (one JSON per locale)
│   └── pt-BR.json           # MVP ships pt-BR only
├── public/                  # Static assets served as-is
│   ├── icons/
│   └── images/
├── scripts/                 # One-off dev scripts (seed, lint fixers, etc.)
├── src/                     # All application code
├── supabase/                # Database and Edge Functions (versioned)
│   ├── migrations/
│   ├── functions/           # Edge Functions (Deno)
│   └── seed.sql
├── tests/                   # E2E tests (Playwright); unit tests live next to code
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── CLAUDE.md                # THIS FILE
├── README.md
├── index.html               # Vite entry point
├── vite.config.ts
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

### 4.1 `src/` structure

```
src/
├── main.tsx                 # Vite entry: mounts <App /> into #root
├── App.tsx                  # Root component: providers + router
├── routes/                  # React Router route components (keep thin)
│   ├── marketing/           # Landing page and pricing (not tenant-scoped)
│   │   ├── LandingPage.tsx
│   │   └── PricingPage.tsx
│   ├── auth/                # Login / signup for store owners
│   │   ├── LoginPage.tsx
│   │   └── SignupPage.tsx
│   ├── dashboard/           # Authenticated owner/seller area
│   │   ├── DashboardLayout.tsx   # Sidebar + topbar shell
│   │   ├── HomePage.tsx          # "Início" / store summary
│   │   ├── OrdersPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── CustomersPage.tsx
│   │   ├── SellersPage.tsx
│   │   ├── CatalogPage.tsx       # Catalog personalization
│   │   ├── BillingPage.tsx       # Plan, invoices, Stripe Portal entry
│   │   └── SupportPage.tsx
│   ├── store/               # Public catalog (resolved by subdomain)
│   │   ├── StoreLayout.tsx
│   │   ├── StorePage.tsx         # Catalog home
│   │   ├── ProductPage.tsx
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── OrderConfirmationPage.tsx
│   │   └── StoreAboutPage.tsx
│   └── NotFoundPage.tsx
│
├── features/                # Business modules (the core of the app)
│   ├── auth/
│   ├── billing/             # Plans, Stripe, subscriptions, feature flags
│   ├── catalog/             # Personalization: logo, banner, colors, etc.
│   ├── cart/
│   ├── checkout/
│   ├── customers/
│   ├── orders/
│   ├── products/
│   ├── sellers/
│   └── analytics/
│
├── components/              # Reusable presentational components
│   ├── ui/                  # shadcn/ui primitives (button, dialog, ...)
│   ├── layout/              # Sidebar, Topbar, PageShell
│   ├── forms/               # Reusable form building blocks
│   └── feedback/            # Empty states, toasts, spinners, etc.
│
├── lib/                     # Framework-agnostic utilities (no React)
│   ├── supabase/            # Client factory + typed helpers
│   ├── stripe/              # Stripe client, price/plan mapping helpers
│   ├── tenant/              # Subdomain resolver + current-store hook
│   ├── i18n/                # i18next config & helpers
│   ├── validation/          # Shared Zod schemas (inc. CPF/CNPJ/CEP validators)
│   ├── br/                  # Brazil helpers: CPF/CNPJ check, CEP→ViaCEP, UF list
│   ├── whatsapp/            # wa.me link builder, message templates (+55 handling)
│   ├── format/              # Money (BRL), date (America/Sao_Paulo), phone (+55)
│   ├── pdf/                 # Catalog PDF builder
│   ├── qrcode/              # QR generation helpers
│   └── utils/               # cn(), debounce, sleep, etc.
│
├── hooks/                   # Generic React hooks not tied to a feature
│
├── stores/                  # Zustand stores (cart, UI state, ...)
│
├── providers/               # React context providers (auth, theme, query)
│
├── types/                   # Global TypeScript types
│   ├── database.ts          # Generated from Supabase (do NOT edit by hand)
│   ├── domain.ts            # Business types
│   └── env.d.ts             # import.meta.env type augmentation
│
├── config/                  # Constants (routes, statuses, feature flags)
│
└── styles/                  # Any CSS that is not global or Tailwind layer
    └── globals.css
```

### 4.2 Anatomy of a feature

Every feature under `src/features/<feature>/` follows the same shape:

```
products/
├── api/                  # Supabase queries & mutations
│   ├── queries.ts        # read (list, getById, search)
│   ├── mutations.ts      # write (create, update, delete)
│   └── keys.ts           # React Query keys (factory pattern)
├── components/           # Feature-specific UI
│   ├── ProductCard.tsx
│   ├── ProductForm.tsx
│   └── ProductTable.tsx
├── hooks/                # useProducts, useCreateProduct, ...
├── schemas/              # Zod schemas (input validation)
├── utils/                # Pure helpers (formatPrice, calcMargin, ...)
├── types.ts              # Local types
└── index.ts              # Public re-exports (what the rest of the app sees)
```

**Rule:** code outside a feature imports **only** from
`features/<feature>/index.ts`. This keeps the public API of each feature
explicit and refactorable.

### 4.3 Where things go — decision cheat sheet

| What                                               | Where                               |
| -------------------------------------------------- | ----------------------------------- |
| A page/route component                             | `src/routes/...`                    |
| A product-specific component                       | `src/features/products/components/` |
| A generic button, dialog, dropdown                 | `src/components/ui/`                |
| A cross-feature layout piece (sidebar, page shell) | `src/components/layout/`            |
| Supabase query for orders                          | `src/features/orders/api/`          |
| A pure function (formatCurrency)                   | `src/lib/format/`                   |
| A reusable hook (useDebounce)                      | `src/hooks/`                        |
| A Zustand store                                    | `src/stores/`                       |
| Global business constants                          | `src/config/`                       |
| Database types (generated)                         | `src/types/database.ts`             |
| Domain types (Order, Product...)                   | `src/types/domain.ts`               |

---

## 5. Naming Conventions

| Kind                         | Convention                | Example                                |
| ---------------------------- | ------------------------- | -------------------------------------- |
| Folders                      | `kebab-case`              | `product-form/`                        |
| React components (files)     | `PascalCase.tsx`          | `ProductCard.tsx`                      |
| React components (names)     | `PascalCase`              | `export function ProductCard()`        |
| Hooks                        | `useCamelCase.ts`         | `useProducts.ts`                       |
| Non-component TS files       | `camelCase.ts`            | `formatMoney.ts`                       |
| Types / interfaces           | `PascalCase`              | `Order`, `OrderStatus`                 |
| Constants                    | `SCREAMING_SNAKE_CASE`    | `MAX_PRODUCT_IMAGES`                   |
| Zustand stores               | `useXStore`               | `useCartStore`                         |
| React Query keys             | Factory                   | `productsKeys.list(storeId)`           |
| Database tables              | `snake_case`, plural      | `products`, `order_items`              |
| Database columns             | `snake_case`              | `created_at`, `store_id`               |
| Edge functions               | `kebab-case`              | `ai-description/`                      |
| Env vars                     | `SCREAMING_SNAKE_CASE`    | `VITE_SUPABASE_URL`                    |

**Booleans** should start with `is`, `has`, `can`, or `should`
(`isLoading`, `hasVariants`, `canEdit`).

**Handlers** start with `handle` inside components and `on` as props
(`<Button onClick={handleSubmit} />`).

---

## 6. Code Style

- TypeScript **strict** everywhere. No implicit `any`.
- Prefer **function declarations** for components; arrow functions for
  callbacks and utilities.
- Prefer `type` for unions and props; `interface` when it will be extended.
- No default exports for React components (helps with refactors and search).
  Route-level pages in `src/routes/` may use default exports if React Router lazy loading requires it.
- No `React.FC`. Type props explicitly.
- Keep JSX flat. If a component has more than ~3 levels of conditional
  rendering, extract children.
- Never comment out code. Delete it. Git has history.
- Early returns over nested `if` / `else`.
- Derive, don't duplicate. If state can be computed, compute it.

### 6.1 Imports

Order (enforced by ESLint):

1. Node / external packages
2. Absolute internal (`@/features/...`, `@/lib/...`)
3. Relative (`./`, `../`)
4. Side-effect imports (`import './styles.css'`)

Path alias: `@/*` → `src/*` (configured in `tsconfig.json`).

### 6.2 Error handling

- All network calls go through a `features/<x>/api/` function that
  returns a typed result or throws.
- UI uses React Query error states; no ad-hoc try/catch in components.
- User-visible errors go through a central `toast.error(...)` from the UI kit.
- Never expose Supabase error objects to the user. Map to a friendly message.

---

## 7. Supabase Conventions

### 7.1 Clients

One client in `src/lib/supabase/`:

- `createBrowserClient()` — the single Supabase client for this SPA. Returns
  a singleton; call it anywhere but never import `@supabase/supabase-js` directly
  outside `src/lib/supabase/`.

There is no server-side client — this is a fully static SPA (Vite build → `dist/`).
All data access is client-side via RLS.

### 7.2 Row-Level Security (mandatory)

- **Every** table has a `store_id` column (except global lookup tables).
- Policies: a user can only read/write rows where `store_id` matches a
  store they are a member of (`store_members(user_id, store_id, role)`).
- The public catalog uses the `anon` role with read-only policies that
  filter by `stores.slug` resolved from the hostname.

Never disable RLS. If a table looks like it "doesn't need" RLS, it still needs it
(default deny).

### 7.3 Types

Generate types after every migration:

```bash
npm run db:types
# which runs:
# supabase gen types typescript --local > src/types/database.ts
```

Never hand-edit `src/types/database.ts`.

### 7.4 Migrations

```bash
npm run db:new <migration_name>  # creates supabase/migrations/<ts>_<name>.sql
npm run db:push                  # apply to local dev DB
npm run db:diff                  # show schema diff
```

PR convention: one migration per PR when possible. Include a short comment
at the top of each SQL file explaining the intent.

### 7.5 Edge Functions

Location: `supabase/functions/<name>/index.ts`.

Current functions:
- `ai-description` — generate product description via Gemini.
- `ai-slogan` — improve store slogan.
- `ai-customer-profile` — summarize a customer profile.
- `ai-product-analysis` — competitive analysis.
- `stripe-webhook` — receives Stripe events and syncs the `subscriptions` table.
- `stripe-checkout-session` — creates a Checkout Session for plan signup.
- `stripe-portal-session` — creates a Customer Portal session for the store owner.
- `nfse-issuer` — triggered after `invoice.paid`, emits the NFSe via NFE.io/Enotas.

All Edge Functions must verify the caller's JWT and enforce store membership
before doing any work. The exception is `stripe-webhook`, which verifies the
Stripe signature instead (never trust the request body without it).

---

## 8. Multi-tenancy: Subdomain Resolution

The client reads `window.location.hostname`, extracts the leftmost label,
and calls `useCurrentStore()` to fetch the store by slug.

- Local dev: use `localhost` for the auth/dashboard app and
  `<slug>.localhost` for catalogs (most browsers treat `*.localhost` as
  loopback).
- Preview: `<slug>.staging.<domain>` behind the same static build.
- Production: `<slug>.<domain>`.

The resolver lives in `src/lib/tenant/resolveStore.ts`. Do not scatter
hostname parsing around the app.

---

## 9. Internationalization (i18next)

**MVP scope:** `pt-BR` only. The i18n infrastructure is wired up so
additional locales can be added later without a refactor, but no other
locale ships at launch.

- Library: `i18next` + `react-i18next`. Configuration in `src/lib/i18n/`.
- Default (and only shipped) locale: `pt-BR`.
- Translation files: `locales/pt-BR.json`, keyed by namespace
  (`common`, `catalog`, `dashboard`, `orders`, ...).
- Use nested keys: `t('orders.status.awaiting_payment')`.
- Never concatenate strings. Use ICU/i18next placeholders:
  `"Você tem {{count}} pedidos"`.
- Currency and dates: use the helpers in `src/lib/format/` — currency
  always formats as `BRL`, dates in `America/Sao_Paulo`.
- **Do not** add `en.json`, `es.json`, locale switchers in the UI, or
  per-locale product columns in MVP. Product content is stored in a
  single language (pt-BR).
- Keep all user-facing copy in `locales/pt-BR.json` (not hardcoded in
  components), so future localization is a content task, not a refactor.

---

## 10. State Management

- **Server state:** React Query. All queries live in
  `features/<x>/api/queries.ts` and are invoked through hooks in
  `features/<x>/hooks/`.
- **Client state that's local:** `useState` / `useReducer`.
- **Client state that's shared:** Zustand (`src/stores/`).
- **URL state:** keep pagination, filters, and selected tabs in the URL so
  pages are shareable and refresh-safe.

Do **not** use Context for server state. Do **not** put data that comes
from Supabase into Zustand.

---

## 11. Forms

- React Hook Form + Zod. One Zod schema per form, co-located in the
  feature's `schemas/` folder.
- Use the shared `<Form>` components in `src/components/forms/`.
- Server-side validation is enforced by RLS and database constraints; the
  client-side Zod schema is for UX only.

---

## 12. Theming (per-store colors)

- Each store has a `primary_color` (hex). On the public catalog shell, we
  inject CSS custom properties into the root element:
  `--color-primary`, `--color-primary-fg`, `--color-primary-hover`.
- Derived shades are computed in `src/lib/theme/derivePalette.ts` at load
  time (OKLCH-based, guarantees AA contrast).
- Tailwind references the variables via `theme.extend.colors.primary`.

---

## 13. Billing & Subscriptions

All billing is Brazil-only. The Stripe account is a **Stripe Brasil** account,
all Prices are in `BRL`, and NFSe is issued in Brazil via NFE.io / Enotas.
Do not create non-BRL Prices or international payment flows in MVP.

### 13.1 Plans

Three plans in total. All prices in BRL, billed monthly (annual billing is
post-MVP). There is no free plan — all plans are paid.

| Plan    | Price (mo) | Max products | Max sellers | AI helpers | PDF export | Custom theme |
| ------- | ---------- | ------------ | ----------- | ---------- | ---------- | ------------ |
| Básico  | R$ 4,99    | 30           | 1           | —          | —          | limited      |
| Pro     | R$ 9,99    | 300          | 3           | ✓          | ✓          | ✓            |
| Premium | R$ 29,99   | unlimited    | unlimited   | ✓          | ✓          | ✓            |

Final prices are defined in `src/config/plans.ts` and mirrored as Stripe
Products/Prices (the Stripe `price_id` is the source of truth for billing;
our table stores a copy for display and feature checks).

### 13.2 Free Trial

- 14 days on all plans (Básico, Pro and Premium).
- **No credit card required** to start the trial.
- At the end of the trial, if no payment method was added: the catalog is
  **suspended** (public URL returns a "store unavailable" page) until the
  owner subscribes. Dashboard access stays available so the owner can pay.
- Trial status lives in `subscriptions.trial_ends_at`; the public catalog
  renderer checks `isCatalogAccessible(store)` on every request.

### 13.3 Payment Methods

Accepted via Stripe Checkout:
- Credit card (recurring; primary method).
- PIX (one-off charge per cycle; recurring PIX is limited — the owner is
  reminded by email at each renewal).
- Boleto bancário (one-off per cycle, same flow as PIX).

The UI always redirects to Stripe Checkout; we do not host payment forms.

### 13.4 Cancellation & Lifecycle

- Cancellation takes effect at the **end of the current billing cycle**
  (`cancel_at_period_end = true`). No proration refund.
- After the cycle ends, the store is **suspended** (same page as expired
  trial). Data is retained; the owner can reactivate at any time.
- Stale stores (no active subscription for 90 days) trigger an LGPD-compliant
  "your data will be deleted in 30 days" email. Actual deletion is a manual
  scheduled job that must be reviewable.

### 13.5 Upgrade / Downgrade

- **Upgrade:** immediate, with proration. Stripe calculates the difference
  and the new limits apply instantly.
- **Downgrade:** scheduled for the end of the current cycle. Until then, the
  owner keeps the higher plan they already paid for.
- If the new plan's limits are already exceeded on downgrade
  (e.g., 400 products on Premium → Pro limit 300), the owner sees a warning
  and must archive products before the downgrade takes effect.

### 13.6 Dunning (failed payments)

- Stripe Smart Retries run automatically.
- On the **first** failed payment, we suspend the catalog immediately
  (per product decision). The owner is notified by email with a one-click
  "update payment method" link (Stripe Customer Portal).
- Subscription state is driven entirely by Stripe webhooks — never by
  client-side assumptions.

### 13.7 Coupons

- Created in Stripe (or via the admin tools we build later).
- Users redeem codes in Stripe Checkout. We do not validate coupons
  ourselves; Stripe is the source of truth.
- Coupon usage shows up on the invoice in the Customer Portal.

### 13.8 Invoicing (NFSe)

- After `invoice.paid`, the `nfse-issuer` Edge Function calls NFE.io (or
  Enotas) to emit the NFSe using the store owner's CNPJ/CPF and address.
- The returned NFSe PDF/XML is stored in Supabase Storage under
  `invoices/{store_id}/{invoice_id}.pdf` and surfaced in the dashboard
  under **Billing → Invoices**.

### 13.9 Data Model

Minimum tables (all with RLS):

```
plans                 # seed data; columns: id, name, stripe_price_id, features (jsonb)
subscriptions         # store_id, status, plan_id, stripe_customer_id,
                      # stripe_subscription_id, current_period_end,
                      # trial_ends_at, cancel_at_period_end
invoices              # store_id, stripe_invoice_id, amount, status, nfse_url
plan_features         # flat view / seed: per-plan limits for fast lookup
billing_events        # audit log of every Stripe webhook we processed
```

`plan_features` is consumed by `canUseFeature(feature, storeId)` — a single
helper in `src/features/billing/` that every other feature calls before
running limit-gated operations.

### 13.10 Catalog Accessibility Rules

A store's public catalog is accessible when **all** of the below are true:

1. The store exists and is not soft-deleted.
2. The store has an active subscription **or** is on an active trial.
3. If on the Básico plan, only the first `max_products` are listed; the rest are
   hidden (not deleted).

Centralize this check in `src/features/billing/canAccessCatalog.ts`.

### 13.11 Webhooks to Handle

At minimum, `stripe-webhook` must handle:

- `customer.subscription.created` / `.updated` / `.deleted`
- `invoice.paid` / `.payment_failed` / `.finalized`
- `customer.updated` (for portal-edited details)
- `checkout.session.completed` (to link `stripe_customer_id` to our `store`)

Every event is persisted to `billing_events` (idempotency via
`stripe_event_id`) before the state change is applied.

### 13.12 Never Do

- Never compute the user's plan from UI state or URL. Always read
  `subscriptions.status` + `plans.features`.
- Never call the Stripe Secret Key from the browser.
- Never skip webhook signature verification.
- Never hardcode plan limits in components — import from `src/config/plans.ts`
  or query `plan_features`.

---

## 14. Environment Variables

Keep `.env.example` in sync with reality. Vite exposes only variables
prefixed with `VITE_` to the browser bundle — everything else stays server-side
(Edge Functions / GitHub Actions secrets).

```
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# App
VITE_APP_URL=
VITE_ROOT_DOMAIN=

# Regional defaults (Brazil-only MVP — do not override)
VITE_DEFAULT_LOCALE=pt-BR
VITE_DEFAULT_CURRENCY=BRL
VITE_DEFAULT_TIMEZONE=America/Sao_Paulo
VITE_DEFAULT_COUNTRY=BR

# Gemini (server-side only, used by Edge Functions — NOT exposed to browser)
GEMINI_API_KEY=

# Stripe (publishable key is safe on the client; secret + webhook are server-only)
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_BASICO=
STRIPE_PRICE_PRO=
STRIPE_PRICE_PREMIUM=

# NFSe provider (NFE.io or Enotas — server-side only)
NFSE_PROVIDER_API_KEY=
NFSE_COMPANY_ID=
```

- `VITE_*` are inlined at build time (`import.meta.env.VITE_*`) — never
  put secrets behind a `VITE_` prefix.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GEMINI_API_KEY`, and
  NFSe credentials live only as Supabase Edge Function secrets
  (`supabase secrets set ...`).
- Secrets live in GitHub Actions secrets and Supabase Edge Function
  secrets, never in the repo.
- Access env vars via `import.meta.env.VITE_*`; add types in
  `src/types/env.d.ts` by augmenting `ImportMetaEnv`.

---

## 15. Scripts (package.json)

```
npm run dev         # start Vite dev server (hot module reload)
npm run build       # production build to /dist
npm run preview     # serve /dist locally for smoke testing (vite preview)
npm run lint        # eslint
npm run format      # prettier --write
npm run typecheck   # tsc --noEmit
npm test            # vitest
npm run test:e2e    # playwright
npm run db:start    # supabase start (local stack)
npm run db:stop     # supabase stop
npm run db:new      # create a migration
npm run db:push     # apply migrations locally
npm run db:types    # regenerate src/types/database.ts
```

Run `npm run lint && npm run typecheck && npm test` before every commit.

**Install rules:**
- Use `npm install <pkg>` for runtime deps, `npm install -D <pkg>` for dev deps.
- Commit `package-lock.json` on every dependency change.
- Never mix package managers — no `yarn.lock` or `pnpm-lock.yaml` in this repo.

---

## 16. Git Conventions

- **Branches:** `main` (production), `develop` (staging),
  `feat/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`.
- **Commits:** Conventional Commits.
  `feat(products): add variant picker to product page`
- **PRs:** short, focused. One feature or one fix per PR. Include a
  screenshot or Loom for UI changes.
- Never commit `.env`, `dist/`, or `node_modules/`.

---

## 17. Testing Strategy

- **Unit tests (Vitest):** pure utilities in `lib/`, hooks, Zod schemas.
  Co-located: `formatMoney.ts` + `formatMoney.test.ts`.
- **Component tests (Testing Library):** key interactive components
  (forms, cart, product card).
- **E2E tests (Playwright):** critical flows only —
  (1) owner signs up and creates a product,
  (2) customer places an order on a public catalog,
  (3) owner sees the order in the dashboard.

Aim for confidence, not coverage %. Don't test implementation details.

---

## 18. Deployment

- **Artifact:** `npm run build` produces a fully static `dist/` directory
  (standard Vite output).
- **CI (GitHub Actions):** on push to `main`, run
  `lint → typecheck → test → build` and upload `dist/` via SSH/FTP to
  Hostinger (public_html). 
- **SPA routing on Hostinger:** a `.htaccess` file at the root must rewrite
  all unknown paths to `/index.html` so React Router handles them:
  ```apache
  Options -MultiViews
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ index.html [QSA,L]
  ```
- **Wildcard DNS:** `*.lapamarketplace.com.br` → same host. The same static bundle
  serves every store; the subdomain is resolved client-side by
  `src/lib/tenant/resolveStore.ts`.

`staging` branch deploys to `staging.lapamarketplace.com.br` the same way.

---

## 19. Scope Boundaries (MVP)

**Market:** Brazil only. Every feature below assumes a Brazilian lojista
with Brazilian end customers.

Shipped in MVP:
- Public catalog with products, cart, checkout, order confirmation — in
  Portuguese (pt-BR), BRL, `America/Sao_Paulo`.
- Dashboard: orders, products, customers, sellers, catalog personalization,
  billing, basic support inbox.
- WhatsApp order flow via `wa.me` (end-customer purchases), with `+55`
  phone number handling.
- Subscription billing via **Stripe Brasil**: Básico + Pro + Premium plans,
  14-day trial (no card), Stripe Checkout and Customer Portal, webhook-driven
  subscription state, NFSe emission via NFE.io / Enotas.
- Payment methods for owner subscription: credit card, PIX, boleto (all BRL).
- CPF/CNPJ capture + checksum validation, CEP-based address lookup (ViaCEP),
  Brazilian state (UF) dropdowns.
- AI helpers via Gemini (description, slogan, customer profile) — prompts
  and outputs in pt-BR.
- Real-time notifications (new order, low stock, support messages).
- Own analytics (stored in Supabase).
- Coupons — two independent systems:
    - **Store coupons**: applied by the end customer at checkout (per
      product/category/customer).
    - **Subscription coupons**: applied by the store owner at Stripe
      Checkout (managed via Stripe Coupons).
- LGPD compliance (privacy page in pt-BR, cookie consent, data export/delete,
  DPO contact).
- PDF catalog export; QR code sharing.

Explicitly **out** of MVP (do not add without discussion):
- **International expansion of any kind** — no other locales (en/es/etc.),
  no other currencies, no non-Brazilian tax IDs, no non-Brazilian payment
  methods, no non-Brazilian address schemas. Post-MVP concern.
- Custom domains per store.
- SKU / barcode management.
- End-customer payments on-platform (payments for orders are off-platform
  via WhatsApp; on-platform billing is only for the **store owner's
  subscription**).
- Automated freight calculation (freight is "combine via WhatsApp").
- Stock blocking (stock is indicative, doesn't prevent sales).
- Product variations with per-variant SKU/stock (we do attribute-only variations).
- Annual billing (monthly only at launch).
- Paid add-ons / one-off boosts (plans are closed packages for now).
- Native mobile apps.
- Error tracking (e.g. Sentry) — to be added post-MVP.

---

## 20. Do / Don't for Claude Code

**Do**
- Keep `src/routes/**` pages thin: read params, call a hook, render.
- Put business logic in `features/<x>/api/` and `features/<x>/hooks/`.
- When in doubt, follow the structure of the nearest existing feature.
- Regenerate `src/types/database.ts` after any migration.
- Write a small Zod schema before any new form or Supabase mutation.
- Ask before introducing a new top-level folder.
- Treat Stripe as the source of truth for billing; mirror only what you need locally.
- Gate paid capabilities behind `features/billing/hooks/usePlanLimits.ts`, never by hardcoding plan names.
- Always verify Stripe webhook signatures inside the `stripe-webhook` Edge Function.
- Assume Brazil for all defaults — pt-BR copy, BRL currency, `America/Sao_Paulo`, `+55` phones, CPF/CNPJ.
- Put all user-facing copy in `locales/pt-BR.json` (not hardcoded), so future localization is painless.
- Validate CPF/CNPJ with checksum (not just format); auto-fill address from CEP via ViaCEP.
- Use `import.meta.env.VITE_*` for public env vars; never reference `process.env` (this is Vite, not Node).

**Don't**
- Don't import from `@/features/a/internals` from outside feature `a`.
  Go through `features/a/index.ts`.
- Don't bypass RLS with the service role key from the browser — ever.
- Don't inline Supabase queries in components. Wrap in a hook.
- Don't add a new dependency to fix a one-line problem.
- Don't edit `src/types/database.ts` by hand.
- Don't create files deeper than four levels under `src/`.
- Don't call the Stripe SDK from the browser with a secret key — Edge Functions only.
- Don't handle end-customer payments on-platform; orders go to the lojista via WhatsApp.
- Don't write subscription state from UI code; it must come from Stripe webhooks.
- Don't add `en.json`, `es.json`, or any non-pt-BR locale in MVP.
- Don't create Stripe Prices in any currency other than `BRL`.
- Don't introduce international address, phone, or tax-ID schemas — Brazil only.
- Don't hardcode strings in components; even in a single-locale app, copy lives in `locales/pt-BR.json`.
- Don't use `process.env` — Vite uses `import.meta.env` for env access.
- Don't use Next.js APIs (`useRouter` from `next/navigation`, `Link` from `next/link`, etc.) — use React Router DOM equivalents.

---

## 21. Quick Reference: Adding a New Feature

1. Create `src/features/<feature>/` with the standard shape
   (`api/`, `components/`, `hooks/`, `schemas/`, `types.ts`, `index.ts`).
2. Add any new tables via `npm run db:new <feature>_init` and write the SQL.
3. Enable RLS and write policies in the same migration.
4. Run `npm run db:push` and `npm run db:types`.
5. Write Zod schemas in `features/<feature>/schemas/`.
6. Write queries/mutations in `features/<feature>/api/`.
7. Wrap them in hooks in `features/<feature>/hooks/`.
8. Build the UI in `features/<feature>/components/`.
9. Add the route(s) under `src/routes/dashboard/` and wire them in `App.tsx`.
10. Re-export the public surface from `features/<feature>/index.ts`.
11. Update translations in `locales/pt-BR.json`.
12. Add tests where they give confidence (utils, key components, happy-path E2E).
13. Update this file if conventions change.

**If the feature is paid or plan-gated:**
- Add the capability to `plan_features` and read it through `usePlanLimits`.
- Never inline plan-name checks in components — always go through the hook.
- If it charges money, route it through Stripe Checkout + the `stripe-webhook` Edge Function.

---

_Last updated: 2026-04-24 — React bumped to **19** (estável, adotado pelo ecossistema, traz Actions/`useActionState`/`use()`/ref-as-prop). Stack migrated from Next.js 14+ to **Vite 5 + React 19** (SPA, `dist/` output, React Router DOM v6, i18next, `VITE_` env prefix). Prior update: Product named **Lapa Marketplace** (lapamarketplace.com.br); slogan "Transforme sua loja em um catálogo pronto para o WhatsApp."_
