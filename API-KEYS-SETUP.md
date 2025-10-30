# 🔑 Como Configurar as Chaves de API

## 1️⃣ Obtenha suas chaves de API

### DeepSeek API
1. Acesse: https://platform.deepseek.com/api_keys
2. Crie uma conta ou faça login
3. Clique em "Create API Key"
4. Copie a chave gerada

## 2️⃣ Configure as variáveis de ambiente

### Opção A: Script automático (recomendado)
```bash
chmod +x setup-docker-env.sh
./setup-docker-env.sh
```

### Opção B: Manual
1. Copie o arquivo de template:
```bash
cp .env.docker .env.local
```

2. Edite `.env.local` e adicione suas chaves:
```
DEEPSEEK_API_KEY=sua-chave-aqui
NEXT_PUBLIC_DAREDEVIL_API_URL=https://devel.cid-uff.net
```

## 3️⃣ Inicie o container

```bash
# Com Docker Compose
docker-compose up -d

# Ou com Docker puro
docker run -d -p 8565:8565 \
  --env-file .env.local \
  --name devel-app \
  devel-app:latest
```

## 4️⃣ Verifique se está funcionando

```bash
# Ver logs
docker logs -f devel-app

# Acessar
# http://localhost:8565
```

## 🆘 Troubleshooting

### Erro: "API key not found"
- ✅ Verifique se `.env.local` existe
- ✅ Verifique se as chaves estão corretas em `.env.local`
- ✅ Reinicie o container: `docker-compose restart app`

### Erro: "Invalid API key"
- ✅ Verifique se a chave foi copiada corretamente (sem espaços)
- ✅ Verifique se a chave ainda é válida na Google Cloud Console

### Container para logo após iniciar
```bash
docker logs devel-app
```

## 📖 Recursos

- [DeepSeek Platform](https://platform.deepseek.com/)
- [DeepSeek API Documentation](https://platform.deepseek.com/api-docs/)
- [Genkit Documentation](https://genkit.dev/)
