# Etapa 3: Autenticação Unificada (Clientes & Lojistas) e Conta do Visitante

## Contexto e Regras de Negócio
O Lapa Marketplace atende tanto **Visitantes/Moradores** (que querem seguir lojas, favoritar produtos e salvar endereço para compras rápidas) quanto **Lojistas** (que gerenciam seus catálogos).
* Todos podem entrar com **Google OAuth (1 clique)** ou **E-mail e Senha**.
* O visitante **NÃO** é obrigado a criar conta para usar a sacola ou chamar no WhatsApp, mas é incentivado a entrar quando clica em "Favoritar ❤️" ou "Seguir Loja".

---

## Tarefas desta Etapa para o Agente (Antigravity)

### 1. Server Actions e Callback de Auth (`app/(auth)/`)
* **`app/auth/callback/route.ts`:** Rota GET para processar o código OAuth do Google (`exchangeCodeForSession`) e redirecionar de forma inteligente:
  * Se o usuário já possui loja em `public.stores`, ou se a intenção inicial era `merchant`, verifica se tem loja -> se sim, vai para `/painel`; se não, vai para `/onboarding`.
  * Se for cliente (`customer`), redireciona de volta para a vitrine (`/`) ou `/minha-conta`.
* **`app/(auth)/actions.ts`:**
  * `loginWithEmail(formData)`
  * `signupWithEmail(formData)` (recebendo `full_name`, `email`, `password` e `account_type`: `'customer' | 'merchant'`)
  * `requestPasswordReset(formData)` (`supabase.auth.resetPasswordForEmail`)
  * `updatePassword(formData)` (`supabase.auth.updateUser`)
  * `signOut()`

### 2. Páginas de Autenticação (`app/(auth)/`)
Usar os componentes da Etapa 2 (`Button`, `Input`) em um card centralizado `max-w-md mx-auto rounded-3xl bg-white p-8 shadow-sm border border-slate-100`:
* **`/login/page.tsx`:** Botão em destaque `"Continuar com o Google"`, divisor `"ou entre com seu e-mail"`, campos de e-mail/senha e link para `/recuperar-senha` e `/cadastro`.
* **`/cadastro/page.tsx`:** Seletor visual em pílulas no topo: **"Quero Comprar em Lapa"** vs **"Sou Lojista / Quero Vender"**. Botão do Google + formulário rápido.
* **`/recuperar-senha/page.tsx` e `/nova-senha/page.tsx`:** Fluxo completo e amigável para redefinição de senha.

### 3. Área do Visitante e Ações Sociais (`app/minha-conta/` e `app/actions/social.ts`)
* **Server Actions (`app/actions/social.ts`):**
  * `toggleSaveProduct(productId)`: Insere ou remove de `public.saved_products`. Se não estiver logado, retorna `{ requiresAuth: true }` para abrir um modal convidando a logar com 1 clique.
  * `toggleFollowStore(storeId)`: Insere ou remove de `public.followed_stores`.
  * `updateCustomerProfile(formData)`: Atualiza `full_name`, `whatsapp`, `default_neighborhood_id` e `default_address` na tabela `public.profiles` (esses dados preencherão a Sacola automaticamente na Etapa 7).
* **Página `/minha-conta/page.tsx`:**
  * Aba **Meus Favoritos:** Grid com todas as peças favoritadas pelo usuário.
  * Aba **Lojas que Sigo:** Lista das lojas de Bom Jesus da Lapa que o usuário acompanha.
  * Aba **Meus Dados de Entrega:** Formulário com Nome, WhatsApp, Bairro (select puxando de `public.neighborhoods`) e Endereço padrão.
  * Botão `"Quero abrir minha loja no Lapa Marketplace"` (leva para `/onboarding`).

---

## Prompt de Comando para o Antigravity
> "Leia `@docs/etapa-3-autenticacao-perfis.md` e implemente o fluxo completo de autenticação (E-mail/Senha + Google OAuth), recuperação de senha, as Server Actions de seguir/favoritar e a página `/minha-conta`."

