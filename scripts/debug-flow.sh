#!/bin/bash

echo "🔍 Analisando fluxo de criação de jobs..."
echo ""

# Procurar por padrões nos arquivos
echo "1. Verificando startAsyncTranscription:"
grep -n "asyncJobStorage.createJob" src/app/actions.ts | head -3

echo ""
echo "2. Verificando getAsyncTranscriptionStatus:"
grep -n "asyncJobStorage.getJob" src/app/actions.ts | head -3

echo ""
echo "3. Verificando API endpoint:"
grep -n "asyncJobStorage.getJob\|processingEvents" "src/app/api/jobs/[jobId]/route.ts" | head -5

echo ""
echo "4. Verificando se globalProcessingTracker está sendo importado:"
grep -n "import.*globalProcessingTracker" src/ai/flows/*.ts

echo ""
echo "5. Verificando se processingEvents é passado para component:"
grep -n "processingEvents" src/app/page.tsx | head -3

echo ""
echo "⚠️  Problema Potencial:"
echo "   - globalProcessingTracker é singleton em processing-tracker.ts"
echo "   - Cada Server Action pode estar em um contexto diferente"
echo "   - Os flows nunca recebem jobId então não registram eventos"
echo ""
echo "✅ Solução: Verificar se startAsyncTranscription passa jobId aos flows"
