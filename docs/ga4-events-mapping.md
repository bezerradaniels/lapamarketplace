# GA4 Events Mapping - Zapable

Este documento mapeia todos os eventos do Google Analytics 4 (GA4) para rastreamento de ações dos usuários no Zapable.

## Convenções de Nomenclatura

- **Event names**: `snake_case`, descritivos e concisos
- **Parameters**: `snake_case`, consistentes com o GA4
- **Categories**: Agrupamento lógico de eventos relacionados

## Categorias de Eventos

### 1. Autenticação (`auth`)

Eventos relacionados ao fluxo de autenticação e onboarding.

| Event Name | Descrição | Quando Disparar | Parâmetros |
|------------|-----------|-----------------|------------|
| `sign_up` | Usuário criou uma conta | Ao completar o cadastro com sucesso | `method: "email"` |
| `login` | Usuário fez login | Ao fazer login com sucesso | `method: "email"` |
| `logout` | Usuário fez logout | Ao fazer logout | - |
| `onboarding_started` | Usuário iniciou o onboarding | Ao acessar o primeiro passo do onboarding | `step: 1` |
| `onboarding_completed` | Usuário completou o onboarding | Ao finalizar o último passo do onboarding | `total_time_seconds: <tempo>` |
| `onboarding_step_completed` | Usuário completou um passo do onboarding | Ao completar cada passo do onboarding | `step: <número>`, `step_name: "<nome>"` |

### 2. Loja (`store`)

Eventos relacionados à criação e configuração da loja.

| Event Name | Descrição | Quando Disparar | Parâmetros |
|------------|-----------|-----------------|------------|
| `store_created` | Loja criada com sucesso | Ao criar a loja (Onboarding Step 1) | `store_id`, `store_name`, `store_slug` |
| `store_logo_uploaded` | Logo da loja adicionada | Ao fazer upload do logo (Onboarding Step 2) | `store_id` |
| `store_cover_uploaded` | Capa da loja adicionada | Ao fazer upload da capa (Onboarding Step 2) | `store_id` |
| `store_color_updated` | Cor da loja atualizada | Ao atualizar a cor primária (Onboarding Step 2) | `store_id`, `color: "#hex"` |
| `store_updated` | Informações da loja atualizadas | Ao atualizar dados da loja (nome, WhatsApp, endereço) | `store_id`, `field: "<campo>"` |
| `store_deleted` | Loja excluída | Ao excluir a loja | `store_id` |

### 3. Produtos (`product`)

Eventos relacionados ao gerenciamento de produtos.

| Event Name | Descrição | Quando Disparar | Parâmetros |
|------------|-----------|-----------------|------------|
| `product_created` | Produto criado | Ao criar um novo produto | `product_id`, `product_name`, `store_id`, `has_image: <bool>`, `has_variations: <bool>` |
| `product_updated` | Produto atualizado | Ao editar um produto existente | `product_id`, `product_name`, `store_id`, `updated_fields: ["campo1", "campo2"]` |
| `product_deleted` | Produto excluído | Ao excluir um produto | `product_id`, `product_name`, `store_id` |
| `product_image_added` | Imagem de produto adicionada | Ao adicionar imagem ao produto | `product_id`, `image_count: <n>` |
| `product_image_removed` | Imagem de produto removida | Ao remover imagem do produto | `product_id`, `image_count: <n>` |
| `product_bulk_created` | Produtos criados em massa | Ao criar múltiplos produtos via CSV | `store_id`, `product_count: <n>` |
| `product_variation_added` | Variação de produto adicionada | Ao adicionar variação ao produto | `product_id`, `variation_name` |

### 4. Cupons (`coupon`)

Eventos relacionados ao gerenciamento de cupons.

| Event Name | Descrição | Quando Disparar | Parâmetros |
|------------|-----------|-----------------|------------|
| `coupon_created` | Cupom criado | Ao criar um novo cupom | `coupon_id`, `coupon_code`, `discount_type: "<percent|fixed>"`, `discount_value: <valor>` |
| `coupon_updated` | Cupom atualizado | Ao editar um cupom existente | `coupon_id`, `coupon_code` |
| `coupon_deleted` | Cupom excluído | Ao excluir um cupom | `coupon_id`, `coupon_code` |
| `coupon_applied` | Cupom aplicado no checkout | Ao aplicar cupom no carrinho | `coupon_code`, `discount_value: <valor>` |
| `coupon_removed` | Cupom removido do checkout | Ao remover cupom do carrinho | `coupon_code` |

### 5. Vendedores (`seller`)

Eventos relacionados ao gerenciamento de vendedores.

| Event Name | Descrição | Quando Disparar | Parâmetros |
|------------|-----------|-----------------|------------|
| `seller_created` | Vendedor criado | Ao criar um novo vendedor | `seller_id`, `seller_name`, `catalog_slug`, `has_dashboard_access: <bool>` |
| `seller_updated` | Vendedor atualizado | Ao editar um vendedor existente | `seller_id`, `seller_name` |
| `seller_deleted` | Vendedor excluído | Ao excluir um vendedor | `seller_id`, `seller_name` |

### 6. Clientes (`customer`)

Eventos relacionados ao gerenciamento de clientes.

| Event Name | Descrição | Quando Disparar | Parâmetros |
|------------|-----------|-----------------|------------|
| `customer_created` | Cliente criado | Ao criar um novo cliente | `customer_id`, `customer_name`, `customer_phone` |
| `customer_updated` | Cliente atualizado | Ao editar um cliente existente | `customer_id`, `customer_name` |
| `customer_deleted` | Cliente excluído | Ao excluir um cliente | `customer_id`, `customer_name` |
| `customer_bulk_imported` | Clientes importados em massa | Ao importar clientes via CSV | `customer_count: <n>` |

### 7. Pedidos (`order`)

Eventos relacionados ao fluxo de pedidos.

| Event Name | Descrição | Quando Disparar | Parâmetros |
|------------|-----------|-----------------|------------|
| `order_created` | Pedido criado | Ao finalizar o checkout com sucesso | `order_id`, `store_id`, `total_value: <valor>`, `item_count: <n>`, `has_coupon: <bool>` |
| `order_updated` | Pedido atualizado | Ao editar um pedido existente | `order_id`, `updated_fields: ["campo1"]` |
| `order_deleted` | Pedido excluído | Ao excluir um pedido | `order_id` |
| `order_status_changed` | Status do pedido alterado | Ao alterar o status do pedido | `order_id`, `old_status: "<status>"`, `new_status: "<status>"` |
| `cart_item_added` | Item adicionado ao carrinho | Ao adicionar produto ao carrinho | `product_id`, `product_name`, `quantity: <n>`, `price: <valor>` |
| `cart_item_removed` | Item removido do carrinho | Ao remover produto do carrinho | `product_id`, `product_name`, `quantity: <n>` |
| `cart_item_quantity_updated` | Quantidade do item atualizada | Ao alterar quantidade no carrinho | `product_id`, `old_quantity: <n>`, `new_quantity: <n>` |
| `checkout_started` | Checkout iniciado | Ao acessar a página de checkout | `item_count: <n>`, `subtotal: <valor>` |
| `checkout_completed` | Checkout completado | Ao completar o pedido com sucesso | `order_id`, `total_value: <valor>`, `payment_method: "whatsapp"` |

### 8. Categorias (`category`)

Eventos relacionados ao gerenciamento de categorias.

| Event Name | Descrição | Quando Disparar | Parâmetros |
|------------|-----------|-----------------|------------|
| `category_created` | Categoria criada | Ao criar uma nova categoria | `category_id`, `category_name`, `parent_id: <id|null>` |
| `category_updated` | Categoria atualizada | Ao editar uma categoria existente | `category_id`, `category_name` |
| `category_deleted` | Categoria excluída | Ao excluir uma categoria | `category_id`, `category_name` |

### 9. Perfil (`profile`)

Eventos relacionados ao perfil do usuário.

| Event Name | Descrição | Quando Disparar | Parâmetros |
|------------|-----------|-----------------|------------|
| `profile_updated` | Perfil atualizado | Ao atualizar informações do perfil | `updated_fields: ["name", "whatsapp_phone"]` |
| `profile_avatar_updated` | Avatar do perfil atualizado | Ao atualizar foto de perfil | `has_avatar: <bool>` |
| `account_deleted` | Conta excluída | Ao excluir a conta do usuário | `user_id` |

### 10. Faturamento (`billing`)

Eventos relacionados ao faturamento e planos.

| Event Name | Descrição | Quando Disparar | Parâmetros |
|------------|-----------|-----------------|------------|
| `pricing_page_viewed` | Página de preços visualizada | Ao acessar a página de preços | `plan_tier: "<tier>"` |
| `trial_started` | Teste gratuito iniciado | Ao iniciar o período de teste | `plan_tier: "<tier>"`, `trial_days: <n>` |
| `subscription_started` | Assinatura iniciada | Ao assinar um plano pago | `plan_tier: "<tier>"`, `billing_cycle: "<monthly|yearly>"` |
| `subscription_upgraded` | Assinatura atualizada | Ao fazer upgrade de plano | `old_tier: "<tier>"`, `new_tier: "<tier>"` |
| `subscription_downgraded` | Assinatura reduzida | Ao fazer downgrade de plano | `old_tier: "<tier>"`, `new_tier: "<tier>"` |
| `subscription_cancelled` | Assinatura cancelada | Ao cancelar a assinatura | `plan_tier: "<tier>"` |

### 11. Engajamento (`engagement`)

Eventos relacionados ao engajamento do usuário.

| Event Name | Descrição | Quando Disparar | Parâmetros |
|------------|-----------|-----------------|------------|
| `store_viewed` | Loja visualizada | Ao acessar a página de uma loja | `store_id`, `store_slug` |
| `product_viewed` | Produto visualizado | Ao acessar a página de um produto | `product_id`, `product_name`, `store_id` |
| `search_performed` | Busca realizada | Ao realizar busca no catálogo | `search_term: "<termo>"`, `result_count: <n>` |
| `share_link_copied` | Link de compartilhamento copiado | Ao copiar link de compartilhamento | `link_type: "<store|product|seller>"`, `item_id: <id>` |

## Implementação

### Configuração Inicial

#### Opção 1: Instalação Direta via gtag.js

1. **Instalar o gtag.js:**

```html
<!-- Adicionar no head do index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

#### Opção 2: Instalação via Google Tag Manager (GTM)

**Recomendado** - Permite gerenciamento centralizado de tags e eventos.

1. **Criar conta no Google Tag Manager:**
   - Acesse [Google Tag Manager](https://tagmanager.google.com/)
   - Clique em "Criar conta"
   - Preencha os dados da conta e do container
   - Tipo de container: "Web"
   - Clique em "Criar"

2. **Instalar o GTM no site:**

```html
<!-- Adicionar no head do index.html, logo após <head> -->
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

```html
<!-- Adicionar no body do index.html, logo após <body> -->
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

3. **Configurar a tag do GA4 no GTM:**
   - No GTM, clique em "Tags" > "Nova"
   - Nome: "GA4 Configuration"
   - Configuração da tag: "Google Analytics: GA4 Configuration"
   - Measurement ID: `G-XXXXXXXXXX`
   - Acionamento: "All Pages"
   - Clique em "Salvar"

4. **Configurar eventos personalizados no GTM:**

   **Opção A: Via Data Layer (Recomendado)**

   - No código do app, envie eventos para a Data Layer:
   ```typescript
   // src/lib/analytics.ts
   export function trackEvent({ eventName, parameters }: AnalyticsEvent) {
     if (typeof window === 'undefined') {
       return
     }

     if (import.meta.env.DEV) {
       console.log('[GA4 Event]', eventName, parameters)
       return
     }

     window.dataLayer = window.dataLayer || []
     window.dataLayer.push({
       event: eventName,
       ...parameters,
     })
   }
   ```

   - No GTM, crie uma variável de Data Layer:
     - Nome: `event_name`
     - Tipo de variável: "Data Layer Variable"
     - Nome da variável da Data Layer: `event`

   - Crie uma tag para cada evento:
     - Nome: "GA4 Event - product_created"
     - Configuração da tag: "Google Analytics: GA4 Event"
     - Measurement ID: `G-XXXXXXXXXX`
     - Nome do evento: `{{event_name}}`
     - Parâmetros: Adicione os parâmetros como variáveis
     - Acionamento: "Custom Event" > `{{event_name}}`

   **Opção B: Via Custom Event no GTM**

   - No GTM, crie um acionador:
     - Nome: "Custom Event - product_created"
     - Tipo: "Custom Event"
     - Nome do evento: `product_created`

   - Crie uma tag:
     - Nome: "GA4 Event - product_created"
     - Configuração da tag: "Google Analytics: GA4 Event"
     - Measurement ID: `G-XXXXXXXXXX`
     - Nome do evento: `product_created`
     - Parâmetros: Configure conforme necessário
     - Acionamento: "Custom Event - product_created"

5. **Publicar as alterações:**
   - Clique em "Enviar" no canto superior direito
   - Adicione uma descrição das mudanças
   - Clique em "Publicar"

6. **Testar com o Preview Mode:**
   - No GTM, clique em "Preview"
   - Abra seu site em uma nova aba
   - Verifique se os eventos aparecem no Tag Assistant

### Criar Utilitário de Analytics

```typescript
// src/lib/analytics.ts

declare global {
  interface Window {
    dataLayer: any[]
  }
}

export interface AnalyticsEvent {
  eventName: string
  parameters?: Record<string, string | number | boolean>
}

export function trackEvent({ eventName, parameters }: AnalyticsEvent) {
  if (typeof window === 'undefined' || !window.gtag) {
    return
  }

  // Em desenvolvimento, log no console
  if (import.meta.env.DEV) {
    console.log('[GA4 Event]', eventName, parameters)
    return
  }

  // Em produção, enviar para GA4
  window.gtag('event', eventName, parameters)
}

export function trackPageView(pagePath: string, pageTitle: string) {
  if (typeof window === 'undefined' || !window.gtag) {
    return
  }

  if (import.meta.env.DEV) {
    console.log('[GA4 PageView]', pagePath, pageTitle)
    return
  }

  window.gtag('event', 'page_view', {
    page_location: window.location.href,
    page_path: pagePath,
    page_title: pageTitle,
  })
}
```

### Exemplos de Uso

#### Exemplo 1: Criar Produto

```typescript
// src/features/products/components/ProductForm.tsx
import { trackEvent } from '@/lib/analytics'

const onSubmit = async (values) => {
  const product = await createProduct.mutateAsync(values)
  
  trackEvent({
    eventName: 'product_created',
    parameters: {
      product_id: product.id,
      product_name: product.name,
      store_id: storeId,
      has_image: product.images?.length > 0,
      has_variations: product.variations?.length > 0,
    },
  })
  
  navigate(ROUTES.dashboardProducts)
}
```

#### Exemplo 2: Aplicar Cupom

```typescript
// src/features/cart/hooks/useApplyCoupon.ts
import { trackEvent } from '@/lib/analytics'

const applyCoupon = async (code: string) => {
  const coupon = await applyCouponCode(code)
  
  trackEvent({
    eventName: 'coupon_applied',
    parameters: {
      coupon_code: coupon.code,
      discount_value: coupon.discount_value,
    },
  })
}
```

#### Exemplo 3: Completar Onboarding

```typescript
// src/features/onboarding/components/OnboardingStep4.tsx
import { trackEvent } from '@/lib/analytics'

const onCompleteOnboarding = () => {
  const totalTime = Date.now() - onboardingStartTime
  
  trackEvent({
    eventName: 'onboarding_completed',
    parameters: {
      total_time_seconds: Math.floor(totalTime / 1000),
    },
  })
}
```

#### Exemplo 4: Checkout Completado

```typescript
// src/routes/store/CheckoutPage.tsx
import { trackEvent } from '@/lib/analytics'

const onSubmit = async (values) => {
  const order = await createOrder.mutateAsync({
    // ... dados do pedido
  })
  
  trackEvent({
    eventName: 'checkout_completed',
    parameters: {
      order_id: order.id,
      store_id: store.id,
      total_value: total,
      item_count: items.length,
      has_coupon: !!coupon,
      payment_method: 'whatsapp',
    },
  })
}
```

## Instruções para Produção

### 1. Configurar o GA4

1. Acesse [Google Analytics](https://analytics.google.com/)
2. Crie uma nova propriedade GA4
3. Copie o Measurement ID (formato: `G-XXXXXXXXXX`)
4. Substitua no `index.html`

### 2. Configurar Ambiente

```typescript
// .env.production
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

// .env.development
VITE_GA_MEASUREMENT_ID=
```

### 3. Atualizar o utilitário de analytics

```typescript
// src/lib/analytics.ts
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

export function trackEvent({ eventName, parameters }: AnalyticsEvent) {
  if (typeof window === 'undefined' || !window.gtag) {
    return
  }

  // Apenas enviar em produção se tiver MEASUREMENT_ID configurado
  if (import.meta.env.PROD && MEASUREMENT_ID) {
    window.gtag('event', eventName, parameters)
  }

  // Sempre log em desenvolvimento
  if (import.meta.env.DEV) {
    console.log('[GA4 Event]', eventName, parameters)
  }
}
```

### 4. Validar Eventos

Antes de lançar em produção:

1. **Use o DebugView do GA4:**
   - Ative o modo de debug: `gtag('config', 'G-XXXXXXXXXX', { 'debug_mode': true })`
   - Acesse: GA4 > Configurar > DebugView
   - Verifique se os eventos aparecem em tempo real

2. **Use o Tag Assistant:**
   - Instale a extensão [Google Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/vjekkmkailjeidhbcdbijlfmhpbbldce)
   - Verifique se os eventos estão sendo disparados corretamente

3. **Teste cenários principais:**
   - Fluxo completo de onboarding
   - Criação de produto
   - Criação de cupom
   - Checkout completo
   - Aplicação de cupom

### 5. Configurar Conversões

No GA4, configure os eventos como conversões:

1. Acesse: GA4 > Configurar > Eventos
2. Marque como conversão os eventos principais:
   - `sign_up`
   - `onboarding_completed`
   - `product_created`
   - `checkout_completed`
   - `subscription_started`

### 6. Configurar Audiências

Crie audiências baseadas nos eventos:

1. **Usuários que completaram onboarding:**
   - Condição: `onboarding_completed` > 0 vezes nos últimos 30 dias

2. **Usuários ativos (criaram produto):**
   - Condição: `product_created` > 0 vezes nos últimos 7 dias

3. **Usuários em risco (sem atividade):**
   - Condição: Nenhum evento nos últimos 14 dias

### 7. Configurar Dashboards

Crie dashboards personalizados no GA4 ou no Looker Studio:

- **Funil de Onboarding:** Mostra conversão em cada passo
- **Atividade de Produtos:** Quantidade de produtos criados por dia
- **Performance de Cupons:** Taxa de uso e desconto concedido
- **Volume de Pedidos:** Pedidos por dia/semana/mês

### 8. Monitoramento

Monitore regularmente:

1. **Eventos não disparando:**
   - Verifique console do navegador
   - Use DebugView

2. **Parâmetros faltando:**
   - Valide se todos os parâmetros obrigatórios estão sendo enviados

3. **Taxas de conversão:**
   - Monitore mudanças bruscas
   - Investigue quedas repentinas

## Parâmetros Padrão GA4

Além dos parâmetros customizados, o GA4 coleta automaticamente:

- `page_location`: URL da página
- `page_referrer`: URL de origem
- `page_title`: Título da página
- `campaign`: Informações da campanha UTM
- `source`: Origem do tráfego
- `medium`: Meio do tráfego
- `content`: Conteúdo da campanha
- `term`: Termo da campanha

## Boas Práticas

1. **Use nomes descritivos:** Event names devem ser auto-explicativos
2. **Seja consistente:** Use a mesma convenção de nomenclatura em todo o projeto
3. **Não envie dados sensíveis:** Nunca envie senhas, tokens, ou dados pessoais sensíveis
4. **Valide tipos:** Garanta que os parâmetros tenham os tipos corretos (string, number, boolean)
5. **Teste antes de lançar:** Sempre valide os eventos em ambiente de desenvolvimento
6. **Documente mudanças:** Atualize este documento quando adicionar/remover eventos
7. **Use parâmetros customizados com moderação:** GA4 limita o número de parâmetros customizados

## Referências

- [GA4 Eventos Personalizados](https://support.google.com/analytics/answer/9267735)
- [GA4 DebugView](https://support.google.com/analytics/answer/7201382)
- [GA4 Conversions](https://support.google.com/analytics/answer/9344296)
- [GA4 Parâmetros de Evento](https://support.google.com/analytics/answer/9267544)
