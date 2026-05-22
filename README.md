# TaskFlow

Sistema de gerenciamento de tarefas com quadro Kanban, dashboard analítico e notificações por e-mail assíncrono.

---

## Funcionalidades

| Área | O que está implementado |
|------|------------------------|
| **Autenticação** | Registro e login com JWT (access + refresh token em httpOnly cookie) |
| **Boards** | CRUD de quadros Kanban, acesso restrito ao criador |
| **Cards** | CRUD de cards com prioridade, responsável, prazo e posição |
| **Kanban** | Drag-and-drop entre colunas com atualização otimista ([@dnd-kit](https://dndkit.com)) |
| **Modal de edição** | Tags com color picker, upload de anexos, histórico de movimentações |
| **Analytics** | Gráficos de status, responsável, conclusões no tempo + lista de atrasos |
| **E-mail assíncrono** | Fila BullMQ + Nodemailer: atribuição de card, mudança de status, lembrete 24 h |

---

## Pré-requisitos

### Para execução com Docker (recomendado)

- [Docker Engine](https://docs.docker.com/engine/install/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) v2 (já incluso no Docker Desktop)

### Para execução local

- Node.js ≥ 20 LTS
- npm ≥ 10
- PostgreSQL ≥ 15 rodando localmente
- Redis ≥ 7 rodando localmente

---

## Execução com Docker

```bash
# 1. Clone o repositório
git clone https://github.com/pedropompeu/TaskFlow-Atomic.git
cd TaskFlow-Atomic

# 2. Crie o arquivo de variáveis de ambiente
cp .env.example .env
# Edite .env e preencha MAIL_USER e MAIL_PASS (Mailtrap) se quiser testar e-mails

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

Para encerrar: `docker compose down`  
Para remover volumes (banco + uploads): `docker compose down -v`

---

## Execução local (sem Docker)

### 1. Banco de dados e Redis

Garanta que PostgreSQL e Redis estejam rodando localmente com as credenciais do `.env`.

```bash
cp .env.example .env
# Ajuste POSTGRES_HOST=localhost e REDIS_HOST=localhost no .env
```

### 2. Backend

```bash
cd backend
npm install
npm run migration:run   # aplica todas as migrations
npm run start:dev       # hot-reload em :3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev             # Next.js dev em :3000
```

---

## Variáveis de ambiente

Todas as variáveis estão documentadas em `.env.example`. As principais:

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `POSTGRES_USER` | `taskflow` | Usuário do banco |
| `POSTGRES_PASSWORD` | `taskflow_pass` | Senha do banco |
| `POSTGRES_DB` | `taskflow_db` | Nome do banco |
| `POSTGRES_HOST` | `postgres` | Host do banco (`localhost` no modo local) |
| `REDIS_HOST` | `redis` | Host do Redis (`localhost` no modo local) |
| `REDIS_PASSWORD` | `redis_pass` | Senha do Redis |
| `JWT_ACCESS_SECRET` | — | **Obrigatório trocar em produção** |
| `JWT_REFRESH_SECRET` | — | **Obrigatório trocar em produção** |
| `JWT_ACCESS_EXPIRATION` | `15m` | TTL do access token |
| `JWT_REFRESH_EXPIRATION` | `7d` | TTL do refresh token |
| `BACKEND_PORT` | `3001` | Porta da API |
| `FRONTEND_URL` | `http://localhost:3000` | Origem permitida no CORS |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | URL da API usada pelo Next.js |
| `MAIL_HOST` | `smtp.mailtrap.io` | SMTP host (Mailtrap para dev) |
| `MAIL_PORT` | `2525` | Porta SMTP |
| `MAIL_USER` | — | Usuário SMTP |
| `MAIL_PASS` | — | Senha SMTP |
| `MAIL_FROM` | `noreply@taskflow.dev` | Remetente dos e-mails |
| `UPLOAD_DEST` | `./uploads` | Diretório dos arquivos enviados |
| `MAX_FILE_SIZE` | `10485760` | Limite de upload em bytes (10 MB) |

> Para gerar secrets seguros: `openssl rand -base64 64`

---

## Decisões técnicas e trade-offs

### Autenticação com httpOnly cookies

Tokens JWT armazenados em cookies `httpOnly + sameSite: lax` em vez de `localStorage`. Isso elimina o vetor XSS mais comum. O trade-off é que requisições cross-origin precisam de `credentials: 'include'` no frontend e CORS configurado com `credentials: true`.

### Migrations em vez de `synchronize: true`

`synchronize: true` do TypeORM é conveniente em desenvolvimento, mas destrutivo em produção — pode dropar colunas silenciosamente. Optamos por migrations explícitas desde o início, com `data-source.ts` separado para o CLI do TypeORM.

### Fila assíncrona com BullMQ

O envio de e-mails nunca bloqueia a resposta da API: o `CardsService` enfileira o job com `void` (fire-and-forget) e o `EmailProcessor` processa em background com retry exponencial (3 tentativas, backoff de 5 s). Lembranças de prazo são disparadas por cron `@EVERY_HOUR`; o campo `deadline_reminder_sent_at` garante que cada card receba apenas um lembrete.

### Drag-and-drop com atualização otimista

O `useUpdateCard` do React Query aplica a mudança de status no cache imediatamente (`onMutate`), reverte em caso de erro (`onError`) e invalida a query ao finalizar (`onSettled`). Isso dá feedback instantâneo sem esperar o round-trip da API.

### Armazenamento local de uploads

Anexos são salvos em `./uploads` com nome UUID para evitar colisões. O diretório é montado como volume no Docker (`uploads:`) e servido como rota estática pelo Express (`/uploads/*`). Para produção, a recomendação é migrar para S3 ou equivalente.

### Monorepo simples (sem Turborepo/Nx)

O overhead de ferramentas de monorepo não se justifica para dois packages. A estrutura `frontend/` + `backend/` com `docker-compose.yml` na raiz é suficiente para desenvolvimento e CI/CD.

---

## Endpoints principais

A documentação completa está disponível no Swagger em `/api/docs` após subir o backend.

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/register` | Cria conta |
| `POST` | `/auth/login` | Login (seta cookies JWT) |
| `POST` | `/auth/refresh` | Renova access token |
| `POST` | `/auth/logout` | Limpa cookies |
| `GET`  | `/boards` | Lista boards do usuário |
| `POST` | `/boards` | Cria board |
| `GET`  | `/boards/:id/cards` | Lista cards do board |
| `POST` | `/boards/:id/cards` | Cria card |
| `GET`  | `/cards/:id` | Detalhe do card (com histórico) |
| `PATCH`| `/cards/:id` | Atualiza card (status, prioridade, etc.) |
| `DELETE`| `/cards/:id` | Remove card |
| `POST` | `/cards/:id/tags` | Adiciona tag |
| `DELETE`| `/cards/:id/tags/:tagId` | Remove tag |
| `POST` | `/cards/:id/attachments` | Upload de anexo |
| `DELETE`| `/cards/:id/attachments/:attachmentId` | Remove anexo |
| `GET`  | `/analytics` | Resumo analítico (query: boardId, startDate, endDate) |
| `GET`  | `/users` | Lista usuários (para select de responsável) |

---

## Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Estado / Cache | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Drag-and-drop | @dnd-kit/core + @dnd-kit/sortable |
| Gráficos | Recharts |
| Backend | NestJS 10, TypeORM 0.3 |
| Banco de dados | PostgreSQL 16 |
| Fila / Cache | Redis 7 + BullMQ 5 |
| E-mail | Nodemailer + Mailtrap (dev) |
| Auth | JWT (Passport), bcrypt (12 rounds) |
| Containers | Docker Compose v2 |
