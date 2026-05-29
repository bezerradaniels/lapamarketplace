# Identidade Visual — Zapable

> Guia de referência para uso consistente da marca em todo o produto:
> dashboard, catálogo público, landing page e materiais de marketing.

**Última atualização:** 22 de abril de 2026

---

## 1. Paleta de cores

### Cores principais

| Token             | Hex       | Uso                                              |
|-------------------|-----------|--------------------------------------------------|
| `--z-green`       | `#00a82d` | Cor principal: CTAs, links, estados ativos, logo |
| `--z-lime`        | `#95e030` | Botões sobre fundo escuro, ícone dark mode       |
| `--z-lilac`       | `#fad0f6` | Destaques, badges Premium, notificações          |
| `--z-bg`          | `#f9f6f2` | Background principal (off-white quente)          |
| `--z-bg2`         | `#f4eee5` | Background 2: cards, superfícies secundárias     |
| `--z-text`        | `#141414` | Texto principal, sidebar escura                  |

### Cores derivadas (uso em código)

| Token             | Hex       | Uso                                              |
|-------------------|-----------|--------------------------------------------------|
| `--z-text-muted`  | `#5a5a5a` | Texto secundário, descrições                     |
| `--z-text-hint`   | `#888888` | Labels, placeholders, captions                   |
| `--z-border`      | `rgba(0,0,0,0.08)` | Bordas de cards e divisores              |
| `--z-white`       | `#ffffff` | Superfície de cards sobre bg                     |

### Cores semânticas

| Situação          | Background  | Texto     | Uso                            |
|-------------------|-------------|-----------|--------------------------------|
| Sucesso / ativo   | `#00a82d`   | `#ffffff` | Badge "Ativo", pedido concluído|
| Trial             | `#fad0f6`   | `#6b006b` | Badge "Trial", contador        |
| Atenção           | `#fff3cd`   | `#7a5800` | Badge "Aguardando pagamento"   |
| Erro / suspenso   | `#ffe0e0`   | `#8b0000` | Badge "Suspenso", falha        |
| Neutro            | `#f4eee5`   | `#5a5a5a` | Badge "Básico", estados neutros|

---

## 2. Logo

### Anatomia
- **Ícone:** balão de conversa (WhatsApp) com linhas horizontais (catálogo/lista), fundo verde `#00a82d`, linhas brancas.
- **Wordmark:** "zap" em peso regular + "able" em verde `#00a82d`. Lettering: sistema sans-serif, tracking −3%.
- **Separação mínima:** 1× altura do ícone de espaço ao redor em qualquer uso.

### Variações

| Versão           | Fundo     | Ícone bg  | Texto "zap" | Texto "able" |
|------------------|-----------|-----------|-------------|--------------|
| Principal        | `#f9f6f2` | `#00a82d` | `#141414`   | `#00a82d`    |
| Dark             | `#141414` | `#00a82d` | `#f9f6f2`   | `#95e030`    |
| Ícone dark mode  | `#141414` | `#95e030` | —           | —            |

### Tamanhos mínimos
- Horizontal completo: 120px de largura mínima
- Ícone isolado: 24px × 24px mínimo
- Favicon: 32×32px (apenas ícone, sem wordmark)

---

## 3. Tipografia

O produto usa a fonte do sistema operacional (system font stack) para máxima performance em static export — sem carregamento de fonte externa no MVP.

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto,
             Helvetica, Arial, sans-serif;
```

### Escala tipográfica

| Nível       | Tamanho | Peso | Uso                                      |
|-------------|---------|------|------------------------------------------|
| Display     | 40px    | 700  | Hero da landing page                     |
| H1          | 32px    | 700  | Títulos de página no dashboard           |
| H2          | 24px    | 600  | Seções dentro de uma página              |
| H3          | 18px    | 600  | Sub-seções, títulos de card              |
| Body        | 16px    | 400  | Texto corrido, descrições                |
| Body small  | 14px    | 400  | Textos de apoio, metadados               |
| Label       | 12px    | 500  | Rótulos de campo, captions, badges       |
| Caption     | 11px    | 500  | Tags, chips, micro-labels (uppercase)    |

### Regras
- Tracking (letter-spacing): −0.03em em títulos grandes, 0 no corpo, +0.05em em labels uppercase.
- Line-height: 1.2 em títulos, 1.6 em corpo.
- Cor padrão de texto: `#141414`. Texto secundário: `#5a5a5a`. Hint: `#888`.

---

## 4. Botões

### Variantes

| Variante      | Background  | Texto     | Borda       | Contexto                         |
|---------------|-------------|-----------|-------------|----------------------------------|
| Primary       | `#00a82d`   | `#ffffff` | —           | CTA principal (fundo claro)      |
| Lime          | `#95e030`   | `#1a3d00` | —           | CTA principal (fundo escuro)     |
| Ghost         | `#f4eee5`   | `#141414` | —           | Ação secundária                  |
| Outline       | transparent | `#141414` | `#141414` 1.5px | Cancelar, ação terciária    |
| Dark ghost    | `rgba(255,255,255,0.08)` | `#f9f6f2` | — | Ações em áreas escuras     |

### Anatomia do botão
- Border-radius: 8px
- Padding: 10px 20px (default) / 8px 16px (small) / 12px 24px (large)
- Font-size: 14px, font-weight: 500
- Hover: 8% de escurecimento no background
- Active: `scale(0.98)`
- Disabled: opacidade 40%

---

## 5. Badges e status

```
Verde    #00a82d / branco    → Ativo, Pago, Publicado
Lima     #95e030 / #1a3d00   → Plano Pro (em destaque)
Lilás    #fad0f6 / #6b006b   → Plano Premium, Trial, Novo pedido
Neutro   #f4eee5 / #5a5a5a   → Plano Básico, Rascunho, Sem ação
Escuro   #141414 / #f9f6f2   → Trial (contador), info neutra dark
Amarelo  #fff3cd / #7a5800   → Aguardando, Pendente
Vermelho #ffe0e0 / #8b0000   → Suspenso, Erro, Cancelado
```

Todos os badges usam `border-radius: 999px`, `font-size: 11px`, `font-weight: 600`.

---

## 6. Componentes principais

### Card de produto (catálogo público)
- Background: `#ffffff`
- Border: `0.5px solid rgba(0,0,0,0.08)`
- Border-radius: 14px
- Imagem: background `#f4eee5`, altura 120px (mobile) / 160px (desktop)
- Nome: 14px / 500 / `#141414`
- Preço: 16px / 700 / `#00a82d`
- Botão: fundo `#00a82d`, texto branco, border-radius 7px
- Badge de desconto: posição absolute top-left, `#fad0f6` / `#6b006b`

### Sidebar do dashboard
- Background: `#141414`
- Item ativo: background `#00a82d`, texto branco
- Item hover: `rgba(255,255,255,0.06)`, texto `#cccccc`
- Item default: texto `#888888`
- Logo: wordmark "zap" `#f9f6f2` + "able" `#95e030`
- Largura: 200px (expandida) / 64px (colapsada)

### Topbar do dashboard
- Background: `#ffffff`
- Borda inferior: `0.5px solid rgba(0,0,0,0.08)`
- Altura: 56px
- Saudação: "Olá, [nome]" — 14px, `#5a5a5a`
- Notificação: ícone sino, badge `#00a82d` para contagem

---

## 7. Aplicação no CSS (variáveis globais)

Adicionar ao `src/app/globals.css`:

```css
:root {
  --z-green:      #00a82d;
  --z-lime:       #95e030;
  --z-lilac:      #fad0f6;
  --z-bg:         #f9f6f2;
  --z-bg2:        #f4eee5;
  --z-text:       #141414;
  --z-text-muted: #5a5a5a;
  --z-text-hint:  #888888;
  --z-border:     rgba(0, 0, 0, 0.08);
  --z-white:      #ffffff;

  /* Aliases para o Tailwind theme */
  --color-primary:    var(--z-green);
  --color-primary-fg: #ffffff;
  --color-primary-hover: #008f25;

  /* Per-store override (catálogo público — injetado dinamicamente) */
  --store-primary:    var(--z-green);
  --store-primary-fg: #ffffff;
  --store-primary-hover: #008f25;
}
```

No `tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      primary: 'var(--store-primary)',
      'primary-fg': 'var(--store-primary-fg)',
      'z-green': '#00a82d',
      'z-lime': '#95e030',
      'z-lilac': '#fad0f6',
      'z-bg': '#f9f6f2',
      'z-bg2': '#f4eee5',
      'z-text': '#141414',
    },
    backgroundColor: {
      'z-bg': '#f9f6f2',
      'z-bg2': '#f4eee5',
    },
  },
}
```

---

## 8. Tom visual geral

- Flat design. Sem gradientes, sem sombras decorativas.
- Bordas sutis (`0.5px`), não pesadas.
- Backgrounds quentes (off-white) criam sensação de aconchego para lojistas.
- Verde vibrante `#00a82d` ancora a identidade — energia, crescimento, WhatsApp.
- Lilás `#fad0f6` aparece em momentos de destaque especial (Premium, novo pedido) — cria contraste suave sem ser agressivo.
- Sidebar dark `#141414` separa claramente o "bastidor" (dashboard) do "vitrine" (catálogo público).

---

_Este documento é a fonte de verdade visual do Zapable. Qualquer novo componente deve seguir estas definições antes de ser implementado._
