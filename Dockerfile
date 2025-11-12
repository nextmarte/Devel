# ==================== BUILD STAGE ====================
FROM oven/bun:latest AS builder

WORKDIR /app

# Instalar dependências do sistema (incluindo Node para prisma)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY package.json bun.lockb* package-lock.json* ./

# Instalar dependências com bun
RUN bun install --production=false || bun install

# Copiar código-fonte
COPY . .

# Gerar Prisma Client
RUN bunx prisma generate || true

# Build da aplicação
RUN bun run build

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

# Copiar scripts necessários
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
