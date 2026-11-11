# Etapa 4: Onboarding de Criação de Loja em 3 Minutos

## Contexto e Regras de Negócio
Quando um lojista cria conta (ou um usuário clica em "Criar minha loja"), ele acessa `/onboarding`. O objetivo é colocar a loja no ar em menos de 3 minutos usando seletores pré-definidos para garantir que os filtros do marketplace funcionem perfeitamente.

---

## Tarefas desta Etapa para o Agente (Antigravity)

### 1. Validador de Slug em Tempo Real (`app/actions/onboarding.ts`)
* **`checkSlugAvailability(slug: string)`:**
  * Higieniza a string (minúsculas, sem acentos, espaços viram hifens).
  * Verifica contra a **Blacklist de Rotas do Sistema**: `['admin', 'painel', 'master', 'api', 'login', 'cadastro', 'recuperar-senha', 'nova-senha', 'onboarding', 'sacola', 'checkout', 'explorar', 'lojas', 'minha-conta', 'termos', 'privacidade', 'www', 'app', 'lapa', 'borapralapa']`.
  * Consulta `public.stores` no Supabase para checar se o `slug` já está em uso.
* **`createStoreAction(payload)`:**
  * Cria o registro em `public.stores` com `owner_id = auth.uid()`.
  * Atualiza o `role` do usuário em `public.profiles` para `'merchant'`.
  * Redireciona para `/painel/produtos/novo?onboarding=success`.

### 2. Wizard de Onboarding em 3 Passos (`app/(auth)/onboarding/page.tsx`)
Construir uma interface limpa com barra de progresso no topo (`Passo 1 de 3`):

* **Passo 1: Identidade da Loja**
  * **Nome da Loja** (Ex: *Você Fashion Lapa*).
  * **Link do seu Catálogo:** Mostra prefixo fixo `lapamarketplace.com.br/` + input do `slug` com validação automática (debounce de 500ms) exibindo feedback verde (`"Link disponível!"`) ou vermelho (`"Este endereço já está em uso"`).
  * **Upload de Logo (Opcional):** Envio instantâneo para o bucket `lapa-imagens` com preview redondo.
  * **Descrição curta / Bio da loja.**

* **Passo 2: Localização em Lapa & WhatsApp de Vendas**
  * **WhatsApp de Atendimento:** Input com máscara `(77) 99999-9999` (salvar apenas números com DDI `55` no banco).
  * **Bairro da Loja:** `<Select/>` populado dinamicamente pela tabela `public.neighborhoods` (*Centro, São João, Parque Verde*, etc.).
  * **Endereço em Texto / Ponto de Referência:** Ex: *"Av. Manoel Novaes, 120 - Ao lado da Caixa"*.

* **Passo 3: Pagamentos, Entrega e Horário Padrão**
  * **Formas de Pagamento Aceitas (Checkboxes em formato pílula):** `Pix`, `Cartão de Crédito`, `Cartão de Débito`, `Dinheiro`, `Link de Pagamento`, `Crediário da Loja`.
  * **Informação de Parcelamento (Opcional):** Ex: *"Até 3x sem juros no cartão"*.
  * **Modalidades de Entrega:** Checkboxes para `Entrega (Delivery)` e `Retirada na Loja`, mais seletor de Taxa (`Frete Grátis`, `Taxa Fixa em R$` ou `A combinar no WhatsApp`).
  * **Horário Comercial Padrão:** Já vem pré-preenchido com o padrão comercial de Lapa (Seg-Sex `08:00 às 18:00` com intervalo `12:00 às 14:00`, Sáb `08:00 às 13:00`, Dom `Fechado`), permitindo ajuste rápido antes de finalizar.

---

## Prompt de Comando para o Antigravity
> "Leia `@docs/etapa-4-onboarding-lojista.md` e construa as Server Actions e a página `/onboarding` em 3 passos com validação de slug em tempo real, upload de logo no bucket `lapa-imagens` e seletores pré-definidos."

