# Dockerfile para aplicação Next.js
FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Instala as dependências
RUN npm install

# Copia o restante do código da aplicação
COPY . .

# Copia o arquivo .env para o diretório de trabalho
COPY .env .env

# Build da aplicação Next.js
RUN npm run build

# Verifica se o build foi criado
RUN ls -la .next || (echo "Build failed - .next directory not found" && exit 1)

# Verifica se o build foi criado
RUN ls -la .next || (echo "Build failed - .next directory not found" && exit 1)

# Expõe a porta 8565
EXPOSE 8565

# Inicia a aplicação Next.js na porta 8565
CMD ["npx", "next", "start", "-p", "8565"]
