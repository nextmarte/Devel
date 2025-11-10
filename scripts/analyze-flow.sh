#!/bin/bash

# Script para análise detalhada do fluxo assíncrono

echo "🔍 ANÁLISE DO FLUXO ASSÍNCRONO"
echo ""
echo "Arquivos-chave do fluxo:"
echo ""

echo "1. 📄 /api/jobs/[jobId]/route.ts - Sincroniza com API e retorna job com transcrição"
grep -n "SUCCESS\|rawTranscription\|updateJobStatus" /home/marcus/desenvolvimento/Devel/src/app/api/jobs/\[jobId\]/route.ts | head -20

echo ""
echo "2. 🎣 use-transcription-polling.ts - Hook que faz polling e chama onComplete"
grep -n "onComplete\|processingEvents\|updatedJob" /home/marcus/desenvolvimento/Devel/src/hooks/use-transcription-polling.ts | head -20

echo ""
echo "3. 🚀 page.tsx - onComplete que deveria chamar processTranscriptionFlows"
grep -n "onComplete\|processTranscriptionFlows" /home/marcus/desenvolvimento/Devel/src/app/page.tsx | head -20

echo ""
echo "4. ⚙️ actions.ts - processTranscriptionFlows que chama os flows"
grep -n "processTranscriptionFlows\|correctTranscriptionErrors\|identifySpeakers" /home/marcus/desenvolvimento/Devel/src/app/actions.ts | head -20

echo ""
echo "✅ Fluxo esperado:"
echo "  1. Upload → API cria job e retorna jobId"
echo "  2. Polling → GET /api/jobs/[jobId] que sincroniza com API"
echo "  3. API retorna status=SUCCESS com transcrição no result"
echo "  4. Polling chama onComplete(job) com job.result.rawTranscription"
echo "  5. onComplete chama processTranscriptionFlows(jobId, rawTranscription)"
echo "  6. Flows executam e retornam resultados processados"
echo "  7. Frontend exibe resultados"
echo ""
