# TaskFlow — Brand Identity System
> Version 1.0 · 2026-05-24 · Status: **Aprovado por NOVA**
> Conceito: **Slate Protocol**
> Pipeline executado via `/brand` — Holding de Desenvolvimento Autónomo

---

## 00. Guia do Documento

**Como usar este arquivo:**
- Designers: consulte Seções 02–06 antes de criar qualquer tela
- Desenvolvedores: copie `brand/design-tokens.css` e `brand/tailwind.config.ts` para o projeto
- PMs e Copywriters: consulte Seção 12 (Voz) antes de escrever qualquer texto

**Donos por seção:**

| Seção | Dono | Agente de referência |
|---|---|---|
| Identidade visual, cores, tipografia | Frontend + Design | ARIA |
| Tokens CSS, Tailwind, componentes | Eng. Frontend | MAXWELL |
| Copy, voz, microcopy | PM + UX Writer | ECHO |
| Documentação e governança | PM | NOVA |

**Regra de ouro:** Se não está neste BRAND.md, não existe como decisão de brand. Qualquer desvio precisa ser proposto via `/discuss_setor 4` e aprovado antes de implementar.

---

## 01. Brand Overview

**Nome:** TaskFlow
**Conceito de marca:** Slate Protocol
**Posicionamento:** Gestão de tarefas para times remotos que previne atrasos antes que aconteçam.

**Essência em 3 palavras:** Proativo · Auditável · Preciso

**Personalidade:**
- Preciso — cada elemento justifica sua presença
- Direto — sem floreios, sem corporativês
- Íntegro — o que você vê é o que você tem
- Silenciosamente confiante — não precisa gritar para ser respeitado
- Minimal — menos é mais, sempre

**O que TaskFlow não é:**
- Não é uma ferramenta de colaboração casual (não é o Notion)
- Não é um gerenciador de projetos complexo (não é o Jira)
- Não é colorido nem festivo (não é o Trello)
- Não é para times que precisam de treinamento para usar

---

## 02. Sistema de Logo

> ⚠️ **O logo TaskFlow é existente e pertence à empresa — NÃO REDESENHAR.**
> Este sistema de brand foi construído para harmonizar com o logo atual.

**Diretrizes de uso do logo existente:**

| Variante | Fundo recomendado | Fundo proibido |
|---|---|---|
| Variante clara (padrão) | `--color-bg-base`, `--color-surface` | Qualquer fundo claro |
| Variante escura | Fundos claros (marketing, email) | Fundos escuros |
| Variante mono | Favicon, watermark, impressão P&B | — |

**Espaçamento mínimo:** Área de proteção = altura da letra maiúscula do wordmark em todos os lados.

**Tamanho mínimo digital:** 24px de altura para variante completa. 16px para ícone isolado.

**Nunca fazer:**
- Alterar cores do logo
- Adicionar sombras ou efeitos ao logo
- Colocar o logo sobre o acento `--color-accent`
- Esticar ou comprimir proporções
- Usar o logo sobre imagens sem overlay de fundo sólido

> **Ação necessária:** Preencher esta seção com os arquivos SVG reais do logo (variantes claro, escuro, mono) após a entrega do BRAND.md.

---

## 03. Sistema de Cores

### Paleta Primitiva (valores brutos)

| Token | Hex | Uso |
|---|---|---|
| `--primitive-slate-950` | `#070A10` | Fundo mais escuro |
| `--primitive-slate-900` | `#0B0E14` | **Canvas principal** |
| `--primitive-slate-300` | `#527DA3` | **Acento da marca** |
| `--primitive-slate-200` | `#7499BF` | Acento hover |
| `--primitive-neutral-800` | `#151820` | Superfície (cards) |
| `--primitive-neutral-700` | `#1E222D` | Superfície elevada (modais) |
| `--primitive-neutral-50` | `#E8ECF4` | Texto principal |
| `--primitive-neutral-200` | `#8B95A8` | Texto secundário |
| `--primitive-green-300` | `#4A8C6F` | Sucesso |
| `--primitive-amber-300` | `#A08050` | Aviso |
| `--primitive-red-300` | `#8C4A4A` | Erro |

### Tokens Semânticos (uso na UI)

| Token | Valor | Significado |
|---|---|---|
| `--color-bg-base` | slate-900 | Canvas da aplicação |
| `--color-bg-subtle` | slate-950 | Recuo — sidebar, headers |
| `--color-surface` | neutral-800 | Cards, painéis |
| `--color-surface-elevated` | neutral-700 | Modais, dropdowns |
| `--color-accent` | slate-300 | **Único acento da marca** |
| `--color-text-primary` | neutral-50 | Corpo de texto |
| `--color-text-secondary` | neutral-200 | Labels, metadados |
| `--color-text-muted` | neutral-400 | Desabilitado, placeholder |

**Regras de uso de cor:**
1. Apenas `--color-accent` como cor de destaque. Nunca usar dois acentos.
2. Status colors (success/warning/error) apenas para feedback de sistema — nunca decorativo.
3. Nunca usar cores primitivas diretamente no código da UI — use sempre os tokens semânticos.
4. Proibido: cores neon, gradientes decorativos, sombras coloridas.

---

## 04. Sistema de Superfícies

| Superfície | Token | Uso típico |
|---|---|---|
| Canvas | `--color-bg-base` | Fundo raiz da aplicação |
| Recuo | `--color-bg-subtle` | Sidebar, topbar, áreas de suporte |
| Card | `--color-surface` | Cards de conteúdo, painéis, listas |
| Elevated | `--color-surface-elevated` | Modais, dropdowns, tooltips |
| Overlay | `--color-surface-overlay` | Tooltips sobre modal, camadas terciárias |
| Modal Scrim | `rgba(7, 10, 16, 0.80)` | Overlay escurecido sob modais |

---

## 05. Sistema de Tipografia

**Família primária:** Roboto (sans-serif)
**Família mono:** Roboto Mono — usar em: IDs de card, timestamps, valores numéricos, trechos de código

**Como importar:**
```html
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Escala tipográfica:**

| Token | Tamanho | Peso | Uso |
|---|---|---|---|
| `--text-display` | 36px | 700 | Títulos de página principais |
| `--text-h1` | 24px | 600 | Títulos de seção |
| `--text-h2` | 20px | 600 | Subtítulos |
| `--text-h3` | 16px | 600 | Títulos de card, grupos |
| `--text-body-lg` | 16px | 400 | Corpo de texto longo |
| `--text-body` | 14px | 400 | **Padrão da UI** |
| `--text-body-sm` | 12px | 400 | Metadados, notas |
| `--text-label` | 12px | 500 | Labels uppercase, categorias |
| `--text-code` | 13px | 400 | Monospace — IDs, timestamps |

**Regras:**
- `--text-body` (14px) é o tamanho padrão da interface
- Nunca usar fonte < 12px
- Labels em uppercase usam `--text-label` com `letter-spacing: 0.04em`
- Valores numéricos e IDs usam `--font-mono`

---

## 06. Espaçamento e Grid

**Unidade base:** 4px

| Token | Valor | Uso típico |
|---|---|---|
| `--space-xs` | 4px | Espaço interno mínimo, gaps de ícone |
| `--space-sm` | 8px | Padding interno de badge, gap entre ícone e label |
| `--space-md` | 12px | Padding interno de input, gap entre itens de lista |
| `--space-lg` | 16px | Padding interno de card, gap entre seções próximas |
| `--space-xl` | 24px | Gap entre grupos, padding de painel |
| `--space-2xl` | 32px | Gap entre seções maiores |
| `--space-3xl` | 48px | Padding de página, gap de layout |

**Regra:** Nunca usar valores fora da escala sem justificativa documentada.

---

## 07. Iconografia

**Estilo definido:** Outlined (não filled), peso de linha médio, cantos levemente arredondados.

**Biblioteca recomendada:** Lucide React ou Phosphor Icons (decisão de implementação do Eng. Frontend — escolher uma e não misturar).

**Tamanhos padrão:**
- `16px` — ícone inline com texto `--text-body`
- `20px` — ícone de ação em botão
- `24px` — ícone de navegação na sidebar
- `32px` — ícone de estado vazio (empty state)

**Regras:**
- Nunca usar ícones filled e outlined na mesma tela
- Cor do ícone segue o token de texto do contexto (`--color-text-secondary` para ícones de suporte)
- Ícones interativos mudam para `--color-text-primary` no hover
- Ícones de status usam o token de cor correspondente (success/warning/error)

---

## 08. Especificação de Componentes

*(Ver tabela completa no pipeline de MAXWELL — seção Block 3)*

**Resumo dos componentes documentados com 8 estados cada:**
- Button (Primary, Secondary, Ghost, Danger)
- Input / Textarea
- Card genérico
- Kanban Card (com estado `dragging` e `drop-target`)
- Kanban Column
- Badge (Default, Accent, Success, Warning, Error)
- Sidebar + itens de navegação
- TopBar
- Modal
- KPI Card (dashboard)
- Data Table (rows e header)

**Regra:** Todo novo componente deve ter seus 8 estados documentados antes de entrar em produção.

---

## 09. Motion & Animação

| Token | Valor | Uso |
|---|---|---|
| `--duration-hover` | 100ms | Mudanças de cor no hover |
| `--duration-transition` | 150ms | Mudanças de estado (expand, collapse) |
| `--duration-animation` | 250ms | Entrada e saída de elementos |
| `--ease-default` | `cubic-bezier(0.16, 1, 0.3, 1)` | Padrão para todas as transições |

**Princípios:**
- Rápido na entrada, preciso no fim — sem bounce, sem elastic
- Transições de estado (hover, focus) sempre ≤ 150ms — respostas imediatas
- Animações de entrada/saída ≤ 250ms — sem arrastar
- Nunca animar cor e posição simultaneamente em elementos de dados

---

## 10. Visualização de Dados

**Paleta de gráficos (Recharts):**

| Série | Token de cor | Hex |
|---|---|---|
| Série 1 (principal) | `--color-accent` | `#527DA3` |
| Série 2 | `--primitive-green-300` | `#4A8C6F` |
| Série 3 | `--primitive-amber-300` | `#A08050` |
| Série 4 | `--primitive-neutral-300` | `#6B7A8D` |

**Regras:**
- Linhas de grid usam `--color-border-subtle`
- Labels de eixo usam `--color-text-muted` em `--text-body-sm`
- Tooltips usam `--color-surface-elevated` com `--shadow-raised`
- Nunca usar mais de 4 séries de cor num mesmo gráfico

---

## 11. Imagens e Mídia

**TaskFlow MVP não usa imagens de stock ou fotografia.**

Screenshots de produto e ilustrações de onboarding (quando existirem) devem:
- Usar o sistema de cores do BRAND.md — nunca cores fora do sistema
- Ter fundo compatível com `--color-bg-base` ou `--color-surface`
- Não conter texto externo ao sistema tipográfico

---

## 12. Voz da Marca & Messaging

**Personalidade de voz:** Preciso · Direto · Íntegro · Silenciosamente confiante

### Tom por contexto

| Contexto | Tom | Exemplo |
|---|---|---|
| Marketing | Afirmação forte, sem hedging | "Saiba o que vai atrasar — antes de atrasar." |
| UI do produto | Mínimo de palavras, ação específica | "Mover para Concluído" |
| Erros / Suporte | Causa + solução, sem culpar o usuário | "Prazo inválido. Use DD/MM/AAAA." |

### Hierarquia de Mensagem

```
Level 1 — Categoria:  "Gestão de tarefas para times remotos"
Level 2 — Promessa:   "Saiba o que vai atrasar — antes de atrasar."
Level 3 — Prova:      "Kanban + alertas automáticos + histórico auditável"
Level 4 — CTA:        "Criar meu board"
```

### Taglines

| Rank | Tagline | Contexto de uso |
|---|---|---|
| 1 | **"Veja antes. Resolva antes."** | Principal — landing page, hero |
| 2 | **"O board que avisa."** | Headline curta — ads, cards |
| 3 | **"Gestão que não espera o prazo."** | Descritivo — subheadlines |
| 4 | **"Veja tudo. Antes de todo mundo."** | Marketing agressivo |
| 5 | **"Menos standup. Mais entrega."** | Ads para desenvolvedores |

### Nunca usar

`empower` · `empoderar` · `robusto` · `solução robusta` · `seamless` · `fluido` · `intuitivo` · `revolucionar` · `disruptivo` · `transformar` · `synergy` · `leverage` · `next-gen` · `Ops!` / `Oops!` · `Algo deu errado` · `Clique aqui` · `Saiba mais`

### Microcopy padrão

| Contexto | Copy |
|---|---|
| CTA principal | "Criar meu board" |
| Empty state — board | "Este board está vazio. Crie o primeiro card." |
| Loading — board | "Buscando seu board" |
| Sucesso — card movido | "Card movido para [Coluna]" |
| Erro — sem conexão | "Sem conexão. Suas alterações serão salvas quando a rede voltar." |
| Alerta de prazo | "3 cards vencem em menos de 24h" |
| Confirmação exclusão | "Excluir card permanentemente? Esta ação não pode ser desfeita." |

---

## 13. Exemplos de Aplicação

### Como usar os tokens no Next.js + Tailwind

```tsx
// Importar os tokens no globals.css
import '../brand/design-tokens.css'

// Usar as classes Tailwind geradas pelo tailwind.config.ts
export function KanbanCard({ title, status }: CardProps) {
  return (
    <div className="bg-brand-surface border border-brand-border-subtle rounded-lg p-brand-lg shadow-card hover:bg-brand-surface-elevated transition-colors duration-hover ease-brand">
      <h3 className="text-h3 text-brand-text-primary">{title}</h3>
      <span className="text-body-sm text-brand-text-secondary">{status}</span>
    </div>
  )
}
```

### Como usar tokens CSS diretamente

```css
.kanban-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-card);
  padding: var(--space-lg);
  box-shadow: var(--shadow-card);
  transition: background var(--duration-transition) var(--ease-default);
}

.kanban-card:hover {
  background: var(--card-bg-hover);
  border-color: var(--card-border-hover);
}
```

### Comando Claude Code para uso do sistema

```bash
claude "Você está implementando o frontend do TaskFlow.
Leia obrigatoriamente BRAND.md e brand/design-tokens.css antes de escrever qualquer CSS.
Todos os valores de cor, tipografia e espaçamento devem referenciar tokens CSS ou
classes Tailwind do brand/tailwind.config.ts.
Nunca usar valores hardcoded de cor, fonte ou espaçamento."
```

---

## 14. Governança de Brand

| Decisão | Quem aprova | Como propor |
|---|---|---|
| Mudança de token existente | MAXWELL + Eng. Frontend | `/discuss_setor 4` |
| Adição de cor nova | ARIA + PM | `/discuss_setor 4` → `/decide` |
| Mudança de voz / copy | ECHO + PM | `/discuss_setor 4` |
| Novo componente | MAXWELL | Documentar estados + PR de tokens |
| Rebrand parcial | Diretoria | `/discuss_clevel` → `/brand` novo |
| Rebrand total | Diretoria | `/brand` com novo BRIEF |

**Regra de desvio:** Qualquer implementação que se desvie dos tokens documentados é débito técnico formal. Registrar em `docs/debt.md` com justificativa e prazo de correção.

---

## 15. Changelog

| Versão | Data | Agente | O que mudou |
|---|---|---|---|
| 1.0 | 2026-05-24 | ARIA + MAXWELL + ECHO + NOVA | Brand inicial — conceito Slate Protocol |

---

*TaskFlow BRAND.md v1.0 — Aprovado por NOVA*
*Pipeline: `/brand` — Holding de Desenvolvimento Autónomo*

```
─ DELIVERY COMPLETE
BRAND.md v1.0 — status: aprovado por NOVA
Arquivos salvos:
  → /Projeto-TaskFlow-21-05-2026/BRAND.md
  → /Projeto-TaskFlow-21-05-2026/brand/design-tokens.css
  → /Projeto-TaskFlow-21-05-2026/brand/tailwind.config.ts
Eng. Frontend liberado para iniciar implementação.
Pending: SVGs reais do logo (variantes claro/escuro/mono) — preencher Seção 02.
```
