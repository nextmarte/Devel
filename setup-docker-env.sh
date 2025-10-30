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
read -p "Digite sua GOOGLE_API_KEY (ou pressione Enter para pular): " google_key
if [ ! -z "$google_key" ]; then
    sed -i "s|your-google-api-key-here|$google_key|g" .env.local
fi

read -p "Digite sua GEMINI_API_KEY (ou pressione Enter para pular): " gemini_key
if [ ! -z "$gemini_key" ]; then
    sed -i "s|your-gemini-api-key-here|$gemini_key|g" .env.local
fi

read -p "Digite a NEXT_PUBLIC_DAREDEVIL_API_URL (ou pressione Enter para usar default): " api_url
if [ ! -z "$api_url" ]; then
    sed -i "s|https://devel.cid-uff.net|$api_url|g" .env.local
fi

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "Próximos passos:"
echo "1. Execute: docker-compose up -d"
echo "2. Acesse: http://localhost:8565"
echo ""
