# 🔒 Resumo de Segurança — Lapa Marketplace

> Revisão de segurança realizada em **29/05/2026**.
> Este documento reúne **o que já foi corrigido no código** e **o passo a passo do que você precisa fazer** para colocar as correções no ar.

---

## 🎯 Visão geral

Foram encontrados e tratados problemas que iam de **crítico** (roubo de conta entre lojas) até **baixo** (vazamento de dados internos da loja). A parte do backend (regras do banco, Stripe, checkout) estava, no geral, **bem feita**. Os pontos mais graves estavam na camada de **sessão/login e front-end**.

Tudo o que dependia de código **já foi corrigido e testado** (`typecheck` ✅, `build` ✅, `npm audit` com **0 vulnerabilidades**). O que falta é **você aplicar no banco e no servidor** (Parte 3).

---

## ✅ Parte 1 — Correções já aplicadas no código

Você não precisa fazer nada aqui — já está pronto, só falta enviar pro servidor (Parte 3).

| # | Problema | Gravidade | O que era | Correção |
|---|----------|-----------|-----------|----------|
| C-1 | Roubo de conta entre lojas | **Crítico** | O "crachá" de login (token) era guardado num cookie compartilhado por todos os subdomínios e legível por JavaScript. Uma loja maliciosa conseguia roubar o login de outro lojista ou do admin. | Sessão passou a ficar em `localStorage` **isolado por loja** (`src/lib/supabase/client.ts`). |
| H-2 | Código malicioso na descrição do produto (XSS) | **Alto** | O "filtro" da descrição só checava o nome das tags e deixava passar comandos perigosos (ex.: `onmouseover`). | Filtro trocado por **DOMPurify** (`src/lib/sanitize/sanitizeHtml.ts`), que remove qualquer atributo/comando perigoso. Aplicado na exibição e na gravação. |
| H-3 | Pedidos falsos / spam | **Alto** | Qualquer um na internet criava pedidos direto no banco, com valores falsos, fugindo das validações. | Porta fechada via migration: todo pedido público passa pela função validada `create_catalog_order`. |
| H-1 | Admin com acesso frágil | **Alto** | Admin era liberado por um e-mail fixo (`manager@lapamarketplace.com.br`) de um domínio que nem é o do site. | E-mail de admin corrigido para `manager@lapamarketplace.com.br` (domínio seu) **+** tabela **`platform_admins`** para adicionar outros admins. |
| M-1 | Endpoint de apagar usuário exposto | **Médio** | CORS aberto (`*`) e comparação de senha vulnerável a "timing attack". | CORS travado + comparação **tempo-constante** (`delete-user-by-email`). |
| M-2 | Funções de admin sem `search_path` | **Médio** | Risco de escalonamento de privilégio nas funções `SECURITY DEFINER`. | `search_path` fixado nas funções de admin (migration). |
| M-3 | Upload de arquivo sem limite | **Médio** | Dava pra subir qualquer arquivo, de qualquer tamanho, num bucket público. | Migration limita a **imagens (JPG/PNG/WebP/GIF) até 5 MB**. |
| M-4 | Vendedor via dados demais | **Médio** | Qualquer vendedor via **todos** os clientes (com CPF, telefone, e-mail) e pedidos. | Migration: vendedor só vê **o que é dele**; dono continua vendo tudo. |
| L-2 | Função de cadastro quebrada | **Baixo** | `signup-notification` importava algo inexistente. | Adicionado o helper `requireAuth` (`_shared/auth.ts`). |
| L-3 | Vazamento de dados da loja | **Baixo** | Visitante anônimo lia `owner_id` e `cnpj` da loja. | Migration esconde esses campos do público (`queries.ts` ajustado junto). |
| L-5 | Webhook do Stripe (corrida) | **Baixo** | Pequena chance de processar o mesmo evento 2x. | Gravação tornada "à prova de conflito" (`stripe-webhook`). |
| L-6 | Dependência vulnerável | **Baixo** | Biblioteca `ws` com falha conhecida. | `npm audit fix` → **0 vulnerabilidades**. |
| L-1 | `.env` fora do `.gitignore` | **Baixo** | `.env` poderia ser commitado por engano. | `.gitignore` atualizado. |
| — | Config das functions | Hardening | Não havia `config.toml` versionado definindo quem exige login. | Criado `supabase/config.toml` com `verify_jwt` explícito por função. |

---

## 📂 Parte 2 — Arquivos alterados / criados

**Código (front-end e edge functions) — já aplicado:**
- `src/lib/supabase/client.ts` — sessão isolada por origem (C-1)
- `src/lib/sanitize/sanitizeHtml.ts` *(novo)* — sanitização com DOMPurify (C-1/H-2)
- `src/routes/store/ProductPage.tsx` — usa o sanitizador na descrição (H-2)
- `src/features/products/api/mutations.ts` — sanitiza ao salvar (H-2)
- `src/features/catalog/api/queries.ts` — consulta pública sem `select('*')` (L-3)
- `supabase/functions/_shared/auth.ts` — novo `requireAuth` (L-2)
- `supabase/functions/delete-user-by-email/index.ts` — CORS travado + compare seguro (M-1)
- `supabase/functions/stripe-webhook/index.ts` — idempotência à prova de conflito (L-5)
- `supabase/config.toml` *(novo)* — `verify_jwt` por função
- `.gitignore` — ignora `.env`, `.vite`, `supabase/.temp` (L-1)

**Migrations criadas (ainda NÃO aplicadas — ver Parte 3):**
- `supabase/migrations/20260529100000_security_drop_public_order_insert.sql` (H-3)
- `supabase/migrations/20260529110000_security_platform_admins_and_search_path.sql` (H-1 + M-2)
- `supabase/migrations/20260529120000_security_storage_bucket_limits.sql` (M-3)
- `supabase/migrations/20260529130000_security_seller_scoped_rls.sql` (M-4)
- `supabase/migrations/20260529140000_security_public_stores_column_scope.sql` (L-3)

---

## 📋 Parte 3 — O QUE VOCÊ PRECISA FAZER (passo a passo)

> ⚠️ **Regra de ouro:** faça tudo primeiro em **staging** (teste), confirme que funciona, e só depois em **produção**. Nunca direto na produção.

### Passo 1 — Aplicar as migrations (mudanças no banco)
No terminal, dentro da pasta do projeto:
```bash
npm run db:push     # aplica as 5 migrations
npm run db:types    # atualiza os tipos do TypeScript
```
*O que faz:* liga as proteções de banco (pedidos, admin, upload, vendedores, colunas da loja).

### Passo 2 — Acesso de administrador
A conta **`lapamarketplace@gmail.com`** já foi configurada como admin na tabela `platform_admins`. A função `is_admin()` agora verifica essa tabela em vez de um e-mail fixo.

➕ **Para adicionar `manager@lapamarketplace.com.br` como admin:**
1. Primeiro, essa conta precisa ser criada via signup normal no site
2. Depois, no painel do Supabase → **SQL Editor**, rode:
```sql
insert into public.platform_admins (user_id, email)
select id, email
from auth.users
where email = 'manager@lapamarketplace.com.br'
on conflict (email) do nothing;
```

➕ **Para adicionar OUTROS admins** (opcional), troque pelo e-mail desejado e rode o mesmo comando acima.

### Passo 3 — Reenviar as Edge Functions
```bash
supabase functions deploy stripe-webhook
supabase functions deploy delete-user-by-email
supabase functions deploy signup-notification
```

### Passo 4 — Testar 2 mudanças de comportamento
- **"Modo dono" / pré-visualização da loja:** antes você aparecia logado ao abrir sua loja pública; **agora não mais** (era a brecha de segurança). Teste se algo dependia disso. A pré-visualização deve ser feita dentro do painel.
- **Vendedor restrito:** entre como vendedor e confirme que ele vê só os clientes/pedidos atribuídos a ele; confirme que o **dono** continua vendo tudo.

### Passo 5 — Conferir o "apagar usuário"
A função `delete-user-by-email` agora exige um crachá (JWT) válido no `Authorization`, além da senha-token. Como seu projeto usa o formato novo de chave (`sb_publishable_…`, que **não** é um JWT):
- **Ou** chame com uma chave `service_role` de verdade no cabeçalho `Authorization`;
- **Ou**, se atrapalhar, abra `supabase/config.toml` e mude **só nessa função** para `verify_jwt = false` (a senha-token continua protegendo).
- Se você nunca usou essa função na mão, pode deixar como está.

---

## 🟡 Parte 4 — Recomendações futuras (não urgentes)

1. **Repensar o GTM por loja:** deixar cada lojista colocar um GTM permite a ele rodar scripts no próprio subdomínio. Com os logins isolados (C-1) o risco caiu muito, mas vale revisar.
2. **Confirmar o e-mail `manager@lapamarketplace.com.br`:** garantir que a caixa de e-mail existe e está sob seu controle (é a conta que tem acesso de admin).
3. **Atenção ao adicionar colunas novas na tabela `stores`:** se a coluna precisar aparecer no catálogo público, adicione-a nos **dois** lugares — no `GRANT` da migration `...140000` e na constante `PUBLIC_STORE_COLUMNS` em `src/features/catalog/api/queries.ts`. Senão a loja pública não enxerga o campo (isso é proposital: por segurança, campo novo nasce escondido).

---

## ✔️ Checklist rápido

| O que | Quem faz | Status |
|---|---|---|
| Correções no código | Claude | ✅ Pronto |
| Migrations aplicadas (via MCP) | Claude | ✅ Feito |
| Types gerados (via MCP) | Claude | ✅ Feito |
| Tabela `platform_admins` criada + `is_admin()` atualizado | Claude | ✅ Feito |
| Admin atual: `lapamarketplace@gmail.com` | — | ✅ Configurado |
| `manager@lapamarketplace.com.br` como admin | **Você** | ⬜ (precisa criar conta via signup primeiro) |
| Edge functions redeployadas (4 total) | Claude | ✅ Feito |
| Testar modo-dono e vendedor | **Você** | ⬜ |
| Conferir `delete-user-by-email` | **Você** | ⬜ |
