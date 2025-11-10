#!/bin/bash

# Análise de truncamento de arquivo de áudio

echo "📊 ===== ANÁLISE DE TRUNCAMENTO ====="
echo ""

# Arquivo original
ORIGINAL_FILE="/home/marcus/desenvolvimento/Devel/WhatsApp Audio 2025-10-25 at 14.52.18.ogg"
ORIGINAL_SIZE=$(stat -c%s "$ORIGINAL_FILE")
ORIGINAL_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$ORIGINAL_FILE")

echo "📁 ARQUIVO ORIGINAL"
echo "  Arquivo: $(basename "$ORIGINAL_FILE")"
echo "  Tamanho: $ORIGINAL_SIZE bytes ($(numfmt --to=iec-i --suffix=B $ORIGINAL_SIZE 2>/dev/null || echo "$ORIGINAL_SIZE bytes"))"
echo "  Duração: $(printf "%.2f segundos (%.0f min %.0f seg)" $ORIGINAL_DURATION $((${ORIGINAL_DURATION%.*}/60)) $((${ORIGINAL_DURATION%.*}%60)))"
echo "  Bitrate médio: $(echo "scale=2; ($ORIGINAL_SIZE * 8 / $ORIGINAL_DURATION / 1000)" | bc) kbps"
echo ""

# Transcrição recebida
echo "📝 TRANSCRIÇÃO RECEBIDA"
TRANSCRIPT_WORDS=137
TRANSCRIPT_LINES=8

# Estimativa: ~2.5-3 palavras por segundo (média para português em reunião)
WORDS_PER_SECOND=2.7
ESTIMATED_DURATION=$(echo "scale=2; $TRANSCRIPT_WORDS / $WORDS_PER_SECOND" | bc)

echo "  Palavras: $TRANSCRIPT_WORDS"
echo "  Linhas: $TRANSCRIPT_LINES (turnos de fala)"
echo "  Palavras/segundo (estimado): $WORDS_PER_SECOND"
echo "  Duração estimada: $ESTIMATED_DURATION segundos"
echo ""

# Cálculo de truncamento
TRUNCATION_PERCENTAGE=$(echo "scale=2; ($ESTIMATED_DURATION / $ORIGINAL_DURATION) * 100" | bc)
MISSING_DURATION=$(echo "scale=2; $ORIGINAL_DURATION - $ESTIMATED_DURATION" | bc)

echo "🔴 TRUNCAMENTO DETECTADO"
echo "  Duração original: $ORIGINAL_DURATION segundos"
echo "  Duração transcrição: $ESTIMATED_DURATION segundos"
echo "  Percentual recebido: $TRUNCATION_PERCENTAGE%"
echo "  Tempo faltando: $MISSING_DURATION segundos (~$(printf "%.0f%%" $((100 - ${TRUNCATION_PERCENTAGE%.*}))))"
echo ""

# Análise de tamanho esperado vs recebido
EXPECTED_SIZE=$(echo "scale=0; $ORIGINAL_SIZE * ($ESTIMATED_DURATION / $ORIGINAL_DURATION)" | bc)
SIZE_PERCENTAGE=$(echo "scale=2; ($EXPECTED_SIZE / $ORIGINAL_SIZE) * 100" | bc)

echo "💾 ANÁLISE DE TAMANHO"
echo "  Tamanho original: $ORIGINAL_SIZE bytes"
echo "  Tamanho esperado (baseado em transcrição): $EXPECTED_SIZE bytes"
echo "  Percentual do tamanho: $SIZE_PERCENTAGE%"
echo ""

# Comparação
echo "⚠️  CONCLUSÃO"
if (( $(echo "$TRUNCATION_PERCENTAGE < 50" | bc -l) )); then
  echo "  ❌ TRUNCAMENTO SEVERO!"
  echo "  ❌ Apenas $(printf "%.0f%%" ${TRUNCATION_PERCENTAGE%.*})% do áudio foi transcrito!"
  echo "  ❌ Faltam $(printf "%.0f segundos" ${MISSING_DURATION%.*}) de áudio!"
elif (( $(echo "$TRUNCATION_PERCENTAGE < 100" | bc -l) )); then
  echo "  ⚠️  TRUNCAMENTO MODERADO!"
  echo "  ⚠️  Apenas $(printf "%.0f%%" ${TRUNCATION_PERCENTAGE%.*})% do áudio foi transcrito"
else
  echo "  ✅ Arquivo completo"
fi

echo ""
echo "📋 RECOMENDAÇÕES"
echo "  1. Verificar se há limite de duração na API Daredevil"
echo "  2. Verificar se há timeout durante processamento"
echo "  3. Verificar logs da API para erros de processamento"
echo "  4. Tentar reenviar arquivo e verificar se resultado é consistente"
echo "  5. Contatar dev da API com esses dados"
