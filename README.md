# TaskFlow

Sistema de gerenciamento de tarefas com quadro Kanban colaborativo em tempo real, dashboard analítico com KPIs, notificações in-app e e-mail assíncrono.

---

## Descrição

TaskFlow é uma aplicação web full-stack construída para equipes que precisam organizar e acompanhar tarefas de forma visual. O core é um quadro Kanban com quatro colunas configuráveis (A Fazer → Em Andamento → Em Revisão → Concluído), drag-and-drop vertical (priorização dentro da coluna) e cross-coluna (mudança de status), tudo com atualização otimista no cliente.

O sistema suporta múltiplos usuários colaborando no mesmo quadro em tempo real: mudanças em cards propagam via WebSocket para todos os participantes, e avatares de presença mostram quem está online no board no momento. Donos de quadro podem convidar membros por e-mail; ao ser convidado, o usuário recebe uma notificação in-app instantânea.

---

## Funcionalidades

| Área | O que está implementado |
|------|------------------------|
| **Autenticação** | Registro e login com JWT (access + refresh token em httpOnly cookie) |
| **Boards** | CRUD de quadros; compartilhamento por e-mail com controle dono/editor |
| **Cards** | CRUD com prioridade, responsável, prazo, tags com color picker e anexos |
| **Kanban** | Drag-and-drop vertical (priorização) e cross-coluna; toque mobile (delay 250 ms) |
| **Tempo real** | WebSocket (Socket.io): propagação de mudanças + avatares de presença |
| **Notificações** | In-app com badge, dropdown e mark-as-read; push via WebSocket |
| **Modal de edição** | Animação spring, feedback de erro com shake, histórico de movimentações |
| **Filtro de cards** | Campo de busca no header do board filtra cards por título em tempo real |
| **Analytics** | KPIs com delta período anterior, throughput, pizza de status, barras por responsável, tabela de atrasos |
| **E-mail assíncrono** | Fila BullMQ + Nodemailer: atribuição, mudança de status, lembrete 24 h antes do prazo |
| **E2E** | Suíte Playwright (auth, boards, cards) em Desktop Chrome e Pixel 5 |

---

## Pré-requisitos

### Execução com Docker (recomendado)

- Docker Engine ≥ 24
- Docker Compose v2 (incluso no Docker Desktop)

Não é necessário ter Node.js, PostgreSQL ou Redis instalados localmente.

### Execução local

- Node.js ≥ 20 LTS
- npm ≥ 10
- PostgreSQL ≥ 15 rodando localmente
- Redis ≥ 7 rodando localmente

---

## Como executar com Docker

```bash
# 1. Clone o repositório
git clone https://github.com/pedropompeu/TaskFlow-Atomic.git
cd TaskFlow-Atomic

# 2. Crie o arquivo de variáveis de ambiente
cp .env.example .env

# Edite .env:
#   - Troque JWT_ACCESS_SECRET e JWT_REFRESH_SECRET (obrigatório em produção)
#   - Preencha MAIL_USER e MAIL_PASS (Mailtrap) para testar e-mails

# 3. Suba todos os serviços
docker compose up --build

# 4. Em outro terminal, rode as migrations (apenas no primeiro uso)
docker compose exec backend npm run migration:run
```

Acesse:

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API REST | http://localhost:3001 |
| Swagger  | http://localhost:3001/api/docs |

```bash
# Parar os serviços
docker compose down

# Parar e remover volumes (banco + uploads — dados perdidos)
docker compose down -v
```

> **Migrations automáticas:** o backend usa `synchronize: false`. Sempre que houver novas migrations (após `git pull`), rode `docker compose exec backend npm run migration:run` antes de usar a aplicação.

---

## Como executar localmente

### 1. Banco de dados e Redis

Inicie PostgreSQL e Redis localmente e ajuste as variáveis de host no `.env`:

```bash
cp .env.example .env
# Altere:
#   POSTGRES_HOST=localhost
#   REDIS_HOST=localhost
```

### 2. Backend

```bash
cd backend
npm install
npm run migration:run   # aplica todas as migrations
npm run start:dev       # hot-reload em http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev             # Next.js dev server em http://localhost:3000
```

### 4. Testes E2E (opcional)

```bash
cd frontend
npx playwright install chromium  # apenas na primeira vez
npx playwright test               # headless
npx playwright test --ui          # com interface gráfica
```

Por padrão os testes apontam para `http://localhost:3000`. Para apontar para outro ambiente, defina `E2E_BASE_URL` antes de rodar.

---

## Variáveis de ambiente

Todas as variáveis estão documentadas em `.env.example` na raiz do projeto.

### Banco de dados

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `POSTGRES_USER` | `taskflow` | Usuário do banco PostgreSQL |
| `POSTGRES_PASSWORD` | `taskflow_pass` | Senha do banco |
| `POSTGRES_DB` | `taskflow_db` | Nome do banco |
| `POSTGRES_HOST` | `postgres` | Host do banco (`localhost` no modo local) |
| `POSTGRES_PORT` | `5432` | Porta do banco |

### Cache / Fila

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `REDIS_HOST` | `redis` | Host do Redis (`localhost` no modo local) |
| `REDIS_PORT` | `6379` | Porta do Redis |
| `REDIS_PASSWORD` | `redis_pass` | Senha do Redis |

### Autenticação JWT

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `JWT_ACCESS_SECRET` | — | **Obrigatório trocar em produção.** Gere com `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | — | **Obrigatório trocar em produção.** Valor diferente do access secret |
| `JWT_ACCESS_EXPIRATION` | `15m` | TTL do access token |
| `JWT_REFRESH_EXPIRATION` | `7d` | TTL do refresh token |

### Servidor

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `BACKEND_PORT` | `3001` | Porta da API NestJS |
| `FRONTEND_PORT` | `3000` | Porta do servidor Next.js |
| `NODE_ENV` | `development` | Ambiente (`development` / `production`) |
| `FRONTEND_URL` | `http://localhost:3000` | Origem permitida no CORS e nos WebSockets |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | URL da API consumida pelo Next.js (exposta ao browser) |

### E-mail

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `MAIL_HOST` | `smtp.mailtrap.io` | SMTP host. Use [Mailtrap](https://mailtrap.io) em desenvolvimento |
| `MAIL_PORT` | `2525` | Porta SMTP |
| `MAIL_USER` | — | Usuário SMTP |
| `MAIL_PASS` | — | Senha SMTP |
| `MAIL_FROM` | `noreply@taskflow.dev` | Endereço remetente |

### Upload de arquivos

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `UPLOAD_DEST` | `./uploads` | Diretório onde os anexos são salvos |
| `MAX_FILE_SIZE` | `10485760` | Limite de upload em bytes (padrão: 10 MB) |

---

## Decisões técnicas e trade-offs

### Autenticação com httpOnly cookies

Tokens JWT armazenados em cookies `httpOnly; SameSite=lax` em vez de `localStorage`. Elimina o vetor XSS mais comum — JavaScript no browser não consegue ler os tokens. O trade-off é que todas as requisições cross-origin precisam de `credentials: 'include'` no frontend e `credentials: true` no CORS do backend. WebSockets seguem o mesmo padrão.

### Migrations explícitas, sem `synchronize: true`

O `synchronize: true` do TypeORM é conveniente em desenvolvimento, mas destrutivo em produção — pode remover colunas silenciosamente a cada deploy. Optamos por migrations explícitas desde a primeira linha, com um `data-source.ts` separado para o CLI do TypeORM. Toda alteração de schema tem timestamp e métodos `up`/`down` implementados.

### Duas camadas de tempo real: REST + WebSocket

Mutations (criar, mover, editar, deletar card) vão por REST com JWT — mais simples de validar e auditar. WebSocket é usado apenas para *notificações* de mudanças (evento `board-updated` → React Query invalida o cache) e para presença de usuários. Isso evita replicar a lógica de autorização no gateway e mantém o WebSocket como canal de broadcast, não de comando.

### Atualização otimista no React Query

`useUpdateCard` e `useReorderCards` aplicam a mudança no cache local imediatamente via `onMutate`, revertendo em `onError` e invalidando em `onSettled`. O usuário vê o card mover-se instantaneamente; se a API falhar, o estado retorna ao original sem mensagem de erro visível no UI principal.

### Notificações in-app via namespace WebSocket dedicado

As notificações usam um namespace Socket.io separado (`/notifications`) com salas por usuário (`user:{id}`). A separação em namespace próprio evita poluir o canal de boards com eventos de usuário e facilita escalabilidade futura (ex.: mover o gateway de notificações para outro nó sem afetar o de boards). `NotificationsService` persiste no PostgreSQL e faz push imediato via gateway — o cliente recebe instantaneamente e atualiza o cache do React Query sem polling.

### Compartilhamento de board com tabela de membros

Em vez de adicionar campos à tabela `boards`, criamos `board_members` (board_id, user_id, role) com constraint de unicidade. Isso preserva a semântica de dono (campo `owner_id` em `boards`) e abre espaço natural para múltiplos papéis no futuro sem migração destrutiva. O `BoardsService.findAllForUser` retorna quadros próprios + compartilhados, mantendo a API do frontend inalterada.

### Fila assíncrona com BullMQ

Envios de e-mail nunca bloqueiam a resposta da API: `CardsService` enfileira jobs com `void` (fire-and-forget). O `EmailProcessor` processa em background com retry exponencial (3 tentativas, backoff de 5 s). Lembretes de prazo são disparados por cron a cada hora; o campo `deadline_reminder_sent_at` garante que cada card receba apenas um lembrete por vencimento.

### Armazenamento local de uploads

Anexos são salvos em `./uploads` com nome UUID para evitar colisões. O diretório é montado como volume Docker e servido como rota estática via Express (`/uploads/*`). Para produção, a recomendação é migrar para S3 ou equivalente — a troca exige alterar apenas `AttachmentsController` e a URL retornada; o restante do sistema não muda.

### Monorepo simples sem Turborepo/Nx

O overhead de ferramentas de monorepo não se justifica para dois packages neste estágio. A estrutura `frontend/` + `backend/` com `docker-compose.yml` na raiz é suficiente para desenvolvimento local e CI/CD linear.

---

## Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Animações | Framer Motion |
| Estado / Cache | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Drag-and-drop | @dnd-kit/core + @dnd-kit/sortable |
| WebSocket cliente | socket.io-client |
| Gráficos | Recharts |
| Testes E2E | Playwright |
| Backend | NestJS 10, TypeORM 0.3 |
| WebSocket servidor | @nestjs/websockets + socket.io (namespaces `/boards`, `/notifications`) |
| Banco de dados | PostgreSQL 16 |
| Fila / Cache | Redis 7 + BullMQ 5 |
| E-mail | Nodemailer + Mailtrap (dev) |
| Auth | JWT (Passport), bcrypt (12 rounds) |
| Containers | Docker Compose v2 |

---

## Endpoints principais

Documentação interativa disponível no Swagger em `/api/docs` após subir o backend.

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/register` | Cria conta |
| `POST` | `/auth/login` | Login — seta cookies JWT |
| `POST` | `/auth/refresh` | Renova access token via refresh cookie |
| `POST` | `/auth/logout` | Limpa cookies |
| `GET` | `/boards` | Lista boards do usuário (próprios + compartilhados) |
| `POST` | `/boards` | Cria board |
| `GET` | `/boards/:id` | Board com cards |
| `GET` | `/boards/:id/members` | Lista membros do board |
| `POST` | `/boards/:id/members` | Convida membro por e-mail |
| `DELETE` | `/boards/:id/members/:userId` | Remove membro (somente dono) |
| `GET` | `/boards/:id/cards` | Lista cards do board |
| `POST` | `/boards/:id/cards` | Cria card |
| `PATCH` | `/boards/:boardId/cards/reorder` | Reordena cards dentro da coluna |
| `GET` | `/cards/:id` | Detalhe do card (histórico, anexos, tags) |
| `PATCH` | `/cards/:id` | Atualiza card |
| `DELETE` | `/cards/:id` | Remove card |
| `POST` | `/cards/:id/tags` | Adiciona tag |
| `DELETE` | `/cards/:id/tags/:tagId` | Remove tag |
| `POST` | `/cards/:id/attachments` | Upload de anexo |
| `DELETE` | `/cards/:id/attachments/:id` | Remove anexo |
| `GET` | `/analytics` | Resumo analítico (`?boardId` `?startDate` `?endDate`) |
| `GET` | `/notifications` | Lista notificações do usuário |
| `GET` | `/notifications/unread-count` | Contagem de não lidas |
| `PATCH` | `/notifications/:id/read` | Marca notificação como lida |
| `PATCH` | `/notifications/read-all` | Marca todas como lidas |
| `GET` | `/users` | Lista usuários (para select de responsável) |

---

## Estrutura do projeto

```
TaskFlow-Atomic/
├── docker-compose.yml
├── .env.example
├── backend/
│   └── src/
│       ├── analytics/          # KPIs e gráficos
│       ├── auth/               # JWT, guards, decorators
│       ├── boards/             # CRUD de boards + membros
│       ├── cards/              # CRUD de cards + board.gateway.ts
│       ├── database/
│       │   └── migrations/     # 4 migrations (schema inicial → notificações)
│       ├── email/              # BullMQ processor + cron de lembretes
│       ├── notifications/      # Entidade, service, gateway, controller
│       └── users/
└── frontend/
    ├── e2e/                    # Playwright (auth, boards, cards)
    └── src/
        ├── app/
        │   ├── (auth)/         # login, register
        │   └── (dashboard)/    # layout, boards, [boardId], analytics
        ├── components/
        │   ├── kanban/         # KanbanBoard, KanbanColumn, KanbanCard,
        │   │                   # CardEditModal, CreateCardForm,
        │   │                   # BoardMembersPanel
        │   └── layout/         # NotificationBell
        ├── hooks/              # useBoards, useCards, useMembers,
        │                       # useNotifications, useBoardSocket, useMe
        └── lib/                # api, boards, analytics, notifications
```
