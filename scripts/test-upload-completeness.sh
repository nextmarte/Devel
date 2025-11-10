#!/bin/bash

# Script para testar se o arquivo está sendo enviado completo

FILE_PATH="/home/marcus/desenvolvimento/Devel/WhatsApp Audio 2025-10-25 at 14.52.18.ogg"
API_URL="http://localhost:8565"
OUTPUT_DIR="/tmp/upload-test"

# Criar diretório de output
mkdir -p "$OUTPUT_DIR"

# Mostrar informações do arquivo original
echo "📋 ===== ARQUIVO ORIGINAL ====="
FILE_SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH" 2>/dev/null)
FILE_HASH=$(md5sum "$FILE_PATH" | awk '{print $1}')
echo "📁 Arquivo: $(basename "$FILE_PATH")"
echo "📊 Tamanho: $(numfmt --to=iec-i --suffix=B $FILE_SIZE 2>/dev/null || echo "$FILE_SIZE bytes")"
echo "🔐 MD5: $FILE_HASH"
echo ""

# Fazer upload usando FormData (como o frontend faz)
echo "📤 ===== INICIANDO UPLOAD ====="
echo "Enviando para: $API_URL/api/transcribe/async"
echo ""

# Capturar resposta completa
RESPONSE=$(curl -v -X POST "$API_URL/api/transcribe/async" \
  -F "file=@$FILE_PATH" \
  -F "language=pt" \
  -F "webhook_url=" \
  2>&1)

# Salvar resposta
echo "$RESPONSE" > "$OUTPUT_DIR/upload-response.txt"

# Extrair task_id
TASK_ID=$(echo "$RESPONSE" | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4 | head -1)

echo "✅ Resposta salva em: $OUTPUT_DIR/upload-response.txt"
echo "📌 Task ID: $TASK_ID"
echo ""

if [ -z "$TASK_ID" ]; then
  echo "❌ Erro: Não conseguiu extrair task_id"
  echo "Resposta completa:"
  cat "$OUTPUT_DIR/upload-response.txt"
  exit 1
fi

# Aguardar um pouco para o arquivo ser processado
echo "⏳ Aguardando processamento (10s)..."
sleep 10

# Verificar status
echo ""
echo "🔍 ===== VERIFICANDO STATUS ====="
STATUS_RESPONSE=$(curl -s "$API_URL/api/transcribe/async/status/$TASK_ID")
echo "Status API: "
echo "$STATUS_RESPONSE" | jq . 2>/dev/null || echo "$STATUS_RESPONSE"

# Salvar status
echo "$STATUS_RESPONSE" > "$OUTPUT_DIR/status-response.json"

# Extrair informações do áudio recebido
RECEIVED_SIZE=$(echo "$STATUS_RESPONSE" | jq -r '.result.audio_info.file_size_mb // 0' 2>/dev/null || echo "0")
RECEIVED_DURATION=$(echo "$STATUS_RESPONSE" | jq -r '.result.audio_info.duration // 0' 2>/dev/null || echo "0")

echo ""
echo "📊 ===== COMPARAÇÃO ====="
echo "📁 Tamanho original: $FILE_SIZE bytes"
echo "📁 Tamanho recebido: $(echo "$RECEIVED_SIZE * 1024 * 1024" | bc) bytes"
echo "⏱️  Duração da transcrição: $RECEIVED_DURATION segundos"

# Calcular diferença percentual
if [ "$FILE_SIZE" -gt 0 ]; then
  RECEIVED_BYTES=$(echo "$RECEIVED_SIZE * 1024 * 1024" | bc)
  PERCENTAGE=$(echo "scale=2; ($RECEIVED_BYTES / $FILE_SIZE) * 100" | bc)
  echo "✓ Percentual: $PERCENTAGE%"
  
  if (( $(echo "$PERCENTAGE < 100" | bc -l) )); then
    echo "⚠️  AVISO: Apenas $PERCENTAGE% do arquivo foi recebido!"
    echo "❌ Arquivo TRUNCADO!"
  else
    echo "✅ Arquivo completo!"
  fi
fi

echo ""
echo "📁 Arquivos de teste salvos em: $OUTPUT_DIR/"
ls -lah "$OUTPUT_DIR/"
