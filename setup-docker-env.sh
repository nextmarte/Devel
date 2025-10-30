#!/bin/bash

# Script para configurar variáveis de ambiente para Docker

echo "🔑 Configuração de Variáveis de Ambiente para Docker"
echo "======================================================"
echo ""

# Verificar se .env.local existe
if [ -f .env.local ]; then
    echo "✅ Arquivo .env.local encontrado"
    echo ""
else
    echo "📋 Criando .env.local a partir de .env.docker..."
    cp .env.docker .env.local
    echo "✅ Arquivo .env.local criado"
    echo ""
fi

# Perguntar pelos valores
read -p "Digite sua DEEPSEEK_API_KEY (ou pressione Enter para pular): " deepseek_key
if [ ! -z "$deepseek_key" ]; then
    # Escape special characters in the key for sed
    escaped_key=$(printf '%s\n' "$deepseek_key" | sed -e 's/[\/&]/\\&/g')
    sed -i "s|your-deepseek-api-key-here|$escaped_key|g" .env.local
fi

read -p "Digite a NEXT_PUBLIC_DAREDEVIL_API_URL (ou pressione Enter para usar default): " api_url
if [ ! -z "$api_url" ]; then
    # Escape special characters in the URL for sed
    escaped_url=$(printf '%s\n' "$api_url" | sed -e 's/[\/&]/\\&/g')
    sed -i "s|https://devel.cid-uff.net|$escaped_url|g" .env.local
fi

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "Próximos passos:"
echo "1. Execute: docker-compose up -d"
echo "2. Acesse: http://localhost:8565"
echo ""
