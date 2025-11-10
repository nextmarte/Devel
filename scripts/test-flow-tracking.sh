#!/bin/bash

# Script para testar o fluxo de tracking de eventos

echo "🧪 Iniciando teste de tracking de eventos..."
echo ""

# Esperar um pouco para garantir que o servidor está pronto
echo "⏳ Aguardando servidor (3 segundos)..."
sleep 3

# Criar um arquivo de áudio de teste (silêncio de 2 segundos em PCM)
echo "🎵 Criando arquivo de áudio de teste..."
# Criar arquivo WAV simples com silêncio
ffmpeg -f lavfi -i anullsrc=r=16000:cl=mono -t 2 -q:a 9 -acodec libmp3lame -ab 32k /tmp/test_audio.mp3 -y 2>/dev/null

if [ ! -f /tmp/test_audio.mp3 ]; then
    echo "❌ Erro ao criar arquivo de áudio"
    exit 1
fi

echo "✅ Arquivo de áudio criado: /tmp/test_audio.mp3 ($(ls -lh /tmp/test_audio.mp3 | awk '{print $5}'))"
echo ""

# Fazer upload
echo "📤 Fazendo upload do arquivo..."
curl -X POST \
  -F "file=@/tmp/test_audio.mp3" \
  -F "generateSummary=true" \
  -H "X-Session-Id: test-session-$(date +%s)" \
  http://localhost:3000/api/transcribe/async \
  -s | tee /tmp/upload_response.json

echo ""
echo ""
echo "📊 Resposta do upload:"
cat /tmp/upload_response.json | jq . 2>/dev/null || cat /tmp/upload_response.json

# Extrair jobId
JOB_ID=$(cat /tmp/upload_response.json | grep -o '"jobId":"[^"]*' | cut -d'"' -f4)
echo ""
echo "🆔 jobId extraído: $JOB_ID"

if [ -z "$JOB_ID" ]; then
    echo "❌ Não foi possível extrair jobId da resposta"
    exit 1
fi

echo ""
echo "⏳ Aguardando 5 segundos antes de consultar status..."
sleep 5

echo ""
echo "🔍 Consultando status do job..."
for i in {1..15}; do
    echo ""
    echo "=== Tentativa $i ==="
    
    RESPONSE=$(curl -s \
      -H "X-Session-Id: test-session-$(date +%s)" \
      http://localhost:3000/api/jobs/$JOB_ID)
    
    STATUS=$(echo "$RESPONSE" | jq -r '.job.status // "UNKNOWN"' 2>/dev/null)
    EVENTS=$(echo "$RESPONSE" | jq '.job.processingEvents // []' 2>/dev/null)
    EVENT_COUNT=$(echo "$EVENTS" | jq 'length' 2>/dev/null)
    
    echo "Status: $STATUS"
    echo "Eventos encontrados: $EVENT_COUNT"
    
    if [ "$EVENT_COUNT" -gt 0 ]; then
        echo "✅ Eventos detectados!"
        echo "$EVENTS" | jq . 
    fi
    
    if [ "$STATUS" = "SUCCESS" ] || [ "$STATUS" = "FAILURE" ]; then
        echo ""
        echo "✅ Job completado com status: $STATUS"
        echo ""
        echo "📋 Resposta completa:"
        echo "$RESPONSE" | jq . 
        break
    fi
    
    echo "⏳ Aguardando 2 segundos para próxima tentativa..."
    sleep 2
done

echo ""
echo "✅ Teste concluído!"
