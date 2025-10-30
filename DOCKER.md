# 🐳 Guia de Containerização com Docker

## 📋 Pré-requisitos

- Docker instalado (versão 20.10+)
- Docker Compose instalado (versão 1.29+)
- As variáveis de ambiente configuradas

## 🚀 Como Executar

### Opção 1: Com Docker Compose (Recomendado)

```bash
# 1. Configure as variáveis de ambiente
cp .env.docker .env.local

# 2. Edite o arquivo .env.local com seus valores
nano .env.local

# 3. Build e execute
docker-compose up -d

# 4. Verifique o status
docker-compose ps

# 5. Acesse a aplicação
# http://localhost:8565
```

### Opção 2: Apenas Docker

```bash
# 1. Build da imagem
docker build -t devel-app:latest .

# 2. Execute o container
docker run -d \
  --name devel-app \
  -p 8565:8565 \
  -e NEXT_PUBLIC_DAREDEVIL_API_URL="http://devel.cid-uff.net" \
  devel-app:latest

# 3. Acesse a aplicação
# http://localhost:8565
```

## 📊 Comandos Úteis

### Logs
```bash
# Ver logs em tempo real
docker-compose logs -f app

# Ver logs de um container específico
docker logs -f devel-app
```

### Gerenciamento
```bash
# Parar a aplicação
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Reiniciar o container
docker-compose restart app

# Acessar o shell do container
docker exec -it devel-app sh
```

### Build
```bash
# Rebuild sem cache
docker-compose build --no-cache

# Build da imagem
docker build --no-cache -t devel-app:latest .
```

## 🔧 Configuração de Variáveis

As variáveis de ambiente devem ser configuradas em `.env.local`:

```env
NODE_ENV=production
PORT=8565
NEXT_PUBLIC_DAREDEVIL_API_URL=http://seu-api-url-aqui
```

## 🌐 Acesso Externo

A aplicação estará disponível em:
- **Local**: http://localhost:8565
- **Rede**: http://seu-ip:8565 (a partir de outros dispositivos)

## ✅ Health Check

O container possui um health check configurado que:
- Verifica a saúde a cada 30 segundos
- Considera a aplicação saudável quando responde com status 200
- Retenta até 3 vezes antes de marcar como unhealthy

Ver status:
```bash
docker inspect --format='{{json .State.Health}}' devel-app | jq
```

## 📦 Tamanho da Imagem

A imagem final deve ter aproximadamente 200-300MB (otimizada com multi-stage build).

Para reduzir ainda mais, use uma imagem base menor:
```dockerfile
FROM node:20-alpine AS builder
# ... resto do Dockerfile
```

## 🐛 Troubleshooting

### A porta 8565 já está em uso
```bash
# Encontrar qual processo está usando a porta
lsof -i :8565

# Usar uma porta diferente
docker run -p 9000:8565 ...
```

### Container para imediatamente após iniciar
```bash
# Ver logs para diagnóstico
docker logs devel-app

# Verificar se as variáveis de ambiente estão corretas
docker inspect devel-app | grep -A 20 "Env"
```

### Permissões negadas
```bash
# Se receber erro de permissão com Docker
sudo usermod -aG docker $USER
newgrp docker
```

## 📈 Performance

Para melhor performance em produção:

```yaml
services:
  app:
    # ... configuração anterior ...
    cpus: '1'
    memory: 1024m
    memswap_limit: 2048m
    environment:
      NODE_OPTIONS: "--max-old-space-size=512"
```

## 🔐 Segurança

Recomendações de segurança:

1. Nunca exponha variáveis sensíveis no `.env.docker`
2. Use secrets do Docker Compose em produção:
   ```yaml
   environment:
     - NEXT_PUBLIC_DAREDEVIL_API_URL_FILE=/run/secrets/api_url
   secrets:
     api_url:
       file: ./secrets/api_url.txt
   ```

3. Execute como usuário não-root:
   ```dockerfile
   RUN useradd -m -u 1000 appuser
   USER appuser
   ```

## 📚 Recursos Adicionais

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
