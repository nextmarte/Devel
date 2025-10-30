# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json bun.lockb* ./

# Instalar bun globalmente
RUN npm install -g bun

# Instalar dependências
RUN bun install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação
RUN bun run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Instalar bun no container final
RUN npm install -g bun

# Copiar arquivos de dependências
COPY package.json bun.lockb* ./

# Instalar apenas dependências de produção
RUN bun install --frozen-lockfile --production

# Copiar arquivos built do stage anterior
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./

# Criar diretório public
RUN mkdir -p public

# Expor porta
EXPOSE 8565

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=8565

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8565', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Comando para rodar a aplicação
CMD ["bun", "run", "start"]
