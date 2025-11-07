#!/bin/bash

# Teste simples e direto do fluxo async

echo "🧪 TESTE DO FLUXO ASSÍNCRONO"
echo ""
echo "1️⃣ Criando arquivo de teste..."

# Criar arquivo WAV com silêncio de 2 segundos
dd if=/dev/zero of=/tmp/silence.raw bs=1 count=64000 2>/dev/null
ffmpeg -f u8 -acodec pcm_u8 -ar 16000 -ac 1 -i /tmp/silence.raw -acodec libmp3lame -ab 32k /tmp/test.mp3 -y 2>/dev/null

echo "✅ Arquivo criado: /tmp/test.mp3"
echo ""

echo "2️⃣ Fazendo upload..."
SESSION_ID="test-$(date +%s)"
echo "   Session ID: $SESSION_ID"
echo ""

UPLOAD_RESPONSE=$(curl -s -X POST \
  -F "file=@/tmp/test.mp3" \
  -F "generateSummary=true" \
  -H "X-Session-Id: $SESSION_ID" \
  http://localhost:3000/api/transcribe/async)

echo "Resposta do upload:"
echo "$UPLOAD_RESPONSE" | jq . 2>/dev/null || echo "$UPLOAD_RESPONSE"

JOB_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"jobId":"[^"]*' | cut -d'"' -f4 || echo "")

if [ -z "$JOB_ID" ]; then
    echo ""
    echo "❌ Não foi possível extrair jobId"
    exit 1
fi

echo ""
echo "✅ jobId: $JOB_ID"
echo ""
echo "⏳ Aguardando 3 segundos..."
sleep 3

echo ""
echo "3️⃣ Consultando status..."
for i in {1..10}; do
    echo ""
    echo "--- Tentativa $i ---"
    
    STATUS_RESPONSE=$(curl -s \
      -H "X-Session-Id: $SESSION_ID" \
      http://localhost:3000/api/jobs/$JOB_ID)
    
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.job.status // "UNKNOWN"' 2>/dev/null)
    echo "Status: $STATUS"
    
    if [ "$STATUS" = "SUCCESS" ] || [ "$STATUS" = "FAILURE" ]; then
        echo ""
        echo "✅ Job completado!"
        echo ""
        echo "Resposta completa:"
        echo "$STATUS_RESPONSE" | jq . 2>/dev/null || echo "$STATUS_RESPONSE"
        break
    fi
    
    sleep 2
done

echo ""
echo "✅ Teste finalizado!"
