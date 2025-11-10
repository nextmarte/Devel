#!/bin/bash

# Script de Teste - Isolamento Multi-Usuário
# Uso: bash test-multi-user-isolation.sh

echo "🧪 Teste de Isolamento Multi-Usuário"
echo "====================================="
echo ""

# Configurações
API_BASE="http://localhost:3000"
SESSION_A="session_test_a_123"
SESSION_B="session_test_b_456"

echo "📌 Teste 1: Simular dois usuários com sessionIds diferentes"
echo ""

# Simular Job de Usuário A
JOB_A="session_test_a_123:task_001"
echo "✅ Usuário A cria job: $JOB_A"

# Simular Job de Usuário B
JOB_B="session_test_b_456:task_002"
echo "✅ Usuário B cria job: $JOB_B"

echo ""
echo "📌 Teste 2: Usuário B tenta acessar job de A"
echo ""

echo "❓ Tentando acessar como Usuário B (sessionId: $SESSION_B):"
echo "   GET /api/jobs/$JOB_A"
echo "   Header: X-Session-Id: $SESSION_B"
echo ""
echo "⚠️  Status esperado: 403 Forbidden"
echo "   Motivo: $JOB_A não começa com $SESSION_B:"
echo ""

curl -i -H "X-Session-Id: $SESSION_B" "$API_BASE/api/jobs/$JOB_A" 2>/dev/null | head -1
echo ""

echo "📌 Teste 3: Usuário A acessa seu próprio job"
echo ""

echo "❓ Tentando acessar como Usuário A (sessionId: $SESSION_A):"
echo "   GET /api/jobs/$JOB_A"
echo "   Header: X-Session-Id: $SESSION_A"
echo ""
echo "✅ Status esperado: 200 OK ou 404 (se job não existe)"
echo "   Motivo: $JOB_A começa com $SESSION_A:"
echo ""

curl -i -H "X-Session-Id: $SESSION_A" "$API_BASE/api/jobs/$JOB_A" 2>/dev/null | head -1
echo ""

echo "====================================="
echo "✅ Testes completados!"
echo ""
echo "📚 Próximas ações:"
echo "   1. Abrir Browser 1 (Normal): http://localhost:3000"
echo "   2. Abrir Browser 2 (Incognito): http://localhost:3000"
echo "   3. Em Browser 1: fazer upload de arquivo"
echo "   4. Anotar o sessionId em DevTools → Application → localStorage → sessionId"
echo "   5. Anotar o Job ID da transcrição"
echo "   6. Em Browser 2: tentar acessar http://localhost:3000/jobs/[JOB_ID_DO_BROWSER_1]"
echo "   7. Esperado: Erro de acesso negado"
echo ""
