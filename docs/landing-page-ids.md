# Mapeamento de IDs — Landing Page

IDs únicos aplicados a todos os botões e links da landing page (`/`).
Convenção: `lp-{seção}-{elemento}`.

---

## Navbar (`MarketingNavbar.tsx`)

| ID | Elemento | Texto | Destino |
|----|----------|-------|---------|
| `lp-nav-logo` | Link | Logo Zapable | `/` |
| `lp-nav-link-como-funciona` | `<a>` | Como funciona | `#como-funciona` |
| `lp-nav-link-funcionalidades` | `<a>` | Funcionalidades | `#funcionalidades` |
| `lp-nav-link-precos` | `<a>` | Preços | `#precos` |
| `lp-nav-link-faq` | `<a>` | Dúvidas | `#faq` |
| `lp-nav-btn-login` | Button | Entrar | `/auth/login` |
| `lp-nav-btn-signup` | Button | Começar grátis | `/auth/signup` |
| `lp-nav-btn-dashboard` | Button | Ir para o Dashboard | `/dashboard` (usuário logado) |

---

## Hero (`LandingPage.tsx → Hero`)

| ID | Elemento | Texto | Destino |
|----|----------|-------|---------|
| `lp-hero-cta-signup` | Link/Button | Começar grátis por 14 dias | `/auth/signup` |

---

## Como funciona (`LandingPage.tsx → HowItWorks`)

| ID | Elemento | Texto | Destino |
|----|----------|-------|---------|
| `lp-how-cta-signup` | Link/Button | Quero criar minha loja agora | `/auth/signup` |

---

## Funcionalidades (`LandingPage.tsx → Features`)

| ID | Elemento | Texto | Destino |
|----|----------|-------|---------|
| `lp-features-cta-signup` | Link/Button | Começar grátis agora | `/auth/signup` |

---

## Preview do produto (`LandingPage.tsx → ProductPreview`)

| ID | Elemento | Texto | Destino |
|----|----------|-------|---------|
| `lp-preview-cta-signup` | Link/Button | Criar minha conta grátis | `/auth/signup` |

---

## Planos e preços

### Seção (`LandingPage.tsx → PricingSection`)

| ID | Elemento | Texto | Destino |
|----|----------|-------|---------|
| `lp-pricing-link-faq` | `<a>` | Veja as perguntas frequentes | `#faq` |

### Tabela de planos (`_shared/PricingTable.tsx`)

| ID | Elemento | Texto | Plano | Destino |
|----|----------|-------|-------|---------|
| `lp-pricing-btn-basico` | Link/Button | Começar grátis | Básico (R$ 4,99/mês) | `/auth/signup` |
| `lp-pricing-btn-pro` | Link/Button | Começar grátis | Pro (R$ 9,99/mês) | `/auth/signup` |
| `lp-pricing-btn-premium` | Link/Button | Começar grátis | Premium (R$ 29,99/mês) | `/auth/signup` |

---

## FAQ (`LandingPage.tsx → FAQ`)

| ID | Elemento | Descrição |
|----|----------|-----------|
| `lp-faq-toggle-1` | button | Pergunta: "Preciso saber de tecnologia para usar o Zapable?" |
| `lp-faq-toggle-2` | button | Pergunta: "Como meus clientes fazem pedidos?" |
| `lp-faq-toggle-3` | button | Pergunta: "O que acontece após os 14 dias de teste?" |
| `lp-faq-toggle-4` | button | Pergunta: "Posso trocar de plano ou cancelar quando quiser?" |
| `lp-faq-toggle-5` | button | Pergunta: "A loja fica acessível pelo celular?" |
| `lp-faq-toggle-6` | button | Pergunta: "Quais formas de pagamento são aceitas para o plano?" |

| ID | Elemento | Texto | Destino |
|----|----------|-------|---------|
| `lp-faq-cta-signup` | Link/Button | Começar gratuitamente | `/auth/signup` |

---

## CTA final (`LandingPage.tsx → FinalCTA`)

| ID | Elemento | Texto | Destino |
|----|----------|-------|---------|
| `lp-final-cta-signup` | Link/Button | Criar minha loja grátis | `/auth/signup` |

---

## Rodapé (`_shared/MarketingFooter.tsx`)

| ID | Elemento | Texto |
|----|----------|-------|
| `lp-footer-link-terms` | button | Termos de uso |
| `lp-footer-link-privacy` | button | Privacidade |
| `lp-footer-link-contact` | button | Contato |
| `lp-footer-link-status` | button | Status |

---

## Resumo por arquivo

| Arquivo | IDs adicionados |
|---------|----------------|
| `MarketingNavbar.tsx` | 8 |
| `LandingPage.tsx` | 9 (hero, how, features, preview, pricing link, faq toggles ×6, faq cta, final) |
| `_shared/PricingTable.tsx` | 3 |
| `_shared/MarketingFooter.tsx` | 4 |
| **Total** | **24** |
