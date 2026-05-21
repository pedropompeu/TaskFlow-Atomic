# TaskFlow — Contexto de Criação do Projeto

**Data da sessão:** 2026-05-21  
**Repositório:** https://github.com/pedropompeu/TaskFlow-Atomic.git  
**Pasta na holding:** `/home/usuario/Dev/Projetos_holding/Projeto-TaskFlow-21-05-2026`

---

## PARTE 1 — Contexto Completo do Projeto

### 1. Visão do Produto

**O problema:** Equipes remotas gerenciam tarefas em múltiplas ferramentas sem visibilidade centralizada — ninguém sabe quem está sobrecarregado, o que está travado ou o que vai atrasar. O Trello existe mas não avisa, o Notion é pesado para gestão pura.

**Para quem:** Tech leads e PMs de equipes remotas de 3–10 pessoas.

**Por que agora:** O Trello perdeu usuários com a Atlassian e há uma janela clara para uma ferramenta focada — Kanban com analytics e notificações inteligentes, sem a complexidade do Jira.

---

### 2. Usuário Primário

- **Quem é:** Tech lead ou PM de equipe remota (3–10 devs/colaboradores)
- **Dor principal:** Não tem visão do que está travado, quem está sobrecarregado, ou o que vai atrasar o sprint
- **Comportamento atual:** Usa Trello + Slack manual para cobrar status — trabalho de gerência que deveria ser automatizado
- **O que muda:** Com TaskFlow, recebe alertas antes do prazo estourar e tem dashboard com gargalos visíveis

---

### 3. Proposta de Valor

TaskFlow entrega o que o Trello prometeu mas nunca cumpriu: não só organiza as tarefas, mas ativamente avisa quando algo está em risco. O histórico auditável de movimentações elimina o "quem mexeu nisso?" e o dashboard analítico substitui o daily standup de status.

---

### 4. MVP — Escopo Mínimo

1. **Autenticação JWT** — registro, login, proteção de rotas (access + refresh token em httpOnly cookie)
2. **CRUD de boards e cards** — criar, editar, excluir com DTOs validados e Swagger
3. **Kanban drag-and-drop** — 4 colunas fixas com @dnd-kit, PATCH na API ao mover
4. **Modal de card detalhado** — título, descrição, responsável, prioridade, prazo, tags, histórico, anexos
5. **Dashboard analítico + fila de e-mail** — gráficos com Recharts, alertas assíncronos via BullMQ

---

### 5. Métrica North Star

**Cards concluídos por usuário ativo semanal.**

Se esse número cresce, o produto está gerando valor real — não só sendo "usado", mas sendo a ferramenta que fecha tarefas.

---

### 6. Stack Tecnológica Recomendada

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | Next.js 14 App Router | SSR/SSG, App Router com Server Components, ecossistema rico |
| Styling | Tailwind CSS | Produtividade, design system consistente |
| Estado/Cache | TanStack React Query | Cache otimista, sincronização com API, invalidação automática |
| Drag-and-drop | @dnd-kit/core | Acessível, performático, sem dependência de jQuery |
| Gráficos | Recharts | Composable, bem documentado, leve |
| Formulários | React Hook Form + Zod | Validação type-safe, performance superior ao Formik |
| Backend | NestJS | Modular, TypeScript-first, DI nativo, ecossistema robusto |
| ORM | TypeORM | Migrations explícitas, suporte nativo a PostgreSQL |
| Validação | class-validator | Integração nativa com NestJS Pipes |
| Documentação | Swagger (@nestjs/swagger) | Auto-gerado a partir dos decorators |
| Banco | PostgreSQL | Relacional, ACID, suporte a JSONB para metadados |
| Cache/Filas | Redis | Broker para BullMQ, sessions, rate limiting futuro |
| Filas | BullMQ | Battle-tested sobre Redis, UI de monitoramento (Bull Board) |
| E-mail | Nodemailer + Mailtrap | Mock SMTP para dev, zero custo |
| Infra | Docker + docker-compose | Ambiente reproduzível, deploy simplificado |

---

### 7. Arquitetura Inicial

**Padrão:** Monolito modular NestJS — um módulo por domínio de negócio.

```
backend/src/
├── auth/          # Autenticação e autorização
├── users/         # Gestão de usuários
├── boards/        # Boards (quadros Kanban)
├── cards/         # Cards e histórico
├── email/         # Worker de e-mail (BullMQ)
├── database/      # Configuração TypeORM e migrations
└── common/        # Guards, interceptors, filtros globais
```

**Justificativa:** Monolito modular é o padrão correto para MVP — permite evolução para microsserviços por módulo sem reescrita total. A separação por domínio já é a separação que precisaríamos em microsserviços.

---

### 8. Modelo de Monetização

**Freemium com expansão por uso:**
- **Free:** 1 board, 3 membros, 30 dias de histórico
- **Pro ($9/mês/assento):** boards ilimitados, membros ilimitados, histórico ilimitado, dashboard analítico
- **Break-even:** ~200 usuários pagantes = $1.800 MRR

**Lock-in natural:** O histórico de movimentações e os dados analíticos são o ativo mais valioso — migrar para outra ferramenta significa perder esse contexto.

---

### 9. Canal de Validação Inicial

1. **Product Hunt** — lançamento com demo funcional, meta: Top 5 do dia
2. **Reddit** — r/webdev, r/projectmanagement com post autêntico de "show my project"
3. **Dev.to / Hashnode** — artigo técnico sobre a stack (NestJS + Next.js + BullMQ) como funil indireto
4. **Meta:** 100 usuários ativos nas primeiras 4 semanas

---

### 10. Requisitos Mínimos de Compliance

- [ ] Senhas: bcrypt com fator de custo ≥ 12 (nunca MD5/SHA1)
- [ ] Tokens: JWT em httpOnly cookies (nunca localStorage)
- [ ] Inputs: class-validator em todos os DTOs do backend
- [ ] CORS: configurado explicitamente para o domínio do frontend
- [ ] Variáveis sensíveis: .env com .env.example (nunca hardcoded, nunca commitado)
- [ ] Uploads: validação de tipo MIME e tamanho máximo antes de salvar

---

### 11. Riscos Assumidos Conscientemente

| Risco | Decisão | Débito Técnico |
|-------|---------|----------------|
| Upload de anexos local (disco) | Aceito para MVP | Migrar para S3/Cloudflare R2 na Fase 2 |
| Sem testes automatizados | Aceito para velocidade de entrega | Adicionar Jest + Cypress na Fase 2 |
| Redis single-node (sem HA) | Aceito para MVP | Redis Cluster ou Redis Sentinel na Fase 3 |
| Sem rate limiting | Aceito para MVP | Adicionar com Throttler do NestJS na Fase 2 |

---

### 12. Roadmap Sugerido

**Fase 1 — MVP (atual):**
- Setup monorepo + Docker
- Banco de dados + migrations
- Autenticação JWT
- CRUD boards/cards
- Kanban drag-and-drop
- Modal de card detalhado
- Dashboard analítico
- Fila de e-mail BullMQ
- README detalhado

**Fase 2 — Produto Completo:**
- Testes automatizados (Jest unit + E2E com Supertest + Cypress)
- Upload para S3/R2
- Rate limiting e throttling
- Websockets para atualização em tempo real
- Multi-tenancy (workspaces por organização)
- Deploy cloud (Railway, Render ou AWS ECS)

**Fase 3 — Escala:**
- IA para priorização automática de cards
- Integrações (Slack, GitHub, Linear)
- Internacionalização (i18n)
- Microsserviços por domínio se necessário

---

### 13. Discordâncias Registradas

| Agente | Posição divergente |
|--------|-------------------|
| 🧠 Eng. IA/Prompt | Defendeu priorização automática por IA no MVP — adiado para Fase 2 |
| 🔨 Eng. QA | Destacou ausência de testes como risco crítico — aceito como débito formal |

---

### 14. Divisão de Responsabilidades

| Área | Agente Líder |
|------|-------------|
| Produto e UX | 🎯 PM + 🔍 UX Researcher |
| Arquitetura geral | 🏛️ Arquiteto Chefe |
| Padrões de código | 🧩 Arq. Software |
| Infraestrutura | ☁️ Arq. Cloud + 🚀 Eng. DevOps |
| Banco de dados | 🗄️ Arq. Dados + 🗃️ Eng. DBA |
| Backend NestJS | ⚙️ Eng. Backend |
| Frontend Next.js | 🖥️ Eng. Frontend |
| Fila/Workers | 🧠 Eng. IA/Prompt + ⚙️ Eng. Backend |
| Qualidade | 🔨 Eng. QA |
| Crescimento | 🚀 Growth |
| Segurança | 🛡️ Segurança |

---

## PARTE 2 — Prompt de Criação para o Claude Code

```prompt
# TaskFlow — Sistema de Gerenciamento de Tarefas com Kanban

Você está sendo iniciado como o time de desenvolvimento da holding para construir o **TaskFlow**
do zero. Este é o workspace oficial do projeto.

## Identidade do Projeto

TaskFlow é um sistema de gerenciamento de tarefas com interface Kanban que resolve o caos
de gestão em equipes remotas. O diferencial são as notificações proativas antes do prazo
estourar (via BullMQ) e o dashboard analítico com visibilidade dos gargalos da equipe.

## Stack (obrigatória, não negociável)

- **Frontend:** Next.js 14 App Router + Tailwind CSS + TanStack React Query + @dnd-kit/core
- **Backend:** NestJS + TypeORM + class-validator + Swagger (@nestjs/swagger)
- **Banco:** PostgreSQL + Redis
- **Filas:** BullMQ + Nodemailer (Mailtrap para dev)
- **Infra:** Docker + docker-compose
- **Formulários:** React Hook Form + Zod
- **Gráficos:** Recharts

## Repositório

https://github.com/pedropompeu/TaskFlow-Atomic.git

## Arquitetura do Backend (NestJS)

Monolito modular — um módulo por domínio:
- auth/ — JWT (access + refresh token em httpOnly cookie), bcrypt
- users/ — gestão de usuários
- boards/ — CRUD de boards
- cards/ — CRUD de cards, histórico, anexos
- email/ — worker BullMQ + Nodemailer
- database/ — TypeORM config + migrations (nunca synchronize: true em produção)

## Arquitetura do Frontend (Next.js)

App Router com route groups:
- (auth)/ — login, register
- (dashboard)/ — boards, kanban, analytics
- components/ui/ — componentes reutilizáveis
- lib/ — api client, hooks, utils

## Segurança (não negociável)

- bcrypt fator ≥ 12 para senhas
- JWT em httpOnly cookies (nunca localStorage)
- class-validator em todos os DTOs
- CORS explícito para o frontend
- Variáveis sensíveis em .env

## Regra Crítica — Commits Graduais

Este projeto será avaliado por recrutadores. Ao finalizar cada tarefa:
1. Exibir bloco de commit sugerido no formato padrão
2. Aguardar confirmação antes de avançar
3. Commits atômicos — uma tarefa = um commit

## Tarefas MVP (executar em ordem)

1. Setup monorepo + Docker (docker-compose, .env.example, ESLint/Prettier)
2. Banco de dados + migrations TypeORM (users, boards, cards, card_history, card_tags, attachments)
3. Autenticação JWT (NestJS guards + Next.js middleware.ts)
4. CRUD de cards e boards (REST + Swagger em /api/docs)
5. Quadro Kanban (4 colunas + @dnd-kit + React Query)
6. Modal de edição de card (histórico + upload de anexos)
7. Dashboard analítico (Recharts + filtro de período)
8. Fila de e-mail BullMQ (worker + cron job de alertas de prazo)
9. README.md detalhado

## Início Imediato

Execute `/discuss_clevel setup e arquitetura inicial do TaskFlow` antes de escrever qualquer código,
para alinhar decisões técnicas de alto nível com o time C-Level da holding.
```
