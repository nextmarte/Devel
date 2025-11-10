#!/bin/bash

echo "🧪 Testando sistema de rastreamento de Deepseek"
echo "=================================================="
echo ""
echo "1. Verificando arquivos criados/modificados:"
echo ""

# Verificar se o arquivo de tracker foi criado
if [ -f "src/lib/processing-tracker.ts" ]; then
    echo "✅ src/lib/processing-tracker.ts exists"
else
    echo "❌ src/lib/processing-tracker.ts missing"
fi

# Verificar se o componente de detalhes foi criado
if [ -f "src/components/processing-progress-detail.tsx" ]; then
    echo "✅ src/components/processing-progress-detail.tsx exists"
else
    echo "❌ src/components/processing-progress-detail.tsx missing"
fi

# Verificar imports nos arquivos de flows
echo ""
echo "2. Verificando instrumentação dos flows:"
echo ""

if grep -q "globalProcessingTracker" "src/ai/flows/correct-transcription-errors.ts"; then
    echo "✅ correct-transcription-errors.ts instrumentado"
else
    echo "❌ correct-transcription-errors.ts não instrumentado"
fi

if grep -q "globalProcessingTracker" "src/ai/flows/identify-speakers-in-text.ts"; then
    echo "✅ identify-speakers-in-text.ts instrumentado"
else
    echo "❌ identify-speakers-in-text.ts não instrumentado"
fi

if grep -q "globalProcessingTracker" "src/ai/flows/summarize-text.ts"; then
    echo "✅ summarize-text.ts instrumentado"
else
    echo "❌ summarize-text.ts não instrumentado"
fi

# Verificar API endpoint
echo ""
echo "3. Verificando API endpoint:"
echo ""

if grep -q "globalProcessingTracker" "src/app/api/jobs/\[jobId\]/route.ts"; then
    echo "✅ API endpoint retorna processingEvents"
else
    echo "❌ API endpoint não está retornando events"
fi

# Verificar tipo ProcessingEvent
echo ""
echo "4. Verificando tipos:"
echo ""

if grep -q "ProcessingEvent" "src/lib/transcription-types.ts"; then
    echo "✅ ProcessingEvent type definido"
else
    echo "❌ ProcessingEvent type não encontrado"
fi

echo ""
echo "5. Verificando hook de polling:"
echo ""

if grep -q "processingEvents" "src/hooks/use-transcription-polling.ts"; then
    echo "✅ Polling hook exibe events"
else
    echo "❌ Polling hook não exibe events"
fi

echo ""
echo "6. Verificando integração no page.tsx:"
echo ""

if grep -q "ProcessingProgressDetail" "src/app/page.tsx"; then
    echo "✅ ProcessingProgressDetail importado e usado"
else
    echo "❌ ProcessingProgressDetail não integrado"
fi

echo ""
echo "=================================================="
echo "✅ Testes de arquivos concluídos!"
echo ""
echo "Próximos passos:"
echo "1. Rodar 'npm run dev' para iniciar o servidor"
echo "2. Abrir DevTools (F12) no browser"
echo "3. Upload de um arquivo de áudio em modo assíncrono"
echo "4. Observar logs no console:"
echo "   - [DEEPSEEK] logs no server"
echo "   - [POLLING] 📊 Eventos de processamento no client"
echo ""
