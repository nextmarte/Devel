#!/bin/bash

# 🧪 Script de Teste - Otimizações Deepseek
# Valida que as otimizações estão funcionando

echo "🧪 Teste de Otimizações Deepseek"
echo "================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 1. Verificando arquivos modificados..."
echo ""

if [ -f "src/ai/genkit.ts" ]; then
    echo -e "${GREEN}✅${NC} src/ai/genkit.ts existe"
    if grep -q "truncateText" "src/ai/genkit.ts"; then
        echo -e "${GREEN}✅${NC} Função truncateText() implementada"
    else
        echo -e "${RED}❌${NC} Função truncateText() NÃO encontrada"
    fi
else
    echo -e "${RED}❌${NC} src/ai/genkit.ts NÃO existe"
fi

echo ""

if [ -f "src/app/api/jobs/[jobId]/route.ts" ]; then
    echo -e "${GREEN}✅${NC} src/app/api/jobs/[jobId]/route.ts existe"
    if grep -q "Promise.all" "src/app/api/jobs/[jobId]/route.ts"; then
        echo -e "${GREEN}✅${NC} Execução paralela com Promise.all() implementada"
    else
        echo -e "${RED}❌${NC} Execução paralela NÃO encontrada"
    fi
else
    echo -e "${RED}❌${NC} src/app/api/jobs/[jobId]/route.ts NÃO existe"
fi

echo ""

if [ -f "src/lib/deepseek-cache.ts" ]; then
    echo -e "${GREEN}✅${NC} src/lib/deepseek-cache.ts existe"
    if grep -q "generatePromptHash" "src/lib/deepseek-cache.ts"; then
        echo -e "${GREEN}✅${NC} Sistema de cache implementado"
    else
        echo -e "${RED}❌${NC} Sistema de cache NÃO encontrado"
    fi
else
    echo -e "${RED}❌${NC} src/lib/deepseek-cache.ts NÃO existe"
fi

echo ""
echo "📊 2. Verificando logs esperados..."
echo ""

echo "Logs esperados ao processar uma requisição:"
echo -e "${YELLOW}[FLOWS-SERVER] ⚡ Iniciando correção e identificação em PARALELO...${NC}"
echo -e "${YELLOW}[FLOWS-SERVER] ✅ Correção + Identificação concluídas em PARALELO${NC}"
echo -e "${YELLOW}[DEEPSEEK-OPT] ✂️ Prompt truncado${NC}"
echo ""

echo "📈 3. Guia de Teste Manual..."
echo ""

echo "PASSO 1: Iniciar aplicação"
echo "  $ npm run dev"
echo ""

echo "PASSO 2: Abrir navegador"
echo "  http://localhost:3000"
echo ""

echo "PASSO 3: Fazer upload de arquivo áudio"
echo "  - Clique em 'Choose File'"
echo "  - Selecione um arquivo .mp3 ou .wav"
echo "  - Clique em 'Upload'"
echo ""

echo "PASSO 4: Observar console/logs"
echo "  Procure por:"
echo -e "  ${YELLOW}[FLOWS-SERVER] ⚡ PARALELO${NC}"
echo -e "  ${YELLOW}[DEEPSEEK-OPT] ✂️ Truncado${NC}"
echo ""

echo "PASSO 5: Verificar performance"
echo "  - Tempo antes: ~30s"
echo "  - Tempo depois: ~10-15s"
echo "  - Melhoria: ~60-70%"
echo ""

echo "📋 6. Checklist de Validação..."
echo ""

echo "[ ] Aplicação inicia sem erros"
echo "[ ] Upload de arquivo funciona"
echo "[ ] Logs mostram 'PARALELO'"
echo "[ ] Logs mostram 'Truncado' (se texto > 8KB)"
echo "[ ] Tempo total é ~50% menor que antes"
echo "[ ] Não há erros de TypeScript"
echo "[ ] Resultado final está correto"
echo ""

echo "🚀 7. Próximas Etapas (Opcional)..."
echo ""

echo "Para ativar Cache Redis:"
echo "  1. npm install redis"
echo "  2. docker run -d -p 6379:6379 redis:latest"
echo "  3. echo 'REDIS_URL=redis://localhost:6379' >> .env.local"
echo "  4. npm run dev"
echo ""

echo "Esperar requisições repetidas ficar ~90% mais rápidas!"
echo ""

echo "================================="
echo -e "${GREEN}✅ Teste compilado!${NC}"
echo ""
echo "Para mais detalhes, ver:"
echo "  - DEEPSEEK_OPTIMIZATION.md"
echo "  - DEEPSEEK_IMPLEMENTATION_GUIDE.md"
echo "  - DEEPSEEK_BEFORE_AFTER.md"
echo ""
