# Histórico do projeto — Zapable

> **Para que serve este arquivo.** Ele documenta o caminho que percorremos com o Claude até aqui: ideia inicial, decisões tomadas, mudanças de rumo e o que já foi entregue. Se você abrir uma nova conversa (inclusive em outro computador), basta dar a leitura desta pasta ao Claude e pedir pra continuar. O `CLAUDE.md` descreve **o que** o sistema é; este arquivo explica **por que** e **como chegamos** até ele.

**Data:** 22 de abril de 2026
**Responsável:** Daniel Bezerra (daniel.ddsb@gmail.com)
**Produto:** Zapable — SaaS de catálogos compartilháveis para lojistas brasileiros.
**Slogan:** "Transforme sua loja em um catálogo zapável."
**Domínio:** zapable.com.br · lojas em `{slug}.zapable.com.br`

---

## 1. Ideia central

Plataforma multi-tenant onde cada lojista (dono de loja) publica um catálogo online em um subdomínio próprio e recebe pedidos via WhatsApp. O lojista gerencia tudo por um dashboard: produtos, pedidos, clientes, vendedores, personalização do catálogo, e a própria assinatura do plano.

**UX/UI de referência:** screenshots do PDF anexo (`plano de sistema de catalogo online.pdf`) — dashboard com sidebar escura navy, CTAs em rosa (`#ec4899`), catálogo público com header colorido por loja (ex.: teal no exemplo Pet Shop).

---

## 2. Linha do tempo das conversas

### Etapa 1 — 50 perguntas de alinhamento técnico
Questionário múltipla escolha, uma pergunta por vez, para fixar decisões de arquitetura antes de qualquer linha de código.

**Decisões chave:**

- **Front-end:** Next.js 14+ com App Router, TypeScript estrito.
- **Estilo:** Tailwind CSS + shadcn/ui.
- **Formulários:** React Hook Form + Zod (schema co-localizado na feature).
- **Server state:** React Query. **UI state:** Zustand. Context **não** é usado para dados do Supabase.
- **Back-end:** (reviravolta importante — ver “Correções de rumo” abaixo) → **Supabase direto do front-end** (sem NestJS). Postgres + Auth + Storage + Realtime + Edge Functions.
- **Multi-tenancy:** RLS por `store_id` em todas as tabelas.
- **Hospedagem:** Hostinger compartilhado (sem SSR). Build como **Static Export** (SSG + CSR).
- **Subdomínios:** wildcard DNS + resolução client-side em `src/lib/tenant/`.
- **CI/CD:** GitHub Actions, deploy por FTP/SSH para a Hostinger.
- **Pacote:** `npm` (decisão tomada na Etapa 3; antes era pnpm).
- **Testes:** Vitest + Testing Library + Playwright.
- **IA:** Google Gemini via Supabase Edge Functions (nunca chamada direta do browser com secret key).
- **i18n:** next-intl. *Inicialmente pt-BR + en + es — alterado na Etapa 5 para pt-BR apenas.*
- **Princípios:** Clean Code, funções pequenas, feature modules, pastas rasas (<4 níveis).
- **Organização:** feature-based. Estrutura padrão de cada feature: `api/` · `components/` · `hooks/` · `schemas/` · `utils/` · `types.ts` · `index.ts`.

### Etapa 2 — Geração do CLAUDE.md
Documento mestre em inglês para o Claude Code, cobrindo: visão do projeto, tech stack, princípios, estrutura de pastas, anatomia de feature, convenções de nome e código, Supabase, multi-tenancy, i18n, state management, forms, theming, ambiente, scripts, git, testes, deploy, escopo do MVP e regras de Do/Don't.

Arquivo: `CLAUDE.md` (raiz do projeto).

### Etapa 3 — Troca de pnpm para npm
Todas as referências em CLAUDE.md migraram: tech stack, lockfile (`package-lock.json`), scripts, CLI do Supabase, Quick Reference. Regra adicionada: não misturar gerenciadores; comitar o lockfile.

### Etapa 4 — 20 perguntas sobre planos, preços e billing
Questionário para fechar o modelo comercial.

**Decisões chave:**

- **Planos:** Básico (R$ 4,99/mês) · Pro (R$ 9,99/mês) · Premium (R$ 29,99/mês). Não há plano free. Mensal apenas no MVP (anual fica pós-MVP).
- **Limites:**
  - Básico — 30 produtos, 1 vendedor, sem IA, sem PDF, tema limitado.
  - Pro — 300 produtos, 3 vendedores, IA, PDF, tema customizado.
  - Premium — ilimitado, IA, PDF, tema custom.
- **Trial:** 14 dias em Pro e Premium, **sem cartão**. Ao fim do trial sem pagamento, catálogo é suspenso; dashboard segue acessível para pagar.
- **Gateway:** **Stripe Brasil**. Checkout + Customer Portal + Webhooks. Nunca hospedar formulário de pagamento próprio.
- **Métodos de pagamento da assinatura:** cartão (recorrente), PIX e boleto (one-off por ciclo).
- **Cancelamento:** efetivo no fim do ciclo; sem reembolso proporcional.
- **Upgrade:** imediato com proração. **Downgrade:** no fim do ciclo.
- **Dunning:** suspende o catálogo já na primeira falha de pagamento.
- **Cupons:** gerenciados pelo Stripe Coupons.
- **Invoicing/NFSe:** após `invoice.paid`, Edge Function `nfse-issuer` emite NFSe via NFE.io (ou Enotas). PDF/XML armazenado no Supabase Storage e disponível no dashboard.
- **Modelo de dados novo:** tabelas `plans`, `subscriptions`, `invoices`, `plan_features`, `billing_events` (todas com RLS).
- **Source of truth:** Stripe. O Supabase espelha o mínimo para checagens rápidas de feature flag.
- **Regra de ouro:** todo acesso a capabilities pagas passa por `features/billing/hooks/usePlanLimits.ts`. Nunca hardcode de nome de plano em componente.

### Etapa 5 — Pivot para mercado brasileiro
Mudança estratégica: **MVP Brazil-only**. Simplifica o produto, acelera o lançamento e evita dispersão.

**Impactos aplicados ao CLAUDE.md:**

- Seção 1 ganhou blocos “Target market (MVP): Brazil only” e “Regional defaults” (pt-BR, BRL, `America/Sao_Paulo`, +55, CPF/CNPJ, CEP/UF).
- Seção 9 (i18n) simplificada: pt-BR único; infraestrutura pronta para expansão, mas `en.json`/`es.json` proibidos no MVP.
- `messages/` agora só tem `pt-BR.json`.
- Nova pasta `src/lib/br/` com helpers (validação CPF/CNPJ por checksum, consulta CEP via ViaCEP, lista de UFs).
- Env vars regionais: `NEXT_PUBLIC_DEFAULT_LOCALE=pt-BR`, `DEFAULT_CURRENCY=BRL`, `DEFAULT_TIMEZONE=America/Sao_Paulo`, `DEFAULT_COUNTRY=BR`.
- Scope Boundaries: bloqueio explícito de qualquer expansão internacional no MVP (outros idiomas, moedas, tax IDs, métodos de pagamento, schemas de endereço).
- Do/Don't: novas regras obrigando copy em `messages/pt-BR.json` (nada hardcoded), validação de CPF/CNPJ com checksum, ViaCEP.
- Billing reforçado: conta Stripe Brasil, preços apenas em BRL.

### Etapa 6 — Esquema gráfico (mapa do site + wireframes)
Arquivo `sitemap-e-paginas.html` com:

- Legenda colorida por tipo de área (marketing / auth / dashboard / catálogo público / billing).
- Mapa do site em árvore cobrindo os dois domínios do produto (domínio raiz e `{slug}.dominio`).
- ~25 wireframes esquemáticos reproduzindo a hierarquia visual do PDF: shell do dashboard com sidebar dark e CTAs rosa, landing, pricing em 3 colunas, entrar/criar conta/onboarding, 12+ telas do dashboard (incluindo billing), e catálogo público (home, produto, sobre, carrinho, checkout, confirmação, indisponível).
- Correspondência com os route groups do Next.js (`(marketing)`, `(auth)`, `(dashboard)`, `(public)`).

### Etapa 7 — Revisão de planos e remoção de referências externas
Ajustes feitos em 22 de abril de 2026:

- Removidas todas as referências a RediRedi / rdi / rdi.store dos documentos (eram apenas exemplos de referência visual, não parte do produto).
- Modelo de planos reformulado: **sem plano free**; três planos pagos com novos nomes e preços:
  - Básico — R$ 4,99/mês
  - Pro — R$ 9,99/mês
  - Premium — R$ 29,99/mês
- Limites redistribuídos mantendo a mesma lógica (mais produtos/vendedores/features nos planos maiores).
- Trial de 14 dias agora se aplica a todos os planos, incluindo o Básico (antes: Pro e Business).

### Etapa 8 — Naming: Zapable
Decisão tomada em 22 de abril de 2026:

- **Nome oficial do produto: Zapable**
- **Slogan:** "Transforme sua loja em um catálogo zapável."
- **Domínio principal:** zapable.com.br
- **URLs das lojas:** `{slug}.zapable.com.br` (ex.: `danibezerra.zapable.com.br`)
- Origem do nome: Zap (WhatsApp + velocidade) + -able (sufixo EN "capaz de"). Leitura: "sua loja, pronta para ser zapada". Mesmo padrão de Teachable, Printable — adjetivo que virou marca SaaS.
- Processo: avaliadas ~20 opções em 5 famílias (gírias, trocadilhos, conceito, inventados, ação). Zapable escolhido por equilibrar energia (Zap), tom profissional (-able) e conexão direta com o fluxo do produto (WhatsApp).

### Etapa 9 — Migração de Next.js para Vite + React
Decisão tomada em 24 de abril de 2026.

O projeto estava planejado com Next.js 14+ em modo Static Export. Após reflexão sobre a pilha, decidimos migrar para Vite 5 + React 18 como SPA puro. Os motivos:

- A Hostinger compartilhada não executa Node.js/SSR. O Static Export do Next.js já produzia HTML estático, mas arrastava toda a complexidade do framework (App Router, route groups, `next.config.mjs`, `NEXT_PUBLIC_` prefix, `next-intl`) sem nenhum ganho real.
- Vite é mais simples, mais rápido em desenvolvimento e sem opinião sobre estrutura de pastas — adequado para um time pequeno e codebase focada em features.
- React Router DOM v6 substitui o file-based routing. A estrutura de pastas fica explícita em `src/routes/` em vez de ser implícita pelo sistema de arquivos.

**Mudanças aplicadas ao CLAUDE.md:**

- Stack: `Next.js 14+` → `Vite 5 + React 18 (SPA, static build)`.
- Roteamento: App Router (`src/app/`) → React Router DOM v6 (`src/routes/`).
- i18n: `next-intl` → `i18next + react-i18next`; pasta `messages/` → `locales/`.
- Env vars: `NEXT_PUBLIC_*` → `VITE_*`; acesso via `import.meta.env.VITE_*`.
- Config: `next.config.mjs` → `vite.config.ts`; entry point `index.html`.
- Output de build: `out/` → `dist/`.
- Scripts: `npm run start` → `npm run preview` (vite preview).
- Deploy: adicionada nota sobre `.htaccess` para rewrite SPA no Hostinger.
- Supabase: removido `createServerClient()` (sem SSR); apenas `createBrowserClient()`.
- Do/Don't: adicionadas regras sobre `import.meta.env` e proibição de APIs Next.js.

---

## 3. Correções de rumo importantes

| Mudança | Antes | Depois | Motivo |
|---|---|---|---|
| Back-end | NestJS | Supabase direto | Redução de complexidade; Hostinger compartilhada não roda SSR/Node. |
| Gerenciador de pacote | pnpm | npm | Decisão do Daniel por familiaridade. |
| Idiomas | pt-BR + en + es | pt-BR apenas (MVP) | Foco estratégico no mercado brasileiro. |
| Billing (inicialmente) | Fora do MVP | Dentro do MVP (Stripe Brasil) | Decisão comercial da Etapa 4. |
| Planos | Free + Pro + Business | Básico + Pro + Premium (todos pagos) | Sem tier gratuito; preços mais acessíveis (R$4,99 / R$9,99 / R$29,99). |
| Trial | Só Pro e Premium | Todos os planos (14 dias, sem cartão) | Decisão de produto para reduzir fricção no cadastro do Básico. |
| Nome do produto | Online Catalog Platform (working title) | Zapable | Naming oficial definido na Etapa 8. |
| Framework front-end | Next.js 14+ (App Router, Static Export) | Vite 5 + React 18 (SPA, `dist/`) | Simplifica a stack; Next.js trazia complexidade sem ganho real numa hospedagem estática. |
| Roteamento | File-based (App Router `src/app/`) | React Router DOM v6 (`src/routes/`) | Estrutura explícita, sem magia de sistema de arquivos. |
| i18n | next-intl | i18next + react-i18next | Alinhado à mudança de framework. |
| Env vars (cliente) | `NEXT_PUBLIC_*` | `VITE_*` / `import.meta.env` | Convenção do Vite. |

---

## 4. Estado atual

**Entregas:**

- `CLAUDE.md` — fonte da verdade das convenções técnicas e do escopo.
- `sitemap-e-paginas.html` — visualização do produto (mapa do site + wireframes).
- `historico-do-projeto.md` — este arquivo.

**Ainda não iniciado:**

- Qualquer código do projeto (não escrevemos nada fora dos documentos).
- Identidade visual (logo, paleta oficial, tipografia) — próxima etapa de branding.
- Conteúdo das páginas de marketing (copy, imagens) usando o nome e slogan Zapable.
- Migrations e setup real do Supabase.
- Setup inicial do Stripe Brasil (preços, webhooks).
- Integração com NFE.io/Enotas.
- Registro do domínio zapable.com.br.

---

## 5. Como retomar em outro computador

1. Copie **toda a pasta de outputs** para o novo computador: `CLAUDE.md`, `sitemap-e-paginas.html`, `historico-do-projeto.md`, e o PDF original se ainda tiver.
2. Abra o Cowork no novo computador e selecione a pasta que contém esses arquivos como workspace.
3. Comece uma nova conversa com um prompt como:

   > *"Leia `historico-do-projeto.md` e `CLAUDE.md` nesta pasta. Estamos retomando o projeto de plataforma de catálogos online para o mercado brasileiro. Antes de responder, confirme o que entendeu do estado atual e me diga quais seriam os próximos 3 passos sugeridos."*

4. A partir daí é só seguir. A conversa original não virá junto (o Cowork armazena histórico localmente por máquina), mas todo o contexto importante está nos arquivos.

---

## 6. Próximos passos sugeridos (para referência)

Ordem sugerida quando retomar:

1. **Branding e naming.** Definir nome final, logo, paleta, tom de voz. O Daniel já sinalizou que essa é a próxima etapa.
2. **Conteúdo das páginas de marketing.** Copy da landing, pricing, termos, privacidade, contato.
3. **Setup inicial do repositório.** `create-next-app`, Tailwind, shadcn/ui, estrutura de pastas do CLAUDE.md.
4. **Supabase — schema v1.** Tabelas `stores`, `users_store_roles`, `products`, `orders`, `customers` + RLS.
5. **Setup Stripe Brasil.** Produtos e Prices em BRL, webhook endpoint, primeiro teste end-to-end de assinatura.
6. **Primeira feature vertical.** Recomendação: `products` (CRUD completo do cadastro ao catálogo público).

---

_Última atualização: 24 de abril de 2026 — Etapa 9: migração de stack para Vite 5 + React 18 (SPA), React Router DOM v6, i18next, `VITE_` env prefix._
