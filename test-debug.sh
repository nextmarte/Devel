#!/bin/bash

# Aguardar servidor estar pronto
sleep 2

# Obter cookie de sessão
echo "🔍 Tentando acessar dashboard..."
RESPONSE=$(curl -s -i http://localhost:8565/dashboard 2>&1)
COOKIE=$(echo "$RESPONSE" | grep -i 'set-cookie' | grep 'next-auth' | head -1 | sed 's/.*\(next-auth[^;]*\).*/\1/')

if [ -z "$COOKIE" ]; then
  echo "❌ Não conseguiu obter cookie de sessão"
  echo "$RESPONSE" | head -20
  exit 1
fi

echo "✅ Cookie obtido: $COOKIE"
echo ""
echo "🔍 Verificando transcrições no banco..."

# Chamar endpoint de debug
curl -s http://localhost:8565/api/debug/transcriptions \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" | jq . 2>&1 || echo "Erro ao chamar API"
