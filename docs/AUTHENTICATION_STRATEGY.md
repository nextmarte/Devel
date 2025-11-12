# 🔐 Estratégia de Implementação - Sistema de Autenticação e Gerenciamento de Usuários

**Data**: 11 de novembro de 2025  
**Status**: Planejamento  
**Prioridade**: Alta  

## ⚠️ Consideração Importante: Containerização

🐳 **Este projeto é totalmente containerizado!**

Todos os componentes rodam em containers Docker:
- ✅ **Next.js App** → Container
- ✅ **PostgreSQL** → Container
- ✅ **Redis** → Container
- ✅ **PgAdmin** (DEV) → Container

**Vantagens:**
- Ambiente consistente dev → produção
- Isolamento completo de dependências
- Fácil deployment
- Reproducível em qualquer máquina
- Preparado para Kubernetes

**Arquivos Docker:**
- `Dockerfile` - Build multi-stage (builder + runtime)
- `docker-compose.yml` - Orquestração completa
- `scripts/entrypoint.sh` - Inicialização e migrações
- `Makefile` - Comandos simplificados
- `DOCKER_SETUP.md` - Guia completo

📖 **Veja `DOCKER_SETUP.md` para detalhes sobre containers**

---

## 📋 Visão Geral

Implementar um sistema completo de autenticação, permissões e billing preparado para monetização futura.

### Objetivos

1. **Autenticação robusta** com JWT e sessões seguras
2. **Autorização baseada em roles** (RBAC - Role-Based Access Control)
3. **Sistema de permissões granular** por feature
4. **Billing e planos de assinatura** preparados para monetização
5. **Auditoria completa** de ações dos usuários
6. **Migração segura** do sistema atual (Session ID → User Authentication)

---

## 🏗️ Arquitetura Proposta com Containerização

### Diagrama de Componentes (Docker Compose)

```
┌──────────────────────────────────────────────────────────────────────┐
│                         DOCKER NETWORK                               │
│                          (devel-network)                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │        FRONTEND (Next.js Container)                        │    │
│  │  ├─ Port: 8565 (Host) → 8565 (Container)                 │    │
│  │  ├─ Authentication Layer                                  │    │
│  │  │  ├─ NextAuth.js (OAuth + Credentials)                │    │
│  │  │  ├─ JWT Token Management                             │    │
│  │  │  └─ Protected Routes (Middleware)                    │    │
│  │  │                                                       │    │
│  │  └─ User Context                                         │    │
│  │     ├─ useAuth() - Current user + permissions           │    │
│  │     ├─ usePermissions() - Feature flags                 │    │
│  │     └─ useUsageQuota() - Limits tracking                │    │
│  │                                                           │    │
│  └────────────────────┬─────────────────────────────────────┘    │
│                       │                                           │
│                       │ TCP/IP via Docker Network               │
│                       │                                           │
│  ┌────────────────────▼─────────────────────────────────────┐    │
│  │         BACKEND (API Routes - same container)            │    │
│  │  ├─ Middleware Layers                                    │    │
│  │  │  ├─ Authentication (validateJWT)                      │    │
│  │  │  ├─ Authorization (checkPermissions)                  │    │
│  │  │  ├─ Rate Limiting (by user tier via Redis)           │    │
│  │  │  └─ Usage Tracking (count actions)                    │    │
│  │  │                                                       │    │
│  │  └─ Protected Endpoints                                  │    │
│  │     ├─ POST /api/transcribe (require: canTranscribe)    │    │
│  │     ├─ POST /api/upload (require: canUpload)            │    │
│  │     ├─ GET /api/history (require: authenticated)         │    │
│  │     └─ DELETE /api/jobs/:id (require: owner or admin)   │    │
│  │                                                           │    │
│  └────────────────────┬─────────────────────────────────────┘    │
│                       │                                           │
│                       │ Database Connection                      │
│                       │ (hostname: postgres)                     │
│                       │                                           │
│  ┌────────────────────▼─────────────────────────────────────┐    │
│  │      DATABASE (PostgreSQL Container)                     │    │
│  │  ├─ Host: postgres:5432                                  │    │
│  │  ├─ Database: devel_db                                   │    │
│  │  ├─ Users table                                          │    │
│  │  ├─ Roles (RBAC)                                         │    │
│  │  ├─ Permissions                                          │    │
│  │  ├─ Subscriptions & Plans                                │    │
│  │  ├─ Usage Tracking                                       │    │
│  │  ├─ Transcriptions                                       │    │
│  │  ├─ Audit Logs                                           │    │
│  │  └─ Volume: postgres_data (persiste dados)              │    │
│  │                                                           │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │      CACHE & SESSION (Redis Container)                │    │
│  │  ├─ Host: redis:6379                                   │    │
│  │  ├─ Session Storage                                    │    │
│  │  ├─ Rate Limiting (Tokens)                             │    │
│  │  ├─ Temporary Data                                     │    │
│  │  └─ Volume: redis_data (persiste dados)                │    │
│  │                                                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────────┘

           ┌─────────────────────────┐
           │  EXTERNAL SERVICES      │
           ├─────────────────────────┤
           │ • Stripe (Billing)      │
           │ • Google OAuth          │
           │ • GitHub OAuth          │
           │ • SendGrid (Email)      │
           │ • Daredevil API         │
           └─────────────────────────┘
```

---

## � Configuração Docker (Containerização Completa)

### docker-compose.yml (Atualizado)

```yaml
version: '3.8'

services:
  # ==================== POSTGRESQL ====================
  postgres:
    image: postgres:16-alpine
    container_name: devel-postgres
    hostname: postgres
    environment:
      POSTGRES_USER: ${DB_USER:-devel_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-devel_password}
      POSTGRES_DB: ${DB_NAME:-devel_db}
      POSTGRES_INITDB_ARGS: "-c shared_buffers=256MB -c max_connections=200"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/01-init.sql
    networks:
      - devel-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-devel_user}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ==================== REDIS ====================
  redis:
    image: redis:7-alpine
    container_name: devel-redis
    hostname: redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-redis_password}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - devel-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ==================== NEXT.JS APP ====================
  devel-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: devel-app
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      # Node
      NODE_ENV: production
      PORT: 8565

      # NextAuth
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:8565}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}

      # Database
      DATABASE_URL: postgresql://${DB_USER:-devel_user}:${DB_PASSWORD:-devel_password}@postgres:5432/${DB_NAME:-devel_db}

      # Redis
      REDIS_URL: redis://:${REDIS_PASSWORD:-redis_password}@redis:6379

      # External APIs
      NEXT_PUBLIC_DAREDEVIL_API_URL: ${NEXT_PUBLIC_DAREDEVIL_API_URL}
      DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}

      # OAuth Providers
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GITHUB_ID: ${GITHUB_ID}
      GITHUB_SECRET: ${GITHUB_SECRET}

      # Stripe
      STRIPE_PUBLIC_KEY: ${STRIPE_PUBLIC_KEY}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}

      # Email
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}

    ports:
      - "8565:8565"
    volumes:
      - ./src:/app/src
      - ./public:/app/public
      - /app/node_modules
      - /app/.next
    networks:
      - devel-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8565/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # ==================== PGADMIN (DEV ONLY) ====================
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: devel-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@devel.local}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin}
    ports:
      - "5050:80"
    networks:
      - devel-network
    depends_on:
      - postgres
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    restart: unless-stopped
    profiles:
      - dev # Só rodeia em modo desenvolvimento

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  pgadmin_data:
    driver: local

networks:
  devel-network:
    driver: bridge
```

### Dockerfile (Atualizado)

```dockerfile
# ==================== BUILD STAGE ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat python3 make g++

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml* yarn.lock* .npmrc* ./

# Instalar dependências
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile || npm install

# Copiar código-fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# ==================== RUNTIME STAGE ====================
FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apk add --no-cache libc6-compat curl dumb-init postgresql-client

# Copiar dependências do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

# Copiar scripts
COPY --from=builder /app/prisma ./prisma
COPY scripts/entrypoint.sh /entrypoint.sh

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chmod +x /entrypoint.sh

USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8565}/api/health || exit 1

EXPOSE 8565

ENTRYPOINT ["/sbin/dumb-init", "--"]
CMD ["/entrypoint.sh"]
```

### entrypoint.sh (Script de Inicialização)

```bash
#!/bin/sh
set -e

echo "🔄 Aguardando banco de dados..."
until pg_isready -h postgres -p 5432 -U "${DB_USER:-devel_user}" > /dev/null 2>&1; do
  echo "PostgreSQL ainda não está pronto..."
  sleep 2
done

echo "✅ PostgreSQL está pronto!"

echo "🔄 Executando migrações Prisma..."
npx prisma migrate deploy --skip-generate

echo "🌱 Executando seed do banco..."
npx prisma db seed || true

echo "🚀 Iniciando aplicação Next.js na porta ${PORT:-8565}..."
exec node -e "require('.next/server').createServer({ isNodeDebugging: false, httpServer: require('http').createServer() }).prepare().then(() => require('.next/server').createServer().listen(${PORT:-8565}, () => console.log('Servidor rodando na porta ${PORT:-8565}')))"
```

Ou mais simples:

```bash
#!/bin/sh
set -e

echo "🔄 Aguardando banco de dados..."
until pg_isready -h postgres -p 5432 -U "${DB_USER:-devel_user}" > /dev/null 2>&1; do
  echo "PostgreSQL ainda não está pronto..."
  sleep 2
done

echo "✅ PostgreSQL está pronto!"

echo "🔄 Executando migrações Prisma..."
npx prisma migrate deploy --skip-generate

echo "🌱 Executando seed do banco..."
npx prisma db seed || true

echo "🚀 Iniciando aplicação Next.js..."
exec next start -p ${PORT:-8565}
```

### .env.docker (Arquivo de Configuração)

```env
# ========== NODE ==========
NODE_ENV=production
PORT=8565

# ========== DATABASE ==========
DATABASE_URL=postgresql://devel_user:devel_password@postgres:5432/devel_db
DB_USER=devel_user
DB_PASSWORD=devel_password
DB_NAME=devel_db

# ========== REDIS ==========
REDIS_URL=redis://:redis_password@redis:6379
REDIS_PASSWORD=redis_password

# ========== NEXTAUTH ==========
NEXTAUTH_URL=http://localhost:8565
NEXTAUTH_SECRET=your-secret-key-change-in-production

# ========== OAUTH ==========
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret

# ========== STRIPE ==========
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# ========== EXTERNAL APIS ==========
NEXT_PUBLIC_DAREDEVIL_API_URL=http://api.daredevil.local
DEEPSEEK_API_KEY=your-api-key

# ========== PGADMIN ==========
PGADMIN_EMAIL=admin@devel.local
PGADMIN_PASSWORD=admin

# ========== SMTP (Email) ==========
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Makefile (Facilita Operações)

```makefile
.PHONY: help build up down logs shell seed clean restart

help:
	@echo "Comandos disponíveis:"
	@echo "  make build              - Construir containers"
	@echo "  make up                 - Iniciar containers"
	@echo "  make down               - Parar containers"
	@echo "  make logs               - Ver logs da aplicação"
	@echo "  make shell              - Entrar no shell do container"
	@echo "  make seed               - Executar seeds do banco"
	@echo "  make migrate            - Executar migrações"
	@echo "  make restart            - Reiniciar containers"
	@echo "  make clean              - Limpar volumes"
	@echo "  make pgadmin            - Iniciar PgAdmin"

build:
	docker-compose build

up:
	docker-compose up -d
	@echo "✅ Containers iniciados!"
	@echo "📍 Aplicação: http://localhost:8565"
	@echo "📍 PgAdmin: http://localhost:5050"

down:
	docker-compose down

logs:
	docker-compose logs -f devel-app

logs-db:
	docker-compose logs -f postgres

shell:
	docker-compose exec devel-app sh

seed:
	docker-compose exec devel-app npx prisma db seed

migrate:
	docker-compose exec devel-app npx prisma migrate dev

migrate-prod:
	docker-compose exec devel-app npx prisma migrate deploy

restart:
	docker-compose restart devel-app

clean:
	docker-compose down -v

pgadmin:
	docker-compose --profile dev up -d pgadmin

ps:
	docker-compose ps

status:
	@echo "=== Containers ===" && \
	docker-compose ps && \
	@echo "\n=== Networks ===" && \
	docker network ls && \
	@echo "\n=== Volumes ===" && \
	docker volume ls | grep devel

health:
	@docker-compose ps | grep -E "devel-app|postgres|redis" | awk '{print $$1}' | xargs -I {} sh -c 'echo "=== {} ===" && docker inspect --format="{{.State.Health.Status}}" {} 2>/dev/null || echo "No health check"'
```

### Scripts de Inicialização SQL

#### scripts/init-db.sql

```sql
-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de audit (criar antes pois pode ser referenciada)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comentário sobre o banco
COMMENT ON DATABASE devel_db IS 'Database for Devel Platform - Authentication & Billing System';

-- Conceder permissões
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT CREATE ON SCHEMA public TO PUBLIC;

-- Confirmar
SELECT 'Database initialized successfully' as status;
```

---

## �📊 Schema de Banco de Dados (Prisma)

### Estrutura Completa

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============== AUTHENTICATION ==============

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password_hash String?   // null for OAuth users
  
  // OAuth
  oauth_provider String?   // "google", "github"
  oauth_id       String?   
  
  // Status
  email_verified Boolean   @default(false)
  is_active      Boolean   @default(true)
  
  // Relationships
  role_id        String
  role           Role      @relation(fields: [role_id], references: [id])
  
  subscription_id String?
  subscription    Subscription? @relation(fields: [subscription_id], references: [id])
  
  // Actions
  transcriptions Transcription[]
  usage_logs     UsageLog[]
  audit_logs     AuditLog[]
  
  // Metadata
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt
  last_login     DateTime?
  
  @@index([email])
  @@index([role_id])
}

// ============== RBAC ==============

model Role {
  id          String   @id @default(cuid())
  name        String   @unique // "admin", "premium", "free", "trial"
  description String?
  permissions Json     // ["transcribe", "upload", "export", "history"]
  
  users       User[]
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}

model Permission {
  id           String   @id @default(cuid())
  feature_name String   @unique // "transcribe", "upload", "export"
  description  String
  category     String   // "core", "premium", "admin"
  
  created_at   DateTime @default(now())
}

// ============== BILLING ==============

model Plan {
  id               String   @id @default(cuid())
  name             String   @unique // "Free", "Starter", "Pro", "Enterprise"
  description      String
  price            Float    // in cents
  currency         String   @default("USD")
  billing_interval String   // "month", "year"
  
  // Features & Limits (JSON)
  features         Json     // { "transcribe": true, "maxDuration": 60 }
  limits           Json     // { "monthlyMinutes": 120, "maxFileSize": 500 }
  
  // Stripe
  stripe_price_id  String?  @unique
  
  subscriptions    Subscription[]
  
  is_active        Boolean  @default(true)
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
}

model Subscription {
  id                    String   @id @default(cuid())
  user_id               String
  user                  User[]
  
  plan_id               String
  plan                  Plan     @relation(fields: [plan_id], references: [id])
  
  status                String   // "active", "cancelled", "past_due", "expired"
  
  current_period_start  DateTime
  current_period_end    DateTime
  
  // Stripe
  stripe_subscription_id String?  @unique
  stripe_customer_id     String?
  
  // Cancellation
  cancel_at_period_end  Boolean  @default(false)
  cancelled_at          DateTime?
  
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  
  @@index([user_id])
  @@index([plan_id])
}

// ============== USAGE TRACKING ==============

model UsageLog {
  id             String   @id @default(cuid())
  user_id        String
  user           User     @relation(fields: [user_id], references: [id])
  
  action_type    String   // "transcribe", "upload", "export"
  
  // Metadata
  file_size      Int?     // in bytes
  duration       Int?     // in seconds
  cost           Float?   // in credits/money
  quota_consumed Int      @default(1)
  
  metadata       Json?    // additional data
  
  timestamp      DateTime @default(now())
  
  @@index([user_id, action_type])
  @@index([timestamp])
}

// ============== TRANSCRIPTIONS ==============

model Transcription {
  id              String   @id @default(cuid())
  user_id         String
  user            User     @relation(fields: [user_id], references: [id])
  
  job_id          String   @unique
  status          String   // "PENDING", "PROCESSING", "SUCCESS", "FAILED"
  
  // File info
  file_name       String
  file_size       Int
  file_duration   Int?
  
  // Results
  raw_text        String?  @db.Text
  corrected_text  String?  @db.Text
  identified_text String?  @db.Text
  summary         String?  @db.Text
  
  // Metadata
  language        String   @default("pt")
  metadata        Json?
  
  created_at      DateTime @default(now())
  completed_at    DateTime?
  
  @@index([user_id])
  @@index([status])
}

// ============== AUDIT LOGS ==============

model AuditLog {
  id            String   @id @default(cuid())
  user_id       String?
  user          User?    @relation(fields: [user_id], references: [id])
  
  action        String   // "login", "upload", "delete_transcription"
  resource_type String?  // "transcription", "user"
  resource_id   String?
  
  // Request info
  ip_address    String?
  user_agent    String?
  
  metadata      Json?
  timestamp     DateTime @default(now())
  
  @@index([user_id])
  @@index([action])
  @@index([timestamp])
}
```

---

## 🔐 Sistema de Permissões (Feature Flags)

### Tipos de Permissões

```typescript
export type Permission = 
  | 'auth.login'
  | 'auth.register'
  | 'transcribe.create'
  | 'transcribe.view'
  | 'transcribe.edit'
  | 'transcribe.delete'
  | 'upload.audio'
  | 'upload.video'
  | 'export.txt'
  | 'export.pdf'
  | 'export.docx'
  | 'history.view'
  | 'history.search'
  | 'analytics.view'
  | 'settings.theme'
  | 'settings.profile'
  | 'admin.users.view'
  | 'admin.users.edit'
  | 'admin.billing.view';

export type Role = 'free' | 'trial' | 'starter' | 'pro' | 'enterprise' | 'admin';
```

### Matriz de Permissões por Role

| Feature | Free | Trial | Starter | Pro | Enterprise | Admin |
|---------|------|-------|---------|-----|-----------|-------|
| Transcrever | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upload Áudio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upload Vídeo | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Exportar TXT | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Exportar PDF | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Exportar DOCX | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Histórico Completo | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Busca Avançada | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Analytics | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Admin Panel | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Limites por Plano

| Limite | Free | Trial | Starter | Pro | Enterprise |
|--------|------|-------|---------|-----|-----------|
| Minutos/mês | 30 | 120 | 300 | 1000 | Ilimitado |
| Tamanho máximo arquivo | 50 MB | 200 MB | 500 MB | 1000 MB | 2000 MB |
| Duração máxima | 10 min | 30 min | 60 min | 120 min | Ilimitado |
| Jobs concorrentes | 1 | 2 | 3 | 5 | 10 |
| Retenção histórico | 7 dias | 30 dias | 90 dias | 365 dias | Ilimitado |

---

## 📌 Dependências Necessárias

```bash
# Authentication
bun add next-auth @auth/prisma-adapter
bun add bcryptjs jsonwebtoken
bun add -D @types/bcryptjs @types/jsonwebtoken

# Database
bun add @prisma/client
bun add -D prisma

# Validation
bun add zod

# Billing
bun add stripe @stripe/stripe-js

# Email
bun add nodemailer
bun add -D @types/nodemailer
```

---

## 🔧 Implementação por Etapas

### **Fase 1: Setup Base (Semana 1)**

**Tarefas:**
- [ ] Instalar dependências
- [ ] Configurar Prisma e PostgreSQL
- [ ] Criar schema.prisma com todos os modelos
- [ ] Gerar primeira migração
- [ ] Criar arquivo de seeds
- [ ] Executar seeds iniciais (roles, plans, admin user)

**Saídas:**
- Schema do banco configurado
- Usuário admin criado
- Roles e Plans inicializados

---

### **Fase 2: Autenticação (Semana 2)**

**Tarefas:**
- [ ] Configurar NextAuth.js
- [ ] Implementar provedor Credentials (email/senha)
- [ ] Configurar OAuth (Google, GitHub)
- [ ] Criar hook `useAuth()`
- [ ] Implementar middleware de proteção
- [ ] Criar páginas de login e signup

**Saídas:**
- Sistema de autenticação funcional
- Páginas de auth (login/signup)
- Middleware de proteção de rotas

---

### **Fase 3: Migração do Sistema Atual (Semana 3)**

**Tarefas:**
- [ ] Atualizar server actions com autenticação
- [ ] Adicionar user_id a todas as transcrições
- [ ] Criar middleware de autorização
- [ ] Implementar tracking de uso
- [ ] Atualizar endpoints da API
- [ ] Migrar dados históricos (se necessário)

**Saídas:**
- Todas as ações associadas a usuários
- Sistema de tracking funcional
- API endpoints protegidos

---

### **Fase 4: UI de Autenticação (Semana 4)**

**Tarefas:**
- [ ] Criar componente `ProtectedFeature`
- [ ] Atualizar página principal
- [ ] Criar componentes de permissão
- [ ] Implementar UI de quota/limites
- [ ] Adicionar toasts de feedback
- [ ] Criar páginas de erro (401, 403)

**Saídas:**
- Interface de autenticação completa
- Feedback visual de permissões
- Tratamento de erros

---

### **Fase 5: Dashboard Admin (Semana 5)**

**Tarefas:**
- [ ] Criar página de gerenciamento de usuários
- [ ] Implementar listagem com filtros
- [ ] Adicionar ações (ativar/desativar)
- [ ] Criar página de analytics
- [ ] Implementar logs de auditoria
- [ ] Criar relatórios de uso

**Saídas:**
- Dashboard admin completo
- Ferramentas de gerenciamento
- Relatórios de sistema

---

### **Fase 6: Billing e Stripe (Semana 6)**

**Tarefas:**
- [ ] Configurar Stripe account
- [ ] Criar página de pricing
- [ ] Implementar checkout flow
- [ ] Configurar webhooks de Stripe
- [ ] Criar página de billing
- [ ] Implementar upgrade/downgrade

**Saídas:**
- Sistema de pagamento integrado
- Planos funcionais
- Billing management

---

## 💻 Estrutura de Arquivos

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts          # NextAuth config
│   │   │   ├── register/
│   │   │   │   └── route.ts
│   │   │   └── session/
│   │   │       └── route.ts
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   │   ├── route.ts          # GET users
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # PATCH user
│   │   │   └── analytics/
│   │   │       └── route.ts
│   │   ├── billing/
│   │   │   ├── checkout/
│   │   │   │   └── route.ts
│   │   │   └── webhooks/
│   │   │       └── stripe/
│   │   │           └── route.ts
│   │   ├── transcribe/
│   │   │   ├── route.ts              # Com autenticação
│   │   │   └── status/
│   │   │       └── route.ts
│   │   └── usage/
│   │       └── route.ts              # GET user usage
│   ├── auth/
│   │   ├── signin/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── error/
│   │   │   └── page.tsx
│   │   └── callback/
│   │       └── page.tsx
│   ├── admin/
│   │   ├── users/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── billing/
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── manage/
│   │   │   └── page.tsx
│   │   └── success/
│   │       └── page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── actions.ts                    # Updated with auth
│   └── globals.css
│
├── lib/
│   ├── auth.ts                       # NextAuth config
│   ├── prisma.ts                     # Prisma client
│   ├── permissions.ts                # Permission definitions
│   ├── authorization.ts              # Permission checking
│   ├── stripe.ts                     # Stripe config
│   └── email.ts                      # Email templates
│
├── components/
│   ├── protected-feature.tsx          # Wrapper with permissions
│   ├── usage-quota-display.tsx        # Show user quotas
│   ├── auth-provider.tsx              # SessionProvider
│   └── ...existing components
│
├── hooks/
│   ├── use-auth.ts                   # Auth context hook
│   ├── use-permissions.ts            # Permissions hook
│   ├── use-usage.ts                  # Usage tracking hook
│   └── ...existing hooks
│
├── middleware.ts                      # Route protection
│
└── env.example                        # Environment variables
```

---

## 🔑 Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/devel"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-id"
GITHUB_SECRET="your-github-secret"

# Stripe
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Daredevil API
NEXT_PUBLIC_DAREDEVIL_API_URL="http://api.daredevil.local"
DAREDEVIL_API_TOKEN="your-token"

# Email (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

---

## 📊 Timeline Resumida

| Fase | Duração | Status |
|------|---------|--------|
| 1. Setup Base | Semana 1 | ⏳ Não iniciado |
| 2. Autenticação | Semana 2 | ⏳ Não iniciado |
| 3. Migração | Semana 3 | ⏳ Não iniciado |
| 4. UI Auth | Semana 4 | ⏳ Não iniciado |
| 5. Dashboard Admin | Semana 5 | ⏳ Não iniciado |
| 6. Billing | Semana 6 | ⏳ Não iniciado |

**Duração Total:** 6 semanas  
**Data Estimada de Conclusão:** ~26 de dezembro de 2025

---

## ✅ Checklist de Implementação

### Fase 1: Setup Base
- [ ] Instalar `@prisma/client`, `prisma`
- [ ] Criar `prisma/schema.prisma`
- [ ] Executar `bunx prisma migrate dev --name init`
- [ ] Criar `prisma/seed.ts`
- [ ] Executar `bunx prisma db seed`
- [ ] Testar conexão com banco

### Fase 2: Autenticação
- [ ] Instalar `next-auth`, `bcryptjs`, `jsonwebtoken`
- [ ] Criar `src/lib/auth.ts`
- [ ] Criar `src/app/api/auth/[...nextauth]/route.ts`
- [ ] Criar `src/hooks/use-auth.ts`
- [ ] Criar `src/app/auth/signin/page.tsx`
- [ ] Criar `src/app/auth/signup/page.tsx`
- [ ] Criar `src/middleware.ts`
- [ ] Testar fluxo de login

### Fase 3: Migração
- [ ] Atualizar `src/app/actions.ts` com autenticação
- [ ] Criar `src/lib/authorization.ts`
- [ ] Criar `src/lib/permissions.ts`
- [ ] Atualizar endpoints de API
- [ ] Testar permissões

### Fase 4: UI Auth
- [ ] Criar `src/components/protected-feature.tsx`
- [ ] Atualizar `src/app/page.tsx`
- [ ] Criar páginas de erro
- [ ] Adicionar feedback visual

### Fase 5: Dashboard Admin
- [ ] Criar `src/app/admin/users/page.tsx`
- [ ] Criar `src/app/api/admin/users/route.ts`
- [ ] Implementar listagem e filtros
- [ ] Criar `src/app/admin/analytics/page.tsx`

### Fase 6: Billing
- [ ] Configurar Stripe
- [ ] Criar `src/lib/stripe.ts`
- [ ] Criar `src/app/billing/pricing/page.tsx`
- [ ] Implementar checkout
- [ ] Configurar webhooks

---

## 🚀 Começando (Docker)

### Pré-requisitos
- Docker Desktop ou Docker Engine 20.10+
- Docker Compose 2.0+
- Git

### Primeira Execução com Docker

#### 1. Clonar e Configurar

```bash
# Clone o repositório
git clone https://github.com/nextmarte/Devel.git
cd Devel

# Copiar arquivo de ambiente
cp .env.docker .env.local

# IMPORTANTE: Ajuste as variáveis de ambiente em .env.local
# - NEXTAUTH_SECRET: Gere uma chave segura
# - GOOGLE_CLIENT_ID/SECRET: Suas credenciais Google
# - GITHUB_ID/SECRET: Suas credenciais GitHub
# - Etc.
```

#### 2. Build e Inicialização

```bash
# Construir containers
docker-compose build

# Iniciar containers
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f devel-app
```

#### 3. Aguardar Inicialização

```bash
# O processo de inicialização fará:
# 1. ✅ Aguardar PostgreSQL estar pronto
# 2. ✅ Executar migrações (prisma migrate deploy)
# 3. ✅ Executar seeds
# 4. ✅ Iniciar Next.js

# Acessar aplicação
# http://localhost:8565
```

#### 4. Acessar Ferramentas Administrativas

```bash
# PgAdmin (Gerenciador PostgreSQL)
# URL: http://localhost:5050
# Email: admin@devel.local
# Senha: admin

# Para conectar ao PostgreSQL no PgAdmin:
# Host: postgres (hostname do container)
# User: devel_user
# Password: devel_password
```

### Usando o Makefile (Recomendado)

```bash
# Ver todos os comandos disponíveis
make help

# Build
make build

# Iniciar
make up

# Ver logs
make logs

# Executar seeds
make seed

# Executar migrações
make migrate

# Parar containers
make down

# Reiniciar
make restart

# Limpar tudo (remove volumes)
make clean

# Iniciar PgAdmin
make pgadmin

# Ver status de saúde
make health
```

### Primeira Execução Local (sem Docker)

Se preferir rodar localmente durante desenvolvimento:

```bash
# 1. Instalar dependências
bun install

# 2. Configurar PostgreSQL e Redis localmente
# OU rodar apenas os containers deles:
docker-compose up -d postgres redis

# 3. Criar arquivo .env.local
cp .env.docker .env.local

# Ajuste DATABASE_URL para:
# DATABASE_URL=postgresql://devel_user:devel_password@localhost:5432/devel_db
# REDIS_URL=redis://:redis_password@localhost:6379

# 4. Executar migrações
bunx prisma migrate dev --name init

# 5. Executar seeds
bunx prisma db seed

# 6. Iniciar servidor local
bun run dev

# 7. Acessar
# http://localhost:8565
```

---

## 📚 Referências

- [NextAuth.js Documentation](https://next-auth.js.org)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Stripe Documentation](https://stripe.com/docs)
- [RBAC Pattern](https://en.wikipedia.org/wiki/Role-based_access_control)

---

## 💬 Notas

- Este plano foi criado em 11 de novembro de 2025
- Será revisado semanalmente conforme progresso
- Ajustes podem ser necessários baseado em feedback
- Prioridade: Segurança > Funcionalidade > Performance

---

**Próximo Passo:** Iniciar Fase 1 - Setup Base
