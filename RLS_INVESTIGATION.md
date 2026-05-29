# Investigação do Erro 401 na Criação de Pedidos

## Contexto
Erro reportado: `POST https://sxpptsimxbspmcjmphas.supabase.co/rest/v1/orders?select=* 401 (Bad Request)`

## Projeto Supabase
- **Nome:** Lapa Marketplace
- **ID:** sxpptsimxbspmcjmphas
- **URL:** https://sxpptsimxbspmcjmphas.supabase.co
- **Região:** sa-east-1 (São Paulo)

## Testes Realizados

### 1. Verificação Inicial de Políticas RLS
**Ação:** Verificadas políticas existentes nas tabelas `orders` e `order_items`

**Resultado:** 
- `orders`: Política `orders_public_insert` existente com verificação complexa
- `order_items`: Política `order_items_public_insert` existente com verificação de status do pedido

**Status:** ❌ Não funcionou (erro 401 persistiu)

### 2. Primeira Tentativa de Correção - Simplificação da Política
**Ação:** Atualizada política `orders_public_insert` para:
```sql
CREATE POLICY "orders_public_insert"
ON orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'::order_status 
  AND EXISTS (
    SELECT 1 FROM stores s 
    WHERE s.id = orders.store_id 
    AND s.deleted_at IS NULL
  )
);
```

**Resultado:** ❌ Não funcionou (erro 401 persistiu)

### 3. Teste com RLS Desabilitado (orders)
**Ação:** `ALTER TABLE orders DISABLE ROW LEVEL SECURITY;`

**Resultado:** 
- `orders`: ✅ POST 201 (funcionou)
- `order_items`: ❌ POST 401 (falhou)

**Conclusão:** O problema não estava apenas em `orders`, mas também em `order_items`

### 4. Teste com RLS Desabilitado (ambas tabelas)
**Ação:** 
```sql
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
```

**Resultado:** ✅ Funcionou completamente (ambos POST 201)

**Conclusão:** O problema está definitivamente nas políticas RLS

### 5. Reabilitação com Políticas Simplificadas
**Ação:** Reabilitado RLS com políticas simplificadas (sem verificações):
```sql
CREATE POLICY "orders_public_insert"
ON orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "order_items_public_insert"
ON order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

**Resultado:** ❌ Não funcionou (erro 401 persistiu)

### 6. Verificação de Triggers
**Ação:** Verificados triggers nas tabelas `orders` e `order_items`

**Triggers encontrados em `orders`:**
- `RI_ConstraintTrigger_c_*` (triggers de foreign key - internos)
- `orders_set_updated_at` (trigger personalizado)
- `orders_notify_new` (trigger de notificação)
- Outros triggers de constraint

**Ação:** Desabilitado trigger `orders_notify_new` temporariamente

**Resultado:** ❌ Não funcionou (erro 401 persistiu)

### 7. Estado Atual - RLS Desabilitado
**Ação:** RLS desabilitado em ambas as tabelas para permitir funcionamento temporário

**Resultado:** ✅ Funcionando

### 8. Validação com Supabase MCP - 2026-05-26
**Ação:** Verificado o estado atual do banco via Supabase MCP.

**Resultado:**
- `orders`: RLS está desabilitado
- `order_items`: RLS está desabilitado
- As policies `orders_public_insert` e `order_items_public_insert` ainda existem com `WITH CHECK (true)`
- Existem policies de `SELECT` para membros/admin, mas não para comprador anônimo receber a linha recém-criada

**Policies relevantes encontradas:**
- `orders_public_insert`: `INSERT` para `anon, authenticated` com `WITH CHECK true`
- `order_items_public_insert`: `INSERT` para `anon, authenticated` com `WITH CHECK true`
- `orders_member_read`: `SELECT` apenas quando `is_store_member(store_id)`
- `admin_select_all_orders`: `SELECT` apenas para admin autenticado
- `order_items_member_read`: `SELECT` apenas quando o usuário é membro da loja do pedido

### 9. Validação no Código do Checkout
**Ação:** Localizado o fluxo de criação de pedidos em `src/features/orders/api/mutations.ts`.

**Resultado:** O checkout público cria pedido e itens usando `insert(...).select('*')`:

```ts
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({ ... })
  .select('*')
  .single()
```

```ts
const { data: items, error: itemsError } = await supabase
  .from('order_items')
  .insert(rows)
  .select('*')
```

**Conclusão:** Mesmo que a policy de `INSERT` permita gravar, o `.select('*')` força o PostgREST/Supabase a retornar a linha inserida. Com RLS ligado, esse retorno também precisa passar por uma policy de `SELECT`. Como comprador anônimo não tem policy de `SELECT` em `orders`/`order_items`, o retorno é bloqueado.

### 10. Teste Controlado com Role `anon`
**Ação:** Simulado `INSERT` como role `anon` dentro de uma transação com rollback, reabilitando RLS apenas dentro da transação.

**Teste 1 - INSERT sem retorno:**
```sql
begin;
alter table public.orders enable row level security;
set local role anon;

insert into public.orders (
  store_id,
  status,
  customer_name,
  customer_phone,
  total_in_cents
)
values (
  'e43fbe3e-8b42-4c6b-bf92-a0cb3b190e8b',
  'pending',
  'Teste RLS',
  '+5511999999999',
  100
);

rollback;
```

**Resultado:** ✅ Funcionou.

**Teste 2 - INSERT com `RETURNING *`:**
```sql
begin;
alter table public.orders enable row level security;
set local role anon;

insert into public.orders (
  store_id,
  status,
  customer_name,
  customer_phone,
  total_in_cents
)
values (
  'e43fbe3e-8b42-4c6b-bf92-a0cb3b190e8b',
  'pending',
  'Teste RLS',
  '+5511999999999',
  100
)
returning *;

rollback;
```

**Resultado:** ❌ Falhou com:
```text
ERROR: 42501: new row violates row-level security policy for table "orders"
```

**Conclusão:** O erro é reproduzível quando o insert tenta retornar a linha. Isso bate com a URL original do erro: `orders?select=*`.

## Análise do Problema

### O que Funcionou
- ✅ Desabilitar RLS completamente em `orders` e `order_items`
- ✅ Criação de pedidos funciona sem RLS
- ✅ `INSERT` como `anon` funciona com RLS ligado quando não há retorno (`RETURNING`/`.select('*')`)

### O que Não Funcionou
- ❌ Políticas RLS originais
- ❌ Políticas RLS simplificadas (WITH CHECK true)
- ❌ Políticas RLS para `anon` e `authenticated`
- ❌ Desabilitar trigger `orders_notify_new`
- ❌ `INSERT ... RETURNING *` como `anon` com RLS ligado

### Causa Mais Provável
O checkout público usa `.insert(...).select('*')`, o que equivale a um `INSERT ... RETURNING *`.

Com RLS ligado, não basta existir uma policy de `INSERT`; a linha retornada também precisa ser visível por uma policy de `SELECT`. Hoje as policies de `SELECT` de `orders` e `order_items` protegem corretamente os dados para membros da loja/admin, mas não permitem que o comprador anônimo leia o pedido recém-criado.

Portanto, a falha observada como `401`/`Bad Request` no frontend provavelmente é o PostgREST bloqueando o retorno da linha inserida por falta de policy de `SELECT`, não necessariamente bloqueando o `INSERT` em si.

### Causas Menos Prováveis Após a Validação
1. **Cliente Supabase sempre enviando autenticação:** ainda pode acontecer em outros fluxos, mas não explica o teste controlado com role `anon`
2. **Conflito entre policies:** menos provável, pois `WITH CHECK true` permitiu o insert sem retorno
3. **Problema com função `is_store_member`:** relevante para leitura de membros, mas não para o `INSERT` público sem retorno
4. **Caching de policies:** menos provável, pois o comportamento foi reproduzido diretamente via SQL
5. **Problema com roles:** menos provável, pois `set local role anon` funcionou conforme esperado

## Próximos Passos Sugeridos

1. **Testar o checkout em produção/staging:** criar um pedido real pelo catálogo e confirmar que ele aparece no dashboard.
2. **Revisar avisos de segurança restantes do Supabase Advisor:** existem outros avisos fora do escopo de `orders`/`order_items`, principalmente funções `SECURITY DEFINER` antigas executáveis via RPC.
3. **Considerar transação server-side no futuro:** se o checkout precisar de atomicidade total entre pedido, itens e cupom, uma Edge Function com `service_role` pode ser uma evolução.

## Estado Atual do Sistema
- **RLS em `orders`:** ✅ Habilitado
- **RLS em `order_items`:** ✅ Habilitado
- **Funcionalidade de pedidos:** ✅ Funcionando
- **Segurança:** ✅ Leitura pública de pedidos continua bloqueada; checkout público pode apenas inserir pedidos de catálogo válidos

## Correção Aplicada - 2026-05-26

### App
Arquivo alterado: `src/features/orders/api/mutations.ts`

O checkout público deixou de usar:
```ts
.insert(...).select('*')
```

Agora ele:
- gera `orderId` com `crypto.randomUUID()`
- insere `orders` sem pedir retorno
- insere `order_items` sem pedir retorno
- monta localmente o objeto do pedido para a confirmação/WhatsApp

Isso remove a necessidade de policy pública de `SELECT` em `orders` e `order_items`.

### Banco
Migrations adicionadas/aplicadas:
- `supabase/migrations/20260526120000_fix_orders_rls_checkout_returning.sql`
- `supabase/migrations/20260526121000_fix_orders_public_insert_store_check.sql`
- `supabase/migrations/20260526122000_move_order_rls_helpers_private.sql`

O que foi aplicado:
- RLS reabilitado em `public.orders`
- RLS reabilitado em `public.order_items`
- Removidas policies públicas permissivas com `WITH CHECK true`
- Criada policy pública restrita para pedidos de catálogo:
  - `status = 'pending'`
  - `source = 'catalog'`
  - `seller_id is null`
  - loja precisa existir e não estar deletada
- Criada policy autenticada para pedidos manuais de membros da loja
- Criada validação de itens em schema `private`, fora da API pública

### Validação
Teste SQL controlado com role `anon` e rollback:
- `INSERT` em `orders` sem retorno: ✅ passou
- `INSERT` em `order_items` sem retorno: ✅ passou
- RLS em `orders`: ✅ confirmado habilitado
- RLS em `order_items`: ✅ confirmado habilitado

Build do app:
```bash
npm run build
```

Resultado: ✅ passou.

## Recomendação Imediata
Correção imediata aplicada. O checkout público não depende mais de `.select('*')` após os inserts, e RLS foi religado em `orders` e `order_items`.
