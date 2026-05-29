# Implementação de Analytics — Lapa Marketplace (dataLayer → GTM → GA4)

Guia prático para **disparar eventos no app** e **configurá-los no Google Tag
Manager até chegar no GA4**.

- O **catálogo completo de eventos** (nomes, quando disparar, parâmetros) vive em
  [`ga4-events-mapping.md`](./ga4-events-mapping.md). Este documento é o **como
  implementar**.
- O catálogo está espelhado, de forma **tipada**, em
  [`src/features/analytics/events.ts`](../src/features/analytics/events.ts).

> ⚠️ Importante: o `ga4-events-mapping.md` tem exemplos antigos usando
> `window.gtag(...)`. **Ignore-os.** Este projeto usa **GTM + `dataLayer`** (não
> `gtag.js` direto). Use sempre o helper `track()` descrito abaixo.

---

## 1. Como já está montado

| Camada | Onde | Estado |
| --- | --- | --- |
| Container GTM | [`index.html`](../index.html) — `GTM-5FR2J6C7` | ✅ instalado |
| Carregamento | só após **consentimento** de cookies + on idle/interação | ✅ LGPD |
| `dataLayer` | inicializada em `index.html` antes de tudo; tipada em [`env.d.ts`](../src/types/env.d.ts) | ✅ |
| Consentimento | `localStorage['lapa_cookie_consent'] === 'accepted'` ([`CookieConsentBanner.tsx`](../src/components/CookieConsentBanner.tsx)) | ✅ |
| Módulo de eventos | [`src/features/analytics/`](../src/features/analytics) | ✅ novo |

O fluxo é: **app dá `track(...)` → push na `dataLayer` → GTM dispara a tag GA4 →
evento aparece no GA4**.

O que **falta** é (a) instrumentar os pontos do app com `track()` e (b)
configurar as tags/triggers no painel do GTM (seções 4 e 5).

---

## 2. Disparando um evento no app: `track()`

```ts
import { track } from '@/features/analytics'

track('product_created', {
  store_id: storeId,
  product_id: product.id,
  product_name: product.name,
  has_image: true,
  has_variations: false,
})

// Eventos sem parâmetros não precisam do segundo argumento:
track('logout')
```

`track()` é **totalmente tipado**: o nome do evento e o shape dos parâmetros são
validados pelo TypeScript contra `events.ts`. Nome errado ou parâmetro faltando
**não compila**.

Comportamento embutido (em [`track.ts`](../src/features/analytics/track.ts)):

- **Dev** (`npm run dev`): faz `console.log('[analytics]', ...)` em vez de
  enviar — você vê tudo no console sem sujar o GA4.
- **Produção**: só empurra para a `dataLayer` se o usuário **aceitou** os
  cookies de análise (LGPD).
- Push seguro mesmo antes do GTM carregar (a fila é reprocessada).

### Adicionar um evento novo

1. Adicione a chave + shape em
   [`events.ts`](../src/features/analytics/events.ts).
2. Documente no [catálogo](./ga4-events-mapping.md).
3. Chame `track(...)` no ponto certo do app.
4. Crie/ajuste a tag no GTM (seção 4).

**Nunca** envie dado sensível (senha, token, e-mail, telefone bruto, CPF/CNPJ).

---

## 3. Onde instrumentar — os três padrões

### 3.1 Ações do dashboard (criar produto, vendedor, cliente…) → no hook de mutation

Este é o lugar mais limpo: o `onSuccess` da mutation tem a linha já criada e só
dispara em sucesso real. **Já implementado** como referência em
[`useProductMutations.ts`](../src/features/products/hooks/useProductMutations.ts):

```ts
import { track } from '@/features/analytics'

export function useCreateProduct(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductInput) => createProduct(storeId, input),
    onSuccess: (product) => {
      track('product_created', {
        store_id: storeId,
        product_id: product.id,
        product_name: product.name,
        has_image: (product.images?.length ?? 0) > 0,
        has_variations: product.has_variations ?? false,
      })
      qc.invalidateQueries({ queryKey: productsKeys.list(storeId) })
      qc.invalidateQueries({ queryKey: productsKeys.publicList(storeId) })
    },
  })
}
```

Replique esse padrão nos demais hooks de mutation:

| Ação | Arquivo | Evento |
| --- | --- | --- |
| Criar/editar/excluir produto | `features/products/hooks/useProductMutations.ts` | ✅ feito |
| Criar/editar/excluir vendedor | `features/sellers/hooks/` | `seller_created` / `_updated` / `_deleted` |
| Criar/editar/excluir cliente | `features/customers/hooks/useCustomerMutations.ts` | `customer_created` / `_updated` / `_deleted` |
| Criar/editar/excluir categoria | `features/categories/hooks/` | `category_created` / `_updated` / `_deleted` |
| Criar/editar/excluir cupom | `features/coupons/hooks/` | `coupon_created` / `_updated` / `_deleted` |
| Criar pedido (dashboard) | `features/orders/hooks/` | `order_created` |
| Mudar status do pedido | `features/orders/hooks/` | `order_status_changed` |

### 3.2 Cliques de botão (CTAs, compartilhar, etc.) → no `onClick`

Para botões que **não** disparam uma mutation (ex.: copiar link, CTAs da landing):

```tsx
import { track } from '@/features/analytics'

<Button
  id="lp-hero-cta-signup"
  onClick={() => {
    track('share_link_copied', { link_type: 'store', item_id: store.id })
    copyToClipboard(url)
  }}
>
  Compartilhar loja
</Button>
```

> Os CTAs da landing já têm `id`s estáveis (ver
> [`landing-page-ids.md`](./landing-page-ids.md)). Para esses, prefira disparar
> **direto no GTM** por um trigger de clique no `id` (seção 4.4) — não precisa
> mexer no código.

### 3.3 Respostas de formulário (login, signup, checkout) → após sucesso

Dispare **depois** que a ação deu certo (não no submit que pode falhar):

```ts
const onSubmit = async (values) => {
  await signIn(values)        // só segue se não lançar
  track('login', { method: 'email' })
  navigate(ROUTES.dashboard)
}
```

---

## 4. Configurar o GTM (uma vez)

Acesse [tagmanager.google.com](https://tagmanager.google.com/) → container
`GTM-5FR2J6C7`. O fluxo padrão para eventos via `dataLayer` é:
**Variável → Trigger (Custom Event) → Tag (GA4 Event)**.

### 4.1 Tag base do GA4 (uma só, para todas as páginas)

1. **Tags → Nova → Google Tag** (ou "GA4 Configuration").
2. **Tag ID / Measurement ID:** `G-XXXXXXXXXX` (o ID da sua propriedade GA4 — ver seção 5).
3. **Trigger:** *Initialization - All Pages* (ou *All Pages*).
4. Salvar. Isso já manda `page_view` automaticamente.

### 4.2 Variáveis de Data Layer (uma por parâmetro que você usa)

Em **Variáveis → Nova → Variável da camada de dados**, crie uma para cada
parâmetro que quiser mandar ao GA4. Nome da variável da DL = nome do parâmetro:

`product_id`, `product_name`, `store_id`, `has_image`, `has_variations`,
`order_id`, `value`, `item_count`, `coupon_code`, `discount_value`, etc.

(Não precisa criar variável para `event` — o GTM já expõe `{{Event}}`.)

### 4.3 Tag genérica para eventos customizados (recomendado)

Em vez de uma tag por evento, faça **uma tag** que repassa qualquer evento:

1. **Trigger → Novo → Evento personalizado**
   - **Nome do evento:** `.*`
   - Marque **"Usar correspondência de regex"**
   - (Opcional) condição: `Event` **não corresponde a regex** `gtm\.js|gtm\.dom|gtm\.load`
     para não repassar eventos internos do GTM.
   - Nome do trigger: *CE - Todos eventos do app*.
2. **Tag → Nova → Google Analytics: evento do GA4**
   - **Tag de configuração:** a do passo 4.1.
   - **Nome do evento:** `{{Event}}` (repassa o nome vindo da `dataLayer`).
   - **Parâmetros do evento:** mapeie cada um para a variável da DL, ex.:
     `product_id` → `{{product_id}}`, `value` → `{{value}}`, etc.
   - **Trigger:** *CE - Todos eventos do app*.
3. Salvar.

Assim, qualquer `track('novo_evento', {...})` chega no GA4 sem criar tag nova —
basta adicionar a variável de DL nova (4.2) e mapeá-la nessa tag.

### 4.4 (Opcional) Cliques na landing sem mexer no código

Como os botões têm `id` (ver [`landing-page-ids.md`](./landing-page-ids.md)):

1. Ative as variáveis built-in de clique (**Click ID**, **Click Element**).
2. **Trigger → Clique - Todos os elementos**, condição `Click ID` igual a
   `lp-hero-cta-signup` (etc.).
3. Tag GA4 Event com nome `cta_click` e parâmetro `cta_id = {{Click ID}}`.

### 4.5 Publicar e testar

1. **Preview** (canto superior) → abra o site → confira no Tag Assistant que o
   evento dispara e os parâmetros chegam.
2. **Enviar → Publicar** com uma descrição da mudança.

---

## 5. Configurar o GA4

1. [analytics.google.com](https://analytics.google.com/) → crie/abra a
   propriedade GA4 → **Fluxo de dados (Web)** → copie o **Measurement ID**
   (`G-XXXXXXXXXX`) e use na tag base do GTM (4.1).
2. **DebugView** (Administrador → DebugView): com o Preview do GTM ligado, veja
   os eventos chegando em tempo real e cheque os parâmetros.
3. **Eventos como conversão** (Administrador → Eventos): marque os principais —
   sugestão: `sign_up`, `onboarding_completed`, `product_created`,
   `order_submitted`, `subscription_started`.
4. **Dimensões/métricas personalizadas:** parâmetros como `store_id`,
   `plan_tier`, `link_type` só aparecem em relatórios depois de registrados em
   **Administrador → Dimensões personalizadas**.

> **Por que os nomes de e-commerce?** Eventos como `view_item`, `add_to_cart`,
> `begin_checkout` usam os nomes recomendados do GA4, então os relatórios de
> e-commerce funcionam sem configuração extra. O "purchase" do GA4 equivale ao
> nosso `order_submitted` (pedido enviado ao lojista via WhatsApp).

---

## 6. Consentimento / LGPD

- O GTM **só carrega** após `localStorage['lapa_cookie_consent'] === 'accepted'`
  (lógica no `index.html` + `CookieConsentBanner.tsx`).
- O `track()` também **não envia** em produção sem esse consentimento — dupla
  proteção.
- Se quiser granularidade maior (Consent Mode v2), configure no GTM as
  permissões `analytics_storage`/`ad_storage` ligadas ao mesmo evento
  `lapa:cookie-consent-accepted`. Fora do escopo do MVP.

---

## 7. Checklist de implementação

- [x] Container GTM instalado e consent-gated (`index.html`)
- [x] Módulo tipado `src/features/analytics/` (`track` + catálogo)
- [x] Exemplo wired: produtos (`useProductMutations.ts`)
- [ ] Wire vendedores / clientes / categorias / cupons / pedidos (seção 3.1)
- [ ] Wire login / signup / checkout (seção 3.3)
- [ ] Wire vitrine pública: `view_item`, `add_to_cart`, `begin_checkout`, `order_submitted`
- [ ] GTM: tag base GA4 + tag genérica de evento + variáveis de DL (seção 4)
- [ ] GA4: Measurement ID, conversões, dimensões personalizadas (seção 5)
- [ ] Validar no DebugView e publicar o container

---

## Referências

- Catálogo de eventos: [`ga4-events-mapping.md`](./ga4-events-mapping.md)
- IDs da landing: [`landing-page-ids.md`](./landing-page-ids.md)
- [GA4 — eventos personalizados](https://support.google.com/analytics/answer/9267735)
- [GA4 — DebugView](https://support.google.com/analytics/answer/7201382)
- [GTM — variáveis da camada de dados](https://support.google.com/tagmanager/answer/6164391)
