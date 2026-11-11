# Google Tag Manager — Lapa Marketplace

Contêiner: **GTM-MS8T2DQV**. O site envia os eventos ao `dataLayer`, e as tags deste arquivo os repassam ao Google Analytics 4.

## Importar no GTM

1. O arquivo já sai com o ID de medição **G-2CN2GCKBX0**. Para regerar: `npm run gtm:export` (ou `GA4_MEASUREMENT_ID=G-OUTRO npm run gtm:export` para outro ID).
2. No GTM: **Administrador → Importar contêiner** → escolha `gtm/lapa-marketplace-gtm.json`.
3. Espaço de trabalho: o atual (ou um novo). Opção: **Mesclar → Renomear tags, acionadores e variáveis em conflito**.
4. Teste com **Visualizar** (Tag Assistant) navegando no site e depois clique em **Enviar** para publicar.
5. No GA4, em **Administrador → Eventos**, marque como **evento principal** os que estão com “sim” na coluna *Principal*.
6. No GA4, em **Definições personalizadas**, crie dimensões com escopo de evento para os parâmetros que quiser ver nos relatórios (`lead_source`, `store_name`, `account_type`, `content_type`…).

## Eventos

| Evento | Quando dispara | Parâmetros | E-commerce (`items`) | Principal |
|---|---|---|---|---|
| `view_item` | Abriu a página de um produto | — | sim | — |
| `add_to_cart` | Adicionou produto à sacola (ou aumentou a quantidade) | — | sim | — |
| `remove_from_cart` | Removeu produto da sacola (ou diminuiu a quantidade) | — | sim | — |
| `view_cart` | Abriu a sacola com itens | — | sim | — |
| `add_to_wishlist` | Salvou um produto nos favoritos | — | sim | — |
| `whatsapp_order` | Enviou pedido para a loja pelo WhatsApp (sacola ou botão do produto) | `lead_source`, `store_id`, `store_name` | sim | sim |
| `remove_from_wishlist` | Removeu um produto dos favoritos | `item_id` | — | — |
| `search` | Fez uma busca | `search_term` | — | — |
| `follow_store` | Seguiu uma loja | `store_id`, `store_name` | — | — |
| `unfollow_store` | Deixou de seguir uma loja | `store_id` | — | — |
| `share` | Copiou o link de um produto, loja ou catálogo | `method`, `content_type`, `item_id` | — | — |
| `sign_up` | Criou conta | `method`, `account_type` | — | sim |
| `login` | Entrou na conta | `method` | — | — |
| `logout` | Saiu da conta | — | — | — |
| `password_reset_request` | Pediu o link de redefinição de senha | — | — | — |
| `profile_updated` | Salvou os dados de entrega em Minha Conta | — | — | — |
| `store_created` | Lojista concluiu o onboarding e criou a loja | `store_name` | — | sim |
| `product_created` | Lojista publicou um produto | `item_id` | — | — |
| `product_updated` | Lojista editou um produto | `item_id` | — | — |
| `product_status_changed` | Lojista pausou ou reativou um produto | `item_id`, `is_active` | — | — |
| `story_published` | Lojista publicou um Story | — | — | — |
| `store_settings_updated` | Lojista salvou as configurações da loja | — | — | — |
| `premium_interest` | Lojista clicou para ativar o Plano Premium | `plan_tier` | — | — |

Eventos com e-commerce enviam `ecommerce.items` (`item_id`, `item_name`, `item_brand` = loja, `item_category`, `item_variant` = tamanho, `price`, `quantity`), `value` e `currency` = `BRL`.

## Mudar ou criar eventos

1. Edite `src/lib/analytics/events.json`.
2. Dispare no código com `trackEvent("nome", { ... })` (de `@/lib/analytics`). Para ações que terminam em redirect no servidor, use `queueAnalyticsEvent` (de `@/lib/analytics/server`).
3. Rode `npm run gtm:export` e importe o arquivo de novo (Mesclar → Substituir).
