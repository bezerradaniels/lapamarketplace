# Setup do Projeto Zapable

Documentação do ambiente configurado a partir do template `npm create vite@latest` (React + TypeScript).

---

## Stack instalada

### Runtime

| Pacote | Versão | Finalidade |
|---|---|---|
| `react-router-dom` | ^6 | Roteamento SPA |
| `@tanstack/react-query` | ^5 | Server state / cache |
| `zustand` | ^5 | UI state global |
| `react-hook-form` | ^7 | Formulários |
| `@hookform/resolvers` | ^5 | Integração RHF + Zod |
| `zod` | ^4 | Validação de schemas |
| `i18next` + `react-i18next` | ^26 / ^17 | Internacionalização (pt-BR) |
| `@supabase/supabase-js` | ^2 | Banco de dados / Auth / Storage |
| `@stripe/stripe-js` | ^9 | Billing (client-side) |
| `clsx` | ^2 | Composição de classes CSS |
| `tailwind-merge` | ^3 | Merge de classes Tailwind |
| `class-variance-authority` | ^0.7 | Variantes de componentes (shadcn/ui) |
| `lucide-react` | ^1 | Ícones |
| `@radix-ui/react-slot` | ^1 | Primitivo base do shadcn/ui |

### Dev

| Pacote | Finalidade |
|---|---|
| `tailwindcss@3` | Framework CSS |
| `postcss` + `autoprefixer` | Processamento CSS |
| `tailwindcss-animate` | Animações Tailwind (shadcn/ui) |
| `prettier` + `prettier-plugin-tailwindcss` | Formatação de código |
| `vitest` + `@vitest/ui` | Testes unitários |
| `jsdom` | Ambiente DOM para testes |
| `@testing-library/react` + `jest-dom` + `user-event` | Testes de componentes |
| `@playwright/test` | Testes E2E |

---

## Arquivos de configuração

### `vite.config.ts`

Path alias `@/*` apontando para `src/*`:

```ts
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### `tsconfig.app.json`

Adicionados `strict: true`, `DOM.Iterable` e o path alias. O `baseUrl` foi omitido pois é depreciado no TypeScript 6+ com `moduleResolution: bundler`.

```json
{
  "compilerOptions": {
    "strict": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### `tailwind.config.ts`

Tailwind v3 configurado com:
- CSS variables do shadcn/ui (`--background`, `--primary`, etc.)
- Cor dinâmica por loja (`--color-primary`, `--color-primary-fg`, `--color-primary-hover`) para o tema do catálogo público
- Plugin `tailwindcss-animate`

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // shadcn/ui CSS vars
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        // ...demais tokens

        // Tema dinâmico da loja (injetado via JS em src/lib/theme/derivePalette.ts)
        'store-primary': 'var(--color-primary)',
        'store-primary-fg': 'var(--color-primary-fg)',
        'store-primary-hover': 'var(--color-primary-hover)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### `postcss.config.js`

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### `components.json` — shadcn/ui

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

Para instalar componentes shadcn/ui depois:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog input label ...
```

### `.prettierrc`

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 80,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### `vitest.config.ts`

```ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

O arquivo `src/test/setup.ts` importa `@testing-library/jest-dom` para disponibilizar os matchers (`.toBeInTheDocument()`, etc.).

---

## Scripts disponíveis (`package.json`)

```bash
npm run dev          # Vite dev server (HMR)
npm run build        # tsc + vite build → dist/
npm run preview      # Serve dist/ localmente
npm run lint         # ESLint
npm run format       # Prettier --write
npm run typecheck    # tsc --noEmit
npm test             # Vitest (unit + component)
npm run test:e2e     # Playwright (E2E)
npm run db:start     # supabase start (stack local)
npm run db:stop      # supabase stop
npm run db:new       # supabase migration new <nome>
npm run db:push      # supabase db push
npm run db:diff      # supabase db diff
npm run db:types     # Regera src/types/database.ts
```

---

## Estrutura de pastas criada

```
.
├── .github/workflows/
├── docs/
├── locales/
│   └── pt-BR.json           ← namespaces: common, auth, dashboard, products,
│                               orders, customers, catalog, billing, store, errors
├── public/icons/
├── public/images/
├── scripts/
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── seed.sql
├── tests/                   ← E2E (Playwright)
└── src/
    ├── main.tsx             ← monta App, importa i18n e globals.css
    ├── App.tsx              ← BrowserRouter + QueryProvider
    ├── routes/
    │   ├── marketing/
    │   ├── auth/
    │   ├── dashboard/
    │   └── store/
    ├── features/            ← 10 módulos (ver abaixo)
    ├── components/
    │   ├── ui/              ← shadcn/ui (npx shadcn add ...)
    │   ├── layout/
    │   ├── forms/
    │   └── feedback/
    ├── lib/
    │   ├── supabase/        ← createBrowserClient() singleton
    │   ├── stripe/          ← getStripe() singleton
    │   ├── tenant/          ← resolveStoreSlug()
    │   ├── i18n/            ← configuração do i18next
    │   ├── validation/      ← Zod: cpfSchema, cnpjSchema, cepSchema, phoneSchema
    │   ├── br/              ← validateCpf/Cnpj, formatCpf/Cnpj, fetchCep, UF_LIST
    │   ├── whatsapp/        ← buildWhatsAppLink()
    │   ├── format/          ← formatMoney (BRL), formatDate/DateTime (SP), formatPhone
    │   ├── theme/           ← applyStorePalette() — injeta CSS vars da loja
    │   ├── pdf/
    │   ├── qrcode/
    │   └── utils/           ← cn() (clsx + tailwind-merge)
    ├── hooks/
    ├── stores/
    │   └── cartStore.ts     ← useCartStore (zustand + persist)
    ├── providers/
    │   └── QueryProvider.tsx
    ├── types/
    │   ├── database.ts      ← gerado por npm run db:types (não editar)
    │   ├── domain.ts        ← Store, Product, Order, Customer, PlanId, etc.
    │   └── env.d.ts         ← tipos para import.meta.env.VITE_*
    ├── config/
    │   ├── plans.ts         ← PLANS (Básico R$4,99 / Pro R$9,99 / Premium R$29,99)
    │   └── routes.ts        ← ROUTES (constantes de path)
    ├── test/
    │   └── setup.ts
    └── styles/
        └── globals.css      ← @tailwind + CSS vars do shadcn/ui
```

### Anatomia de cada feature

Cada pasta em `src/features/<feature>/` segue a mesma estrutura:

```
<feature>/
├── api/
│   ├── keys.ts        ← React Query key factory
│   ├── queries.ts     ← leituras (Supabase)
│   └── mutations.ts   ← escritas (Supabase)
├── components/
├── hooks/
├── schemas/           ← Zod schemas por formulário
├── utils/
├── types.ts
└── index.ts           ← única superfície pública do módulo
```

Features existentes: `auth`, `billing`, `catalog`, `cart`, `checkout`, `customers`, `orders`, `products`, `sellers`, `analytics`.

---

## CSS global (`src/styles/globals.css`)

Contém as três diretivas do Tailwind e as variáveis CSS do shadcn/ui nos tokens `:root` e `.dark`. As variáveis `--color-primary*` são sobrescritas em runtime pela função `applyStorePalette()` no catálogo público de cada loja.

---

## Variáveis de ambiente (`.env.example`)

| Variável | Onde fica | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` | Chave anon pública |
| `VITE_APP_URL` | `.env.local` | URL raiz da aplicação |
| `VITE_ROOT_DOMAIN` | `.env.local` | Domínio raiz (`zapable.com.br`) |
| `VITE_DEFAULT_LOCALE` | `.env.local` | `pt-BR` |
| `VITE_DEFAULT_CURRENCY` | `.env.local` | `BRL` |
| `VITE_DEFAULT_TIMEZONE` | `.env.local` | `America/Sao_Paulo` |
| `VITE_DEFAULT_COUNTRY` | `.env.local` | `BR` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `.env.local` | Chave pública do Stripe |
| `STRIPE_SECRET_KEY` | Supabase secret | **Nunca no browser** |
| `STRIPE_WEBHOOK_SECRET` | Supabase secret | **Nunca no browser** |
| `STRIPE_PRICE_BASICO/PRO/PREMIUM` | Supabase secret | Price IDs do Stripe |
| `GEMINI_API_KEY` | Supabase secret | **Nunca no browser** |
| `NFSE_PROVIDER_API_KEY` | Supabase secret | **Nunca no browser** |
| `NFSE_COMPANY_ID` | Supabase secret | **Nunca no browser** |

Variáveis prefixadas com `VITE_` são injetadas no bundle pelo Vite via `import.meta.env`. As demais ficam exclusivamente em secrets do Supabase / GitHub Actions.
