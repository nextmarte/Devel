#!/bin/bash

# Script de teste para validar o fix de polling infinito

echo "=== Teste de Polling Infinito - Fix ==="
echo ""

# Simular session ID
SESSION_ID="session_test_$(date +%s)_abc123"
echo "📌 Session ID simulado: $SESSION_ID"
echo ""

# Task ID da resposta anterior do usuário
TASK_ID="102100da-a94e-48db-97a1-61d12fd6260a"
PREFIXED_JOB_ID="${SESSION_ID}:${TASK_ID}"

echo "📌 Task ID (da API): $TASK_ID"
echo "📌 Prefixed Job ID: $PREFIXED_JOB_ID"
echo ""

# Primeiro, vamos chamar a API local para sincronizar
echo "🔄 Chamando GET /api/jobs/[jobId] com sessionId..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "X-Session-Id: $SESSION_ID" \
  "http://localhost:8565/api/jobs/$PREFIXED_JOB_ID")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "📬 HTTP Status: $HTTP_CODE"
echo "📬 Response Body:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

# Extrair status
STATUS=$(echo "$BODY" | jq -r '.job.status' 2>/dev/null)
echo "✅ Status do Job: $STATUS"
echo ""

if [ "$STATUS" == "SUCCESS" ]; then
  echo "✅ SUCESSO! Job foi sincronizado com status SUCCESS"
  echo "✅ Polling deveria ter parado!"
  
  # Validar que temos resultado
  TRANSCRIPTION=$(echo "$BODY" | jq -r '.job.result.rawTranscription' 2>/dev/null | head -c 50)
  if [ -n "$TRANSCRIPTION" ] && [ "$TRANSCRIPTION" != "null" ]; then
    echo "✅ Resultado carregado: ${TRANSCRIPTION}..."
  else
    echo "⚠️  Resultado vazio ou nulo"
  fi
else
  echo "❌ FALHA! Status ainda é: $STATUS"
  echo "❌ Polling continuaria infinito!"
fi

echo ""
echo "=== Teste Concluído ==="
