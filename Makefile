.PHONY: help build up down logs logs-db shell seed migrate migrate-prod restart clean pgadmin ps status health

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help:
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║             DEVEL PLATFORM - Docker Commands              ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)🚀 Startup Commands:$(NC)"
	@echo "  $(GREEN)make build$(NC)              - Construir containers"
	@echo "  $(GREEN)make up$(NC)                 - Iniciar containers"
	@echo "  $(GREEN)make down$(NC)               - Parar containers"
	@echo "  $(GREEN)make restart$(NC)            - Reiniciar containers"
	@echo "  $(GREEN)make clean$(NC)              - Limpar tudo (remove volumes)"
	@echo ""
	@echo "$(YELLOW)📊 Database Commands:$(NC)"
	@echo "  $(GREEN)make seed$(NC)               - Executar seeds do banco"
	@echo "  $(GREEN)make migrate$(NC)            - Executar migrações (dev)"
	@echo "  $(GREEN)make migrate-prod$(NC)       - Executar migrações (produção)"
	@echo "  $(GREEN)make pgadmin$(NC)            - Iniciar PgAdmin (DEV)"
	@echo ""
	@echo "$(YELLOW)📋 Monitoring Commands:$(NC)"
	@echo "  $(GREEN)make logs$(NC)               - Ver logs da aplicação"
	@echo "  $(GREEN)make logs-db$(NC)            - Ver logs do PostgreSQL"
	@echo "  $(GREEN)make ps$(NC)                 - Ver status dos containers"
	@echo "  $(GREEN)make status$(NC)             - Ver informações completas"
	@echo "  $(GREEN)make health$(NC)             - Verificar saúde dos containers"
	@echo ""
	@echo "$(YELLOW)🔧 Development Commands:$(NC)"
	@echo "  $(GREEN)make shell$(NC)              - Entrar no shell do container"
	@echo ""

# ==================== STARTUP COMMANDS ====================

build:
	@echo "$(BLUE)🔨 Construindo containers...$(NC)"
	docker-compose build
	@echo "$(GREEN)✅ Containers construídos com sucesso!$(NC)"

up:
	@echo "$(BLUE)🚀 Iniciando containers...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Containers iniciados!$(NC)"
	@echo ""
	@echo "$(YELLOW)📍 URLs de Acesso:$(NC)"
	@echo "  • Aplicação: $(BLUE)http://localhost:8565$(NC)"
	@echo "  • PgAdmin: $(BLUE)http://localhost:5050$(NC) (rodear com: make pgadmin)"
	@echo ""
	@echo "$(YELLOW)Aguardando inicialização completa...$(NC)"
	@sleep 5
	@docker-compose logs devel-app | tail -5

down:
	@echo "$(BLUE)🛑 Parando containers...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Containers parados!$(NC)"

restart:
	@echo "$(BLUE)🔄 Reiniciando containers...$(NC)"
	docker-compose restart devel-app
	@echo "$(GREEN)✅ Containers reiniciados!$(NC)"

clean:
	@echo "$(RED)⚠️  Removendo todos os containers, volumes e networks...$(NC)"
	@read -p "Tem certeza? (s/n) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Ss]$$ ]]; then \
		docker-compose down -v; \
		echo "$(GREEN)✅ Limpeza concluída!$(NC)"; \
	else \
		echo "$(YELLOW)Operação cancelada.$(NC)"; \
	fi

# ==================== DATABASE COMMANDS ====================

seed:
	@echo "$(BLUE)🌱 Executando seeds do banco...$(NC)"
	docker-compose exec devel-app npx prisma db seed
	@echo "$(GREEN)✅ Seeds executados!$(NC)"

migrate:
	@echo "$(BLUE)🔄 Executando migrações (dev)...$(NC)"
	docker-compose exec devel-app npx prisma migrate dev
	@echo "$(GREEN)✅ Migrações executadas!$(NC)"

migrate-prod:
	@echo "$(BLUE)🔄 Executando migrações (produção)...$(NC)"
	docker-compose exec devel-app npx prisma migrate deploy
	@echo "$(GREEN)✅ Migrações executadas!$(NC)"

pgadmin:
	@echo "$(BLUE)🐘 Iniciando PgAdmin...$(NC)"
	docker-compose --profile dev up -d pgadmin
	@echo "$(GREEN)✅ PgAdmin iniciado!$(NC)"
	@echo "$(YELLOW)📍 PgAdmin: $(BLUE)http://localhost:5050$(NC)"
	@echo "$(YELLOW)Email: $(BLUE)admin@devel.local$(NC)"
	@echo "$(YELLOW)Senha: $(BLUE)admin$(NC)"

# ==================== MONITORING COMMANDS ====================

logs:
	@docker-compose logs -f devel-app

logs-db:
	@docker-compose logs -f postgres

ps:
	@echo "$(YELLOW)📦 Status dos Containers:$(NC)"
	@docker-compose ps
	@echo ""

status:
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║                    SYSTEM STATUS                           ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)📦 Containers:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(YELLOW)🌐 Networks:$(NC)"
	@docker network ls | grep devel
	@echo ""
	@echo "$(YELLOW)💾 Volumes:$(NC)"
	@docker volume ls | grep devel
	@echo ""

health:
	@echo "$(BLUE)🏥 Health Check dos Containers:$(NC)"
	@echo ""
	@for service in devel-app postgres redis; do \
		status=$$(docker-compose ps $$service | grep -o "healthy\|unhealthy\|Up" | head -1); \
		if [ "$$status" = "healthy" ]; then \
			echo "$(GREEN)✅ $$service: Healthy$(NC)"; \
		elif [ "$$status" = "unhealthy" ]; then \
			echo "$(RED)❌ $$service: Unhealthy$(NC)"; \
		elif [ "$$status" = "Up" ]; then \
			echo "$(YELLOW)⚠️  $$service: Up (sem health check)$(NC)"; \
		else \
			echo "$(RED)❌ $$service: Down$(NC)"; \
		fi; \
	done

# ==================== DEVELOPMENT COMMANDS ====================

shell:
	@docker-compose exec devel-app sh

shell-db:
	@docker-compose exec postgres psql -U $${DB_USER:-devel_user} -d $${DB_NAME:-devel_db}

# ==================== UTILITY COMMANDS ====================

prune:
	@echo "$(YELLOW)🧹 Removendo containers, imagens e volumes não utilizados...$(NC)"
	docker system prune -f
	docker volume prune -f
	@echo "$(GREEN)✅ Limpeza concluída!$(NC)"

logs-tail:
	@docker-compose logs --tail=50 -f

db-shell:
	@echo "$(BLUE)🐘 Conectando ao PostgreSQL...$(NC)"
	docker-compose exec postgres psql -U $${DB_USER:-devel_user} -d $${DB_NAME:-devel_db}

# ==================== INFO ====================

.PHONY: info-docker info-env

info-docker:
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║              DOCKER ENVIRONMENT INFO                       ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "Docker version:"
	@docker --version
	@echo ""
	@echo "Docker Compose version:"
	@docker-compose --version
	@echo ""

info-env:
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║              ENVIRONMENT VARIABLES                         ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "NextAuth URL: $${NEXTAUTH_URL:-http://localhost:8565}"
	@echo "Database: $${DB_NAME:-devel_db}"
	@echo "Redis: $${REDIS_URL:-redis://:redis_password@localhost:6379}"
	@echo ""
