# Etapa 1: Fundação, Conexão Supabase SSR, Tipagens e Horários

## Contexto do Projeto (Lapa Marketplace)
Shopping virtual e rede social de comércio local para **Bom Jesus da Lapa/BA**.
* **Stack:** Next.js (App Router, TypeScript, sem pasta `src`), Tailwind CSS, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), Zustand e `lucide-react`.
* **Regra de Infraestrutura Crítica:** Mantenha sempre `next.config.mjs` (JavaScript ESM nativo). NUNCA crie ou utilize `next.config.ts` para evitar falhas de compilação do binário SWC nos servidores Linux da Hostinger.
* **Status do Banco de Dados:** O SQL Mestre já foi executado no Supabase. Temos as tabelas `neighborhoods`, `global_categories`, `profiles`, `stores`, `store_categories`, `products`, `store_stories`, `followed_stores` e `saved_products`, além do bucket público `lapa-imagens`.

---

## Tarefas desta Etapa para o Agente (Antigravity)

### 1. Variáveis de Ambiente e Configuração Next.js
* Garantir que `next.config.mjs` permita imagens externas do Supabase Storage (`remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }]`).
* Criar `.env.local.example` com:
  * `NEXT_PUBLIC_SUPABASE_URL=`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
  * `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

### 2. Clientes Supabase SSR (`utils/supabase/`)
* **`utils/supabase/client.ts`:** Criar cliente Browser usando `createBrowserClient` de `@supabase/ssr`.
* **`utils/supabase/server.ts`:** Criar cliente Server usando `createServerClient` de `@supabase/ssr` integrando com `cookies()` do `next/headers` (compatível com Next.js 15/16 onde `cookies()` é assíncrono).

### 3. Middleware de Sessão e Proteção de Rotas (`middleware.ts`)
* Atualizar a sessão do usuário via cookies do Supabase em todas as requisições.
* **Proteção de Rotas:**
  * `/painel/*` e `/onboarding/*`: Exigem usuário autenticado (se não logado, redirecionar para `/login`).
  * `/master/*`: Exige usuário autenticado cujo registro em `public.profiles` tenha `role === 'admin'`.
  * `/minha-conta/*`: Exige usuário autenticado (visitante ou lojista).

### 4. Tipagens Globais do Banco (`types/database.ts`)
Criar interfaces TypeScript limpas e exportáveis representando:
* `Neighborhood`, `GlobalCategory` (incluindo `filter_config`: `has_gender`, `has_size`, `has_voltage`, `size_options`), `Profile`, `Store` (incluindo `business_hours` e `special_hours`), `Product`, `StoreStory`.

### 5. Motor de Horário de Funcionamento (`utils/businessHours.ts`)
Criar uma função utilitária pura `getStoreOpenStatus(businessHours, specialHours)` que calcula o horário atual no fuso `America/Bahia` (`UTC-3`) e retorna um objeto:
```ts
{
  isOpen: boolean;
  statusLabel: string; // Ex: "Aberta agora • Fecha às 18:00" | "Horário de almoço • Volta às 14:00" | "Fechada • Abre às 08:00" | "Horário Especial de Romaria • Até 20:00"
  badgeColor: 'emerald' | 'amber' | 'rose';
}
```
* **Regra:** Primeiro verifica se a data atual (`YYYY-MM-DD`) consta no array `special_hours`. Se constar, usa a regra especial. Caso contrário, verifica o dia da semana (`seg_sex`, `sab`, `dom`), checando também o intervalo de almoço (`lunch_start` e `lunch_end`).
* **Importante:** Este status é 100% informativo para quem deseja ir presencialmente à loja física; nunca bloqueia o envio de pedidos pelo site.

---

## Prompt de Comando para o Antigravity
> "Leia `@docs/etapa-1-infra-core.md` e implemente todos os arquivos listados na Etapa 1 (`next.config.mjs`, `utils/supabase/client.ts`, `utils/supabase/server.ts`, `middleware.ts`, `types/database.ts` e `utils/businessHours.ts`). Certifique-se de que não haja erros de tipagem TypeScript."