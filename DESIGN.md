# Empria — Design System

**Identidade visual oficial do produto** · v1.0 · 11/07/2026
Linguagem visual extraída da referência aprovada (template *Probe*, Framer) e codificada como sistema próprio do Empria.

> **Método e limites:** o que está aqui foi extraído por análise do CSS/markup do site de referência — cores exatas, tipografia, escala, espaçamentos, raios e padrões de componente. A implementação é 100% nossa (código próprio em Next.js/Tailwind); **nenhum código, imagem, ilustração ou texto do template é copiado**. As duas fontes usadas são gratuitas para uso comercial: **Switzer** (Fontshare/ITF) e **Inter** (Google Fonts).

---

## 1. Personalidade

Precisão técnica com leveza. Canvas claro e silencioso, tinta quase-preta, **um único azul elétrico** que carrega toda a energia da marca. Nada de gradientes chamativos, sombras pesadas ou cantos arredondados demais: hairlines finas, cantos quase retos, tipografia grande com tracking negativo. O dado é o protagonista; a interface é o palco.

Regra de ouro: **o azul é raro**. Ele marca ação primária, destaque de dado e nada mais. Quanto menos azul na tela, mais forte ele fica.

---

## 2. Paleta (tokens extraídos)

### Neutros e superfícies

| Token | Hex | Uso |
|---|---|---|
| `--background` | `#f8f8f8` | Fundo da página/app (off-white) |
| `--surface` | `#ffffff` | Cards, painéis, barras |
| `--surface-2` | `#f4f4f4` | Blocos rebaixados, células de destaque, hover de linha |
| `--border` | `#e2e2e2` | Hairlines, divisórias, contorno de cards e inputs |
| `--foreground` | `#202020` | Títulos e texto principal (nunca preto puro) |
| `--muted-foreground` | `#5f5f5f` | Texto secundário, parágrafos |
| `--muted-2` | `#878787` | Legendas, texto de apoio |
| `--muted-3` | `#999999` | Placeholders |
| `--muted-4` | `#b5b5b5` | Ícones inativos, eixos de gráfico |
| `--muted-5` | `#d3d3d3` | Linhas de grade de gráfico |

### Azuis da marca

| Token | Hex | Uso |
|---|---|---|
| `--primary` | `#0a3eff` | **O azul Empria.** Botão primário, links, série principal de gráfico, valor em destaque |
| `--primary-hover` | `#0935d6` | Hover/pressed do primário *(derivado: −10% luz)* |
| `--accent-cyan` | `#0099ff` | Acento secundário: ícones ativos, segunda série de gráfico, micro-detalhes |
| `--primary-tint` | `#6f9dff` | Azul claro: fundos de seleção, terceira série, estados suaves |
| `--deep` | `#10296e` | Azul-marinho profundo: botão secundário escuro, blocos de contraste, fim de escala |
| `--overlay-deep` | `#10296e91` | Scrim/overlay translúcido sobre imagens |
| `--primary-glow` | `#0b35db82` | Brilho/glow atrás de elementos em destaque (uso raríssimo) |

### Semânticas

| Token | Hex | Origem | Uso |
|---|---|---|---|
| `--destructive` | `#e64059` | extraída | Erros, quedas, valores negativos, excluir |
| `--success` | `#0ba05f` | *extensão nossa* | Metas batidas, altas, confirmações |
| `--warning` | `#e6a03c` | *extensão nossa* | Atenção, ritmo abaixo do esperado |

O template de referência só define o vermelho; verde e âmbar são necessários num produto de metas/analytics e foram escolhidos na mesma família de saturação. Cor semântica **não** substitui o azul de marca: sinaliza estado, nunca decoração.

---

## 3. Tipografia

| Papel | Fonte | Pesos | Onde |
|---|---|---|---|
| Display / títulos | **Switzer** | 400, 500, 700 (+ itálicos) | Títulos de página, números de KPI, Modo Reunião |
| Corpo / UI | **Inter** | 400, 500 | Texto corrido, tabelas, formulários, labels |

Ambas gratuitas para uso comercial (Switzer: licença Fontshare/ITF — baixar e servir localmente via `next/font/local`; Inter: Google Fonts via `next/font`).

### Escala (extraída do site)

| Papel | Tamanho | Line-height | Tracking | Peso |
|---|---|---|---|---|
| Display XL (capa Modo Reunião, número-herói) | 76px | 1.1 | −0.05em | Switzer 700 |
| Display L | 55px | 1.1 | −0.04em | Switzer 700 |
| Display M / KPI grande | 49px | 1.1 | −0.04em | Switzer 700 |
| H1 (título de página) | 39px | 1.2 | −0.03em | Switzer 700 |
| H2 (título de seção/card grande) | 31px | 1.2 | −0.03em | Switzer 700 |
| H3 | 25px | 1.3 | −0.03em | Switzer 500 |
| H4 / KPI médio | 20px | 1.3 | −0.02em | Switzer 500 |
| Corpo padrão | 16px | 1.4 | −0.01em | Inter 400 |
| Corpo denso (tabelas, listas) | 14px | 1.4 | −0.01em | Inter 400 |
| Meta / legenda | 13px | 1.4 | 0 | Inter 400 |
| Label uppercase | 12px | 1.2 | +0.02em, caixa alta | Inter 500 |
| Micro-label (eixos, chips) | 10px | 1.2 | +0.02em, caixa alta | Inter 500 |

Regras:
- Tracking negativo cresce com o tamanho (é isso que dá o ar "técnico" da referência).
- **Números em painéis sempre com `font-variant-numeric: tabular-nums`** (Switzer para número grande, Inter para número em tabela).
- Texto corrido máx. ~65 caracteres por linha.

---

## 4. Espaçamento, grid e breakpoints

- **Escala de espaçamento:** 4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 56 px (extraída dos gaps do site).
- **Container:** máx. **1200px**, centrado, gutter lateral 40px (20px no mobile).
- **Seções institucionais:** respiro vertical ~104px; no app, blocos separados por 24–32px.
- **Breakpoints (do site):** desktop ≥1200px · tablet 810–1199px · mobile 320–809px.
- Espaçamento entre irmãos sempre via `gap` (flex/grid), nunca margens soltas.

## 5. Forma: raios, bordas e sombras

| Token | Valor | Uso |
|---|---|---|
| `--radius-control` | **2px** | Botões, inputs, chips, tags — canto quase reto (assinatura da referência) |
| `--radius-card` | **11px** | Cards, imagens, blocos de mídia, modais |

- **Hairline em vez de sombra:** a profundidade padrão é `1px solid var(--border)` sobre `--surface`. Cartão = branco + hairline, sem sombra.
- **Sombra só para elementos flutuantes** (dropdown, popover, modal), em camadas suaves — padrão extraído: `0 0.6px 1.6px rgba(0,0,0,.05), 0 2.3px 6px rgba(0,0,0,.08), 0 10px 24px rgba(0,0,0,.10)`.
- Anel de foco: `2px` sólido `--primary` com offset 2px (visível sempre, teclado incluído).

---

## 6. Componentes

### Botões
| Variante | Estilo |
|---|---|
| **Primário** | Fundo `--primary`, texto branco, radius 2px, padding 8×16 (denso) / 12×20 (padrão); hover `--primary-hover`; ícone de seta ↗ opcional à direita (padrão da referência) |
| **Escuro** | Fundo `--deep`, texto branco — CTAs em contexto já-azul ou rodapés |
| **Secundário** | Fundo branco, hairline `--border`, texto `--foreground`; hover fundo `--surface-2` |
| **Ghost** | Transparente, texto `--muted-foreground`; hover `--surface-2` |
| **Destrutivo** | Fundo `--destructive`, texto branco |

### Navegação (app)
- Barra superior branca com hairline inferior; logo à esquerda; **labels de navegação em uppercase 12px** com tracking +0.02em (assinatura da referência); ações à direita (busca, avatar, botão primário).
- Menu lateral (Modo Operação): fundo `--background`, item ativo com texto `--foreground` + indicador azul; itens inativos `--muted-2`.

### Cards e painéis
- Branco, hairline, radius 11px, padding 24px.
- Título do card: H4 Switzer + label uppercase opcional acima (10px, `--muted-2`).
- KPI tile: label uppercase em cima, número Switzer 49/32px `tabular-nums`, variação ao lado em chip semântico (▲ verde / ▼ vermelho, 12px).

### Tabelas
- Cabeçalho: uppercase 10–12px, `--muted-2`, fundo `--surface-2`.
- Linhas com hairline; hover `--surface-2`; números à direita com `tabular-nums`; 14px.

### Formulários
- Input: branco, hairline, radius 2px, 14–16px; focus = anel azul; erro = borda `--destructive` + mensagem 13px.
- Selects, date-pickers e filtros seguem o mesmo desenho de input.

### Chips / badges
- Radius 2px, 10–12px uppercase; neutro (`--surface-2` + `--muted-foreground`), informativo (tint azul `#6f9dff1a` + `--primary`), semânticos (tint da cor + cor).

### Acordeão (FAQ, listas expansíveis)
- Linha com pergunta em Switzer 20px, hairline entre itens, ícone +/− à direita; abre com transição suave de altura.

### Padrão de hover
- "Hover overlay": leve véu de 3–4% de preto sobre o elemento interativo (extraído da referência), 150–200ms.

---

## 7. Dataviz (gráficos do Empria)

A referência usa visualizações de **pontos/partículas em azul sobre claro** — adotamos como assinatura:

- **Série principal:** `--primary` `#0a3eff`. Segunda série: `--accent-cyan` `#0099ff`. Terceira: `--primary-tint` `#6f9dff`. Como as séries são da mesma família de azul (separadas por luminosidade), **rótulo direto + legenda são obrigatórios** em gráficos multi-série.
- **Comparativo (período anterior/meta):** nunca como barra preenchida cinza — usar **contorno tracejado sem preenchimento** ou **linha de referência tracejada** em `--muted-2`, sempre rotulada (validação: cinza não passa como cor de série categórica).
- **Sequencial (heatmap dia×hora):** `#f4f4f4 → #6f9dff → #0a3eff → #10296e` (claro = pouco, marinho = pico).
- **Divergente (vs. meta):** `#e64059 ← #f4f4f4 → #0a3eff`.
- Grade: `--muted-5` fininha; eixos e rótulos: `--muted-4`/10px uppercase; sem moldura de gráfico.
- Área sob linha: azul a 6–8% de opacidade. Ponto final da série enfatizado (dot cheio + valor).
- Positivo/negativo em variações: sempre `--success`/`--destructive`, nunca o azul.

## 8. Motion

- **Entrada:** fade + subida de 12px, 400–600ms, easing suave (`cubic-bezier(0.22, 1, 0.36, 1)`), em cascata curta (stagger 60–80ms) — o "appear" da referência.
- **Hover:** overlay 3–4%, 150ms. **Transições de rota:** fade rápido 200ms.
- Parallax leve apenas em contexto institucional/vitrine; **nunca** em painéis de dados.
- Respeitar `prefers-reduced-motion` em tudo.

## 9. Iconografia, logo e imagem

- **Ícones:** linha fina (stroke 1.5px), cantos retos, 16/20px — Lucide (padrão do shadcn/ui) já atende.
- **Logo Empria:** a referência usa um monograma de quadrados/pixels azuis. **Não copiamos o logo**; direção para a nossa marca: monograma geométrico próprio (ex.: quadrados formando "E") em `--primary` sobre claro. Tarefa de branding à parte.
- **Imagens institucionais** (site/login): renders abstratos escuros com vidro/reflexos, como contraponto ao app claro — produzir os nossos; **não usar as imagens do template**. Dentro do app, imagem quase não existe: o dado é a imagem.

## 10. Aplicação no Empria

- **Modo Operação:** densidade média, corpo 14px, cards com hairline, muito `--background` respirando entre blocos.
- **Modo Reunião:** o design system em tamanho de palco — fundo `#f8f8f8`, números Display XL/L em `#202020`, destaque de variação em azul/semânticas, uma ideia por tela, zero cromo de interface.
- **E-mails e PDFs exportados:** mesma paleta e tipografia (fallback: Helvetica/Arial), logo pequeno, hairlines.

---

## 11. Implementação (Next.js + Tailwind + shadcn/ui)

### Tokens CSS

```css
:root {
  /* superfícies e tinta */
  --background: #f8f8f8;
  --surface: #ffffff;
  --surface-2: #f4f4f4;
  --border: #e2e2e2;
  --foreground: #202020;
  --muted-foreground: #5f5f5f;
  --muted-2: #878787;
  --muted-3: #999999;
  --muted-4: #b5b5b5;
  --muted-5: #d3d3d3;

  /* marca */
  --primary: #0a3eff;
  --primary-hover: #0935d6;
  --primary-foreground: #ffffff;
  --accent-cyan: #0099ff;
  --primary-tint: #6f9dff;
  --deep: #10296e;
  --overlay-deep: #10296e91;
  --primary-glow: #0b35db82;

  /* semânticas */
  --destructive: #e64059;
  --success: #0ba05f;
  --warning: #e6a03c;

  /* forma */
  --radius-control: 2px;
  --radius-card: 11px;

  /* tipografia (preenchidas pelo next/font) */
  --font-display: 'Switzer', var(--font-body);
  --font-body: 'Inter', -apple-system, 'Segoe UI', sans-serif;
}
```

### Mapeamento shadcn/ui

| Var shadcn | Token Empria |
|---|---|
| `--background` / `--card` / `--popover` | `#f8f8f8` / `#ffffff` / `#ffffff` |
| `--foreground` | `#202020` |
| `--muted` / `--muted-foreground` | `#f4f4f4` / `#5f5f5f` |
| `--primary` / `--primary-foreground` | `#0a3eff` / `#ffffff` |
| `--secondary` / `--secondary-foreground` | `#f4f4f4` / `#202020` |
| `--accent` / `--accent-foreground` | `#f4f4f4` / `#202020` |
| `--destructive` | `#e64059` |
| `--border` / `--input` | `#e2e2e2` |
| `--ring` | `#0a3eff` |
| `--radius` | `0.125rem` (2px — controles; cards usam classe própria 11px) |

### Fontes

```ts
// app/fonts.ts
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'

export const inter = Inter({ subsets: ['latin'], variable: '--font-body' })

// Switzer: baixar de fontshare.com (licença ITF-FFL, gratuita p/ uso comercial)
export const switzer = localFont({
  src: [
    { path: './fonts/Switzer-Regular.woff2', weight: '400' },
    { path: './fonts/Switzer-Medium.woff2', weight: '500' },
    { path: './fonts/Switzer-Bold.woff2', weight: '700' },
  ],
  variable: '--font-display',
})
```

### Checklist de fidelidade por tela

1. Fundo `#f8f8f8`, cards brancos com hairline `#e2e2e2` (sem sombra).
2. Título em Switzer com tracking negativo; labels uppercase pequenos.
3. Um único elemento azul primário dominante por região da tela.
4. Números com `tabular-nums`; variações em verde/vermelho semânticos.
5. Botões e inputs com canto 2px; cards com 11px.
6. Gráficos: azul como série principal, grade `#d3d3d3`, rótulos uppercase 10px.
