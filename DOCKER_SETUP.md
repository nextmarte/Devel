# 🐳 Docker Setup Guide - DEVEL Platform

Este documento descreve como executar o projeto DEVEL completamente em containers Docker.

## 📋 Pré-requisitos

- **Docker Desktop** ou **Docker Engine 20.10+**
- **Docker Compose 2.0+**
- **Git**

### Instalar Docker

**macOS & Windows:**
- Baixar [Docker Desktop](https://www.docker.com/products/docker-desktop)

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

## 🚀 Quick Start

### 1. Setup Inicial (Primeira Vez)

```bash
# Clonar repositório
git clone https://github.com/nextmarte/Devel.git
cd Devel

# Copiar arquivo de ambiente
cp .env.docker .env.local

# IMPORTANTE: Editar .env.local com suas credenciais
# - Gerar NEXTAUTH_SECRET:
#   openssl rand -base64 32
# - Adicionar OAuth credentials (Google, GitHub)
# - Adicionar Stripe keys (futuro)

nano .env.local  # ou use seu editor favorito
```

### 2. Build e Iniciar

```bash
# Construir containers
make build

# Iniciar containers
make up

# Verificar status
make ps

# Ver logs
make logs
```

**Acessar:**
- 🌐 Aplicação: http://localhost:8565
- 📊 PgAdmin: http://localhost:5050 (executar `make pgadmin` primeiro)

### 3. Estrutura do Projeto

```
Devel/
├── docker-compose.yml      # Configuração dos containers
├── Dockerfile              # Build da aplicação Next.js
├── .env.docker            # Variáveis de ambiente (copiar para .env.local)
├── Makefile               # Comandos úteis
├── scripts/
│   ├── entrypoint.sh      # Script de inicialização
│   └── init-db.sql        # Inicialização do PostgreSQL
├── src/
│   ├── app/               # Aplicação Next.js
│   └── lib/               # Utilitários
└── prisma/
    ├── schema.prisma      # Schema do banco (será criado)
    └── seed.ts            # Seeds do banco (será criado)
```

## 📦 Containers

### devel-app (Next.js)
- **Porta:** 8565
- **URL:** http://localhost:8565
- **Dependências:** postgres, redis
- **Health Check:** GET /api/health (a ser implementado)

### postgres (PostgreSQL)
- **Versão:** 16-Alpine
- **Porta:** 5432
- **Host interno:** postgres:5432
- **User:** devel_user
- **Database:** devel_db
- **Volume:** postgres_data (persiste dados)

### redis (Redis Cache)
- **Versão:** 7-Alpine
- **Porta:** 6379
- **Host interno:** redis:6379
- **Volume:** redis_data (persiste dados)

### pgadmin (PostgreSQL Admin - DEV ONLY)
- **Porta:** 5050
- **URL:** http://localhost:5050
- **Email:** admin@devel.local
- **Senha:** admin
- **Iniciar:** `make pgadmin`

## 🔧 Comandos Úteis (Make)

```bash
# ========== STARTUP ==========
make build              # Construir containers
make up                 # Iniciar containers
make down               # Parar containers
make restart            # Reiniciar containers
make clean              # Remover tudo (volumes + containers)

# ========== DATABASE ==========
make seed               # Executar seeds
make migrate            # Executar migrações (dev)
make migrate-prod       # Executar migrações (produção)
make pgadmin            # Iniciar PgAdmin

# ========== MONITORING ==========
make logs               # Ver logs da app
make logs-db            # Ver logs do PostgreSQL
make ps                 # Status dos containers
make status             # Info completa
make health             # Health check dos containers

# ========== DEVELOPMENT ==========
make shell              # Acessar shell do container
make shell-db           # Acessar psql no container
make db-shell           # Alias para shell-db

# ========== UTILITIES ==========
make prune              # Limpar recursos não utilizados
make info-docker        # Info do Docker
make info-env           # Info de variáveis de ambiente
```

## 🔐 Variáveis de Ambiente

### Obrigatórias para Setup
```env
NEXTAUTH_SECRET=<gerar-com: openssl rand -base64 32>
DATABASE_URL=postgresql://devel_user:devel_password@postgres:5432/devel_db
REDIS_URL=redis://:redis_password@redis:6379
```

### Para Autenticação Social (OAuth)
```env
# Google: https://console.cloud.google.com
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret

# GitHub: https://github.com/settings/developers
GITHUB_ID=your-id
GITHUB_SECRET=your-secret
```

### Para Billing (Stripe)
```env
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Para Email
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # App-specific password, not real password
```

## 📊 Fluxo de Inicialização

```
1. docker-compose up -d
   ↓
2. PostgreSQL inicia
   ↓
3. Redis inicia
   ↓
4. devel-app aguarda PostgreSQL e Redis healthy
   ↓
5. entrypoint.sh executa:
   a. Aguarda postgres_isready
   b. Aguarda redis-cli ping
   c. npx prisma migrate deploy
   d. npx prisma db seed
   e. next start -p 8565
   ↓
6. Aplicação disponível em http://localhost:8565
```

## 🐛 Troubleshooting

### Containers não iniciam
```bash
# Ver logs detalhados
docker-compose logs -f

# Ver logs de um container específico
docker-compose logs -f devel-app
docker-compose logs -f postgres
docker-compose logs -f redis

# Verificar status
make health
```

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está pronto
docker-compose exec postgres pg_isready

# Entrar no PostgreSQL
make shell-db

# Verificar migrações
docker-compose exec devel-app npx prisma migrate status
```

### Redis não conecta
```bash
# Testar conexão Redis
docker-compose exec redis redis-cli ping

# Ver logs
docker-compose logs redis
```

### Porta já em uso
```bash
# Encontrar processo usando porta
lsof -i :8565      # app
lsof -i :5432      # postgres
lsof -i :6379      # redis
lsof -i :5050      # pgadmin

# Ou mudar porta no .env.local
# Exemplo: mudar app de 8565 para 3000
# Editar: docker-compose.yml e .env.local
```

### Limpar e começar do zero
```bash
# Remover tudo
make clean

# Build novamente
make build

# Iniciar
make up

# Ver se iniciou
make health
```

## 💾 Persistência de Dados

Os dados são persistidos em volumes Docker:

```bash
# Ver volumes
docker volume ls | grep devel

# Inspecionar volume
docker volume inspect devel_postgres_data

# Fazer backup do banco
docker-compose exec postgres pg_dump -U devel_user devel_db > backup.sql

# Restaurar banco
docker-compose exec -T postgres psql -U devel_user devel_db < backup.sql
```

## 🔄 Workflow de Desenvolvimento

### Alterar código Python/Node
```bash
# Mudanças em src/ são refletidas automaticamente (volumes mounted)
# Não é necessário rebuild

# Se mudar dependências (package.json)
docker-compose down
make build
make up
```

### Criar nova migração
```bash
# Local (recomendado)
bunx prisma migrate dev --name your_migration_name

# Ou via container
docker-compose exec devel-app npx prisma migrate dev --name your_migration_name
```

### Executar seeds
```bash
make seed

# Ou manualmente
docker-compose exec devel-app npx prisma db seed
```

### Acessar banco via PgAdmin
```bash
# 1. Iniciar PgAdmin
make pgadmin

# 2. Acessar http://localhost:5050

# 3. Fazer login
# Email: admin@devel.local
# Senha: admin

# 4. Adicionar servidor
# Host: postgres (nome do container na network)
# Port: 5432
# User: devel_user
# Password: devel_password
```

## 🌐 Rede Docker

Todos os containers estão na mesma network (`devel-network`), permitindo comunicação via hostname:

```
devel-app  → postgres:5432  (Database)
devel-app  → redis:6379     (Cache/Session)
pgadmin    → postgres:5432  (Admin)
```

## 📈 Performance

### Limitar recursos
```bash
# Editar docker-compose.yml para adicionar limites
services:
  devel-app:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### Otimizações
- PostgreSQL: shared_buffers=256MB (configurado)
- Redis: appendonly=yes (persistência)
- Next.js: Next.js na porta 8565, não 3000

## 🔒 Security Notes

⚠️ **Importante para Produção:**
1. Gerar novo NEXTAUTH_SECRET
2. Usar senhas complexas (não usar padrões)
3. Usar variáveis de ambiente seguras
4. Não commitar .env.local no git
5. Usar HTTPS em produção
6. Configurar firewall
7. Usar reverse proxy (Nginx/Traefik)

## 📚 Recursos

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment/docker)
- [Prisma Docker Guide](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#running-with-docker)

## ❓ FAQ

**P: Como salvo dados entre rebuilds?**
A: Use volumes Docker (já configurados). Os dados persistem mesmo removendo containers.

**P: Posso usar Docker sem make?**
A: Sim, use `docker-compose` diretamente (make é apenas atalho).

**P: Como faço deploy em produção?**
A: Use docker-compose com versões fixas ou Kubernetes/Docker Swarm.

**P: Posso adicionar mais containers?**
A: Sim, adicione ao docker-compose.yml e na rede devel-network.

**P: Como vejo banco de dados?**
A: Use `make pgadmin` e acesse http://localhost:5050

---

**Última atualização:** 11 de novembro de 2025
