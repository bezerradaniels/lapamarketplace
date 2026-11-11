# Etapa 7: Sacola Multi-Lojista (Zustand) & Checkout via WhatsApp

## Contexto e Regras de Negócio
Como o usuário pode navegar pelo Feed de Bom Jesus da Lapa e adicionar produtos de **várias lojas diferentes** na mesma sessão, a sacola agrupa os itens por loja. Cada loja possui suas próprias formas de pagamento aceitas, sua própria regra de frete e seu próprio número de WhatsApp.

---

## Tarefas desta Etapa para o Agente (Antigravity)

### 1. Store Global da Sacola (`store/useBagStore.ts`)
Criar store com **Zustand** + middleware `persist` (`localStorage` key: `'lapa-marketplace-bag'`):
* **Estrutura do Item na Sacola:**
  ```ts
  export interface BagItem {
    cartItemId: string; // product.id + selectedSize
    productId: string;
    name: string;
    slug: string;
    price: number; // Usa promotional_price se existir, senão price
    originalPrice: number;
    imageUrl: string;
    selectedSize?: string;
    quantity: number;
    store: {
      id: string;
      name: string;
      slug: string;
      whatsappNumber: string;
      acceptedPayments: string[];
      installmentInfo?: string | null;
      deliveryOptions: string[];
      deliveryFeeType: 'free' | 'fixed' | 'combine';
      fixedDeliveryFee: number;
    };
  }
  ```
* **Ações da Store:** `addItem`, `removeItem`, `updateQuantity`, `clearStoreItems(storeId)` (limpa apenas os itens da loja cujo pedido já foi enviado para o WhatsApp) e `clearAll`.
* **Importante (Prevenção de Hydration Mismatch):** Criar hook ou trava `isMounted` para qualquer componente que leia `useBagStore` no cliente.

### 2. Barra Flutuante Inferior (`components/layout/FloatingBagBar.tsx`)
* Aparece fixada na parte inferior da tela (`fixed bottom-4 inset-x-4 max-w-md mx-auto z-40`) sempre que houver pelo menos 1 item na sacola.
* Mostra total de itens, quantas lojas diferentes estão na sacola, valor total somado e botão `"Ver Sacola"`.

### 3. Página da Sacola Multi-Lojista (`app/(marketplace)/sacola/page.tsx`)
1. **Dados do Comprador (Preenchimento Único no Topo):**
   * Se o visitante estiver logado, busca automaticamente de `public.profiles` o `full_name`, `whatsapp`, `default_neighborhood_id` e `default_address`.
   * Se não estiver logado, permite preencher normalmente em campos limpos (`Seu Nome`, `Bairro em Lapa` e `Rua / Número / Referência`).
2. **Cards Agrupados por Loja:**
   * Agrupa os itens do Zustand por `store.id`.
   * Para **cada loja** na sacola, renderiza um Card completo (`rounded-3xl bg-white p-5 border border-slate-100 shadow-sm mb-6`) contendo:
     * **Cabeçalho da Loja:** Nome da loja + link para adicionar mais itens daquela loja.
     * **Lista de Produtos daquela Loja:** Miniatura, nome, tamanho escolhido, preço e seletor `- 1 +`.
     * **Seletor de Entrega exclusivo da Loja:** Pílulas apenas com as opções que aquela loja oferece (`Entrega` ou `Retirada na Loja`) + cálculo automático da taxa (Grátis, valor fixo somado ao subtotal ou aviso `"Taxa a combinar no Zap"`).
     * **Seletor de Forma de Pagamento exclusivo da Loja:** Exibe apenas os métodos presentes em `store.acceptedPayments` (ex: *Pix, Cartão, Dinheiro, Crediário*) + aviso de parcelamento `store.installmentInfo`.
     * **Resumo Financeiro e Botão de Disparo:** Subtotal dos produtos + Frete = Total da Loja, seguido do botão verde `"Enviar Pedido para [Nome da Loja] no WhatsApp"`.

### 4. Contabilização de Cliques e Formatação da Mensagem (`app/actions/checkout.ts`)
* Ao clicar em `"Enviar Pedido no WhatsApp"`:
  1. Dispara Server Action `registerWhatsappOrderClick(productIds)` que incrementa `clicks_whatsapp = clicks_whatsapp + 1` na tabela `public.products` para dar visibilidade de ROI ao lojista no painel dele.
  2. Monta a mensagem formatada e codificada com `encodeURIComponent`:
     * Cabeçalho: `*Novo Pedido via Lapa Marketplace* 🛍️`
     * Lista numerada com quantidade, nome da peça, tamanho (se houver) e subtotal.
     * Modalidade (Entrega com endereço completo e bairro de Lapa, ou Retirada na loja).
     * Forma de pagamento escolhida pelo cliente.
     * Valor Total.
  3. Abre `https://wa.me/55${cleanPhone}?text=${encodedMessage}` em nova aba e oferece opção de remover os itens daquela loja da sacola.

---

## Prompt de Comando para o Antigravity
> "Leia `@docs/etapa-7-sacola-multi-lojista.md` e implemente a store `useBagStore.ts`, a barra flutuante `FloatingBagBar.tsx`, a Server Action de contabilização de cliques e a página `/sacola` agrupando os pedidos e formas de pagamento por lojista."