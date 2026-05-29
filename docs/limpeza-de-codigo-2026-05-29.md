# Limpeza de Código — 29/05/2026

Relatório da varredura de limpeza, refatoração e otimização do codebase Zapable.

**Estado final:** `typecheck` 0 erros · `lint` 0 erros (14 warnings) · 46 testes passando · `build` OK.
**Saldo:** 35 arquivos alterados, −1.150 linhas líquidas. 9 commits desde o baseline `113e3e2`.

---

## ⚠️ Pré-requisito de segurança resolvido

O diretório **não era um repositório git** — sem versionamento, nenhuma mudança seria reversível.
Primeira ação: `git init` + commit baseline (`113e3e2`), que serve de "desfazer" para tudo abaixo.

---

## Commits (cada etapa é reversível isoladamente)

| Commit | O quê |
| --- | --- |
| `113e3e2` | **git init + baseline** |
| `9d241b4` | Removido `src/lib/supabase/types.ts` (1.101 linhas mortas, 0 importadores) + 3 deps sem uso: `lucide-react`, `@supabase/ssr`, `react-image-crop` |
| `9e4d0d4` | **Lint 25 → 0 erros** |
| `05c0b4f` | **Perf:** memoização de `query.data ?? []` em StorePage/CustomersPage |
| `18d1cde` | Removido `NewSellerPage` órfão (452 linhas) + rota + constante de rota não usada |
| `1015bd1` | **Primeiros testes do repo:** CPF/CNPJ/telefone/moeda (26 testes) |
| `6811e5e` | Lógica de negócio extraída do `ProductForm` para utils testados + testes do cart store (46 no total) |
| `123cb28` | Destrackeado PDF de 13MB do git (`docs/*.pdf` agora ignorado) |
| `69afcd3` | Ajuste de whitespace no teste de moeda |

---

## Detalhes por categoria

### Código morto removido
- `src/lib/supabase/types.ts` — duplicata de 1.101 linhas de `src/types/database.ts` (a fonte canônica por CLAUDE.md §7.3), com **0 importadores**.
- `src/routes/dashboard/NewSellerPage.tsx` — 452 linhas inalcançáveis: nada navegava para `/dashboard/vendedores/novo`; a criação de vendedor é feita via `NewSellerModal`.

### Dependências removidas (0 usos verificados)
- `lucide-react` — o projeto usa `@hugeicons` (58 arquivos).
- `@supabase/ssr` — SPA não tem cliente server-side (CLAUDE.md §7.1).
- `react-image-crop` — o projeto usa `react-easy-crop`.

### Lint: 25 erros → 0
- **Bug real:** `NewSellerModal` chamava hooks **depois** de `if (!open) return null` (`rules-of-hooks`) — quebrado em wrapper-porteiro + `NewSellerModalContent`, mantendo a ordem de hooks estável.
- **Perf / re-renders:** 5 `useEffect` de reset/sync convertidos para ajuste de estado em render (`OptimizedImage`, `Combobox`, `ProductPage`, `OrdersPage`, `CartPage`).
- `any` trocados por tipos reais (`OnboardingStep2`, `OnboardCompletePage`, `CatalogPage`, `useCatalogPdf`).
- Contexto owner-mode extraído para `storeOwnerMode.ts` (corrige `react-refresh/only-export-components`).
- `alert()` → toast `sonner` no botão de compartilhar.
- `eslint.config.js`: honra prefixo `_` (params intencionalmente não usados) e `allowEmptyCatch` (acesso best-effort a localStorage).

### Performance
- `const list = products.data ?? []` criava um array novo a cada render, forçando recálculo de todos os `useMemo` dependentes. Agora memoizado em `products.data` (StorePage, CustomersPage).

### Testes (primeiros do repo)
A infra (vitest + jsdom + jest-dom) já estava configurada; faltavam os testes. Adicionados **46 testes** colocados:
- `lib/br/cpf.test.ts`, `cnpj.test.ts`, `phone.test.ts` — validação de checksum, máscara, E.164 round-trip.
- `lib/format/money.test.ts` — formatação/parse BRL.
- `features/products/utils/price.test.ts`, `featured.test.ts` — preço efetivo, desconto, margem, slots de destaque.
- `stores/cartStore.test.ts` — add/dedupe, cap de estoque, clamp de quantidade, cupom percentual e fixo, total ≥ 0.

### Arquitetura
- Lógica de negócio pura extraída do `ProductForm` (1.5k linhas) para `features/products/utils/` — `marginPercent()` em `price.ts` e `featuredSlots()` + `MAX_FEATURED_PRODUCTS` em `featured.ts` ("dumb UI, smart utils", CLAUDE.md §3).

### Higiene de git
- PDF de 12,6MB (`docs/plano de sistema de catalogo online.pdf`) destrackeado (arquivo mantido em disco) e `docs/*.pdf` adicionado ao `.gitignore`.

---

## Dívida técnica restante (alta prioridade)

> Requer trabalho **incremental** — não fazer em bloco sem testes.

1. **Componentes "deus"** ainda grandes — quebrar exige testes de caracterização ANTES (idealmente `FormProvider` + painéis por aba, um PR por componente):
   - `ProductForm.tsx` — ~1.540 linhas
   - `CatalogPage.tsx` — 1.425 linhas
   - `ProductPage.tsx` — ~920 linhas
   - `LandingPage.tsx` — 890 linhas
2. **14 warnings de lint** `react-hooks/incompatible-library` — atrito conhecido do `react-hook-form` com o React Compiler. Mantidos como informativo (reescrever não traz ganho real).
3. **Hero SVG** `public/images/hero-model-marketplace.svg` tem 1,2MB (provável raster embutido) — otimizar para perf da landing.
4. Docs de rascunho na raiz (`RLS_INVESTIGATION.md`, `RESUMO-SEGURANCA.md`) poderiam ir para `docs/`.

---

## Como verificar

```bash
npm run typecheck   # 0 erros
npm run lint        # 0 erros (14 warnings)
npm test            # 46 testes passando
npm run build       # build estático em /dist
```
