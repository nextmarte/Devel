# Implementação de Isolamento Multi-Usuário

## 📋 Resumo

Implementação de isolamento de dados entre usuários simultâneos usando **Session ID** - uma solução rápida sem necessidade de banco de dados. Cada sessão/navegador recebe um identificador único que prefixar todos os jobs de transcrição.

## 🎯 Objetivo

Garantir que múltiplos usuários acessando o sistema simultaneamente (diferentes browsers, abas, ou dispositivos) não vejam os dados uns dos outros.

## 🔐 Arquitetura

### Session ID Format
```
session_[timestamp]_[random]
Exemplo: session_1730889234567_a1b2c3d4
```

### Job ID Format (Prefixado)
```
sessionId:task_id
Exemplo: session_1730889234567_a1b2c3d4:task_xyz123
```

## 📝 Mudanças Implementadas

### 1. **Hook de Session ID** (`src/hooks/use-session-id.ts`)
Novo arquivo que gerencia o identificador único da sessão:

```typescript
// Geração automática na primeira visita
useSessionId() → string | null

// Utilitários de prefixing
prefixJobId(sessionId, jobId) → string
unprefixJobId(prefixedId) → string
```

- Armazena em `localStorage` para persistência entre reloads
- Gera novo ID com timestamp + random para unicidade
- Exporta 3 funções: hook + 2 helpers

### 2. **Server Actions Atualizadas** (`src/app/actions.ts`)

#### startAsyncTranscription
```diff
- function(formData)
+ function(formData, sessionId)
  
  // Prefixar jobId com sessionId antes de armazenar
  const prefixedJobId = sessionId ? `${sessionId}:${realJobId}` : realJobId
```

#### getAsyncTranscriptionStatus
```diff
- function(jobId)
+ function(jobId, sessionId)
  
  // Validar que o job pertence ao sessionId
  if (sessionId && !prefixedJobId.startsWith(`${sessionId}:`)) {
    return error('Acesso negado')
  }
```

#### getRecentAsyncTranscriptions
```diff
- function(limit)
+ function(limit, sessionId)
  
  // Filtrar apenas jobs do usuário atual
  const filteredJobs = jobs.filter(job => 
    job.jobId.startsWith(`${sessionId}:`)
  )
```

#### cancelAsyncTranscription
```diff
- function(jobId)
+ function(jobId, sessionId)
  
  // Validar acesso antes de cancelar
  if (sessionId && !prefixedJobId.startsWith(`${sessionId}:`)) {
    return error('Acesso negado')
  }
```

### 3. **API Routes com Validação** 

#### GET /api/jobs (Lista)
```typescript
// Extrair sessionId do header X-Session-Id
const sessionId = getSessionIdFromRequest(request)

// Filtrar jobs apenas do usuário
const filteredJobs = jobs.filter(job => 
  job.jobId.startsWith(`${sessionId}:`)
)
```

#### GET /api/jobs/[jobId] (Detalhe)
```typescript
// Validar acesso
if (!validateJobAccess(jobId, sessionId)) {
  return 403 Forbidden
}
```

#### DELETE /api/jobs/[jobId]
```typescript
// Mesma validação de acesso que GET
```

### 4. **Hook de Polling Atualizado** (`src/hooks/use-transcription-polling.ts`)

```typescript
interface UseTranscriptionPollingProps {
  jobId: string | null
  sessionId?: string | null  // ← NOVO
  onComplete?: (job: AsyncJob) => void
  onError?: (error: string) => void
  pollInterval?: number
}

// Passar sessionId via header X-Session-Id
const headers: HeadersInit = {}
if (sessionId) {
  headers['X-Session-Id'] = sessionId
}

const response = await fetch(`/api/jobs/${jobId}`, { headers })
```

### 5. **Integração em page.tsx** (`src/app/page.tsx`)

```typescript
// 1. Importar hook
import { useSessionId } from "@/hooks/use-session-id"

// 2. Obter sessionId no componente
const sessionId = useSessionId()

// 3. Passar para polling hook
const { job } = useTranscriptionPolling({
  jobId: currentJobId,
  sessionId: sessionId,  // ← NOVO
  onComplete: ...,
  onError: ...,
})

// 4. Passar para server action
const result = await startAsyncTranscription(formData, sessionId)
```

## 🔄 Fluxo Completo

```
1. Usuário A acessa aplicação
   └─ useSessionId() gera: session_A_xyz
   └─ localStorage.sessionId = "session_A_xyz"

2. Usuário A faz upload
   └─ startAsyncTranscription(formData, "session_A_xyz")
   └─ realJobId = task_123 (da API)
   └─ prefixedJobId = "session_A_xyz:task_123"
   └─ Armazena com prefixo

3. Usuário A faz polling
   └─ useTranscriptionPolling({ jobId: "session_A_xyz:task_123", sessionId: "session_A_xyz" })
   └─ fetch("/api/jobs/session_A_xyz:task_123", { headers: { 'X-Session-Id': "session_A_xyz" } })
   └─ API valida: jobId começa com sessionId? ✅ Retorna dados

4. Usuário B acessa aplicação (nova aba/browser)
   └─ useSessionId() gera: session_B_abc (novo ID)
   └─ localStorage.sessionId = "session_B_abc"

5. Usuário B tenta acessar job de A via URL
   └─ fetch("/api/jobs/session_A_xyz:task_123", { headers: { 'X-Session-Id': "session_B_abc" } })
   └─ API valida: "session_A_xyz:task_123".startsWith("session_B_abc:")? ❌ 
   └─ Retorna 403 Forbidden

6. Usuário B lista seus jobs
   └─ getRecentAsyncTranscriptions(10, "session_B_abc")
   └─ Filtra: jobs.filter(j => j.jobId.startsWith("session_B_abc:"))
   └─ Retorna apenas jobs de B
```

## 🧪 Como Testar

### Teste 1: Isolamento Básico
```bash
# Terminal 1
bun run dev

# Browser 1 (Normal)
# Abrir http://localhost:3000
# Upload arquivo → anotar Job ID (ex: session_A_xyz:task_123)

# Browser 2 (Incognito/Nova Aba)
# Abrir http://localhost:3000
# Tentar acessar http://localhost:3000/jobs/session_A_xyz:task_123
# ❌ Deve retornar erro de acesso negado

# Browser 1
# Acessar http://localhost:3000/jobs/session_A_xyz:task_123
# ✅ Deve retornar dados da transcrição
```

### Teste 2: Isolamento em Lista
```bash
# Browser 1
# Fazer 2 uploads → anotar IDs

# Browser 2 (Incognito)
# Fazer 1 upload → anotar ID

# Browser 1
# Clicar "Histórico" → deve listar APENAS 2 jobs
# ✅ Job de Browser 2 NÃO deve aparecer

# Browser 2
# Clicar "Histórico" → deve listar APENAS 1 job
# ✅ Jobs de Browser 1 NÃO devem aparecer
```

### Teste 3: localStorage Persistência
```bash
# Browser 1
# Abrir DevTools → Application → localStorage
# Verificar: sessionId = "session_A_xyz"

# Recarregar página (F5)
# Verificar: sessionId = "session_A_xyz" (MESMO ID)
# ✅ Deve ser idêntico

# Limpar localStorage (DevTools)
# Recarregar página
# Verificar: sessionId = "session_B_new" (NOVO ID)
# ✅ Deve gerar novo ID
```

## 🛡️ Segurança

### O que Está Protegido
✅ Isolamento de dados entre sessões  
✅ Validação de acesso antes de retornar dados  
✅ Filtro de lista por usuário  
✅ Proteção contra manipulação de URL  

### O que NÃO Está Protegido
⚠️ Não há autenticação (qualquer um pode abrir)  
⚠️ SessionId armazenado em localStorage (cliente pode modificar)  
⚠️ SessionId visível no header X-Session-Id (não criptografado)  

**Recomendação**: Para produção com usuários reais, implementar:
- Autenticação (OAuth, JWT, etc)
- Sessão segura no servidor (cookies HttpOnly)
- HTTPS obrigatório
- Validação de token em todas as requisições

## 📊 Benefícios

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Isolamento** | ❌ Compartilhado globalmente | ✅ Por sessão |
| **Teste Multi-Usuário** | ❌ Dados vazavam | ✅ Isolado completamente |
| **Implementação** | - | ✅ Rápida (sem DB) |
| **Escalabilidade** | - | ✅ Suporta múltiplos users |
| **localStorage** | - | ✅ Persiste entre reloads |

## 📌 Próximos Passos

1. **Testar isolamento** em 2+ browsers/abas
2. **Validar performance** com muitos jobs em paralelo
3. **Implementar autenticação real** para produção
4. **Adicionar rate limiting** por sessionId
5. **Logging de auditoria** (quem acessou qual job)

## 🐛 Debugging

### Ver sessionId atual
```javascript
// DevTools Console
localStorage.getItem('sessionId')
```

### Ver headers sendo enviados
```javascript
// No hook use-transcription-polling.ts
console.log('Headers:', headers)
```

### Ver jobs armazenados
```javascript
// DevTools → Network → /api/jobs
// Ver response JSON
```

## 📚 Arquivos Modificados

```
✅ src/hooks/use-session-id.ts (NOVO)
✅ src/app/actions.ts (4 funções atualizadas)
✅ src/app/api/jobs/route.ts (validação de sessionId)
✅ src/app/api/jobs/[jobId]/route.ts (validação de acesso)
✅ src/hooks/use-transcription-polling.ts (passa sessionId via header)
✅ src/app/page.tsx (integração do hook e actions)
```

---

**Status**: ✅ Implementação Completa - Pronto para Testar
