# Plataforma de Transcrição Assíncrona com Isolamento Multi-Usuário

Sistema full-stack de transcrição de áudio com suporte a modo síncrono e assíncrono, com isolamento automático de usuários via Session ID.

## 🚀 Características

### Transcrição
- ✅ **Modo Síncrono**: Transcrição bloqueante com resultado imediato
- ✅ **Modo Assíncrono**: Background processing com polling automático
- ✅ **Polling Automático**: 2 segundos de intervalo, auto-stop na conclusão
- ✅ **Webhook Removido**: Solução baseada em polling para compatibilidade local

### Qualidade do Texto
- ✅ **Correção de Erros**: Correção gramatical automática via IA
- ✅ **Identificação de Locutores**: Marca automaticamente quem está falando
- ✅ **Geração de Resumo**: Cria ata de reunião automática

### Segurança & Multi-Usuário
- ✅ **Session ID**: Isolamento automático por navegador/aba
- ✅ **Prefixing de Jobs**: Todos os jobs prefixados com "sessionId:taskId"
- ✅ **Validação em API**: Header X-Session-Id validado em cada requisição
- ✅ **403 Forbidden**: Acesso negado a jobs de outros usuários
- ✅ **Filtragem de Histórico**: Cada usuário vê apenas seus próprios jobs

### UI/UX
- ✅ **Toggle Modo Assíncrono**: Switch fácil entre sync/async
- ✅ **Status em Tempo Real**: Polling automático com atualizações visuais
- ✅ **Botão Cancelar**: Cancelar transcrição em processamento
- ✅ **Loading States**: Indicadores visuais de progresso
- ✅ **Toast Notifications**: Feedback de ações (sucesso/erro)

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTE (Next.js)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  useSessionId() ─┐                                      │
│                  ├─→ sessionId = "session_123_abc"     │
│                  │   (localStorage)                    │
│                  │                                      │
│  page.tsx ◄─────┘                                       │
│    ├─ startAsyncTranscription(formData, sessionId)    │
│    ├─ useTranscriptionPolling({ jobId, sessionId })  │
│    └─ cancelAsyncTranscription(jobId, sessionId)     │
│                                                         │
└────────────────┬──────────────────────────────────────┘
                 │ Header: X-Session-Id
                 │
┌────────────────▼──────────────────────────────────────┐
│              SERVIDOR (Next.js API Routes)             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  GET /api/jobs/[jobId]                               │
│    └─ Validar X-Session-Id                           │
│       ├─ if (!jobId.startsWith(sessionId:))          │
│       └─ return 403 Forbidden                        │
│                                                         │
│  asyncJobStorage (Map + localStorage)                 │
│    └─ Armazena jobs com prefix: "sessionId:taskId"  │
│                                                         │
└────────────────┬──────────────────────────────────────┘
                 │ task_id, webhook_url=''
                 │
┌────────────────▼──────────────────────────────────────┐
│          DAREDEVIL API (Transcrição)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  POST /api/transcribe/async                           │
│    └─ Retorna: task_id (usado como jobId)           │
│                                                         │
│  GET /api/transcribe/async/status/{taskId}          │
│    └─ Estado: PENDING, STARTED, SUCCESS, FAILURE   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 📁 Estrutura de Arquivos

```
src/
├── app/
│   ├── page.tsx                    # Main UI component
│   ├── actions.ts                  # 4 Server Actions
│   ├── globals.css                 # Styles
│   ├── layout.tsx                  # Root layout
│   └── api/
│       ├── jobs/
│       │   ├── route.ts            # GET list jobs
│       │   └── [jobId]/
│       │       └── route.ts        # GET/DELETE individual job
│       └── webhook/
│           └── transcription/
│               └── route.ts        # (deprecated - polling only)
│
├── hooks/
│   ├── use-session-id.ts          # ⭐ NEW: Session ID management
│   ├── use-transcription-polling.ts # Polling with sessionId support
│   ├── use-toast.ts               # Toast notifications
│   └── use-mobile.tsx             # Mobile detection
│
├── lib/
│   ├── async-job-storage.ts       # In-memory job store
│   ├── transcription-storage.ts   # localStorage persistence
│   ├── transcription-types.ts     # TypeScript types
│   └── utils.ts                   # Utilities
│
├── ai/
│   ├── genkit.ts                  # Genkit AI config
│   └── flows/
│       ├── correct-transcription-errors.ts
│       ├── identify-speakers-in-text.ts
│       └── summarize-text.ts
│
├── components/
│   ├── action-bar.tsx
│   ├── app-layout.tsx
│   ├── processing-progress.tsx    # Visual progress indicator
│   └── ... (50+ UI components)
│
└── docs/
    ├── async-transcription-guide.md
    ├── POLLING_ARCHITECTURE.md
    ├── MULTI_USER_ISOLATION.md
    └── IMPLEMENTATION_SUMMARY.md
```

## 🔑 Conceitos-Chave

### Session ID
```typescript
// Gerado automaticamente na primeira visitado
sessionId = "session_" + Date.now() + "_" + randomString()
// Exemplo: "session_1730862654789_9k2xb3m"

// Armazenado em localStorage com chave 'sessionId'
// Persiste entre refresh de página
```

### Job ID Prefixado
```typescript
// Daredevil API retorna: task_xyz123
// Prefixado com sessionId: "session_abc_123:task_xyz123"

// Formato: "{sessionId}:{actualTaskId}"
// Garante isolamento automático
```

### Validação de Acesso
```typescript
// Cada requisição deve incluir header:
Header: X-Session-Id: session_abc_123

// Server valida:
if (!jobId.startsWith(`${sessionId}:`)) {
  return 403 Forbidden
}
```

## 🚦 Modos de Operação

### Modo Síncrono (Bloqueante)
```
Cliente                                 Servidor
  │                                        │
  ├─ Upload arquivo                       │
  │  └─────────────────────────────────────►
  │                                   Processar (5-30s)
  │◄─────────────────────────────────────
  │  Resultado completo
  │
```

### Modo Assíncrono (Não-Bloqueante)
```
Cliente                        Servidor                  Daredevil API
  │                               │                            │
  ├─ Upload arquivo               │                            │
  │  ──────────────────────────►  │                            │
  │◄─────────────────────────────  │                            │
  │  jobId imediatamente           │                            │
  │                                ├─ Enviar arquivo          │
  │                                │  ──────────────────────►  │
  │                                │◄─────────────────────────  │
  │                                │  task_id                  │
  │                                │                            │
  ├─ Poll /api/jobs/{jobId} (a cada 2s)                    │
  │  ───────────────────────────►  ├─ Check status da API     │
  │                                │  ───────────────────────►  │
  │◄─────────────────────────────  │◄──────────────────────────  │
  │  {status: PENDING}             │                            │
  │                                │                            │
  │  (aguarda)                     │ (processando no backend)   │
  │                                │                            │
  ├─ Poll /api/jobs/{jobId}       │                            │
  │  ───────────────────────────►  ├─ Check status da API     │
  │                                │  ───────────────────────►  │
  │◄─────────────────────────────  │◄──────────────────────────  │
  │  {status: SUCCESS, result}     │                            │
  │  (polling para)                │                            │
  │                                │                            │
```

## 📊 Fluxo de Dados - Exemplo Prático

### Upload e Processamento Assíncrono

1. **Cliente faz upload**
```javascript
const sessionId = "session_1234_abc"; // localStorage
const formData = new FormData();
formData.append('file', audioFile);

const result = await startAsyncTranscription(formData, sessionId);
// Retorna: { jobId: "session_1234_abc:task_xyz123", error: null }
```

2. **Server armazena job**
```typescript
const prefixedJobId = "session_1234_abc:task_xyz123";
asyncJobStorage.createJob(prefixedJobId, 'audio.mp3', 2048000);
asyncJobStorage.updateJobStatus(prefixedJobId, 'STARTED');
```

3. **Cliente começa polling**
```javascript
useTranscriptionPolling({
  jobId: "session_1234_abc:task_xyz123",
  sessionId: "session_1234_abc",  // Passa via header
  pollInterval: 2000
});
```

4. **Server valida acesso**
```typescript
// GET /api/jobs/session_1234_abc:task_xyz123
const sessionId = request.headers.get('X-Session-Id'); // "session_1234_abc"

if (!jobId.startsWith(`${sessionId}:`)) {
  return 403; // ✗ Acesso negado
}

return job; // ✓ Acesso permitido
```

5. **Polling detecta conclusão**
```javascript
// Status: SUCCESS
// Retorna resultado completo
// Para o polling automaticamente
// Chama onComplete callback
```

## 🔒 Segurança Multi-Usuário

### Cenários Testados

#### ✅ Scenario 1: Usuário A acessa seu próprio job
```
Browser A sessionId: "session_A"
Job ID: "session_A:task_123"
Header X-Session-Id: "session_A"
✓ Validação: "session_A:task_123".startsWith("session_A:") = true
✓ Resultado: 200 OK - dados retornados
```

#### ❌ Scenario 2: Usuário B tenta acessar job de A
```
Browser B sessionId: "session_B"
Job ID: "session_A:task_123" (de outro usuário)
Header X-Session-Id: "session_B"
✗ Validação: "session_A:task_123".startsWith("session_B:") = false
✗ Resultado: 403 Forbidden - acesso negado
```

#### ✅ Scenario 3: Listagem filtrada por usuário
```
Todos os jobs: [
  "session_A:task_1",
  "session_A:task_2",
  "session_B:task_3",
  "session_B:task_4"
]

Browser A (sessionId: "session_A"):
  Recebe: ["session_A:task_1", "session_A:task_2"]

Browser B (sessionId: "session_B"):
  Recebe: ["session_B:task_3", "session_B:task_4"]
```

## 🧪 Como Testar

### Teste 1: Isolamento Básico (Recomendado)
1. Abra Firefox em http://localhost:3000
2. Faça upload de um arquivo de áudio
3. Note o Job ID exibido
4. Abra Chrome em http://localhost:3000 (nova sesão)
5. Verifique que o Job ID anterior NÃO aparece no histórico
6. Verifique no Chrome DevTools > Storage > LocalStorage
   - sessionId é diferente em cada browser

### Teste 2: Bloqueio de Acesso Cruzado (Terminal)
```bash
# Obter Job ID de um upload (Firefox)
# Exemplo: session_1234_abc:task_xyz

# Terminal: Tentar acessar com sessionId diferente
curl -H "X-Session-Id: session_9999_xxx" \
  http://localhost:3000/api/jobs/session_1234_abc:task_xyz

# Resultado esperado: 403 Forbidden
```

### Teste 3: Botão Cancelar
1. Faça upload de um arquivo grande
2. Clique botão "Cancelar" durante processamento
3. Verifique que:
   - Status muda para CANCELLED
   - Polling para
   - UI limpa o state

### Teste 4: Persistência de Histórico
1. Faça 3 uploads diferentes
2. Refresh de página (F5)
3. Histórico continua visível
4. SessionId permanece igual (localStorage)
5. Feche a aba
6. Abra nova aba
7. SessionId diferente (nova sessão)

## 🛠️ Variáveis de Ambiente

```bash
# .env.local
NEXT_PUBLIC_DAREDEVIL_API_URL=https://api.daredevil.com

# Usado apenas para desenvolvimento local
# Para produção, implementar autenticação real
```

## 📝 Documentação Detalhada

### Guias Principais
- [`docs/guides/POLLING_ARCHITECTURE.md`](./docs/guides/POLLING_ARCHITECTURE.md) - Arquitetura de polling
- [`docs/guides/MULTI_USER_ISOLATION.md`](./docs/guides/MULTI_USER_ISOLATION.md) - Detalhes de isolamento
- [`docs/guides/ASYNC_TRANSCRIPTION_QUICK_START.md`](./docs/guides/ASYNC_TRANSCRIPTION_QUICK_START.md) - Quick start
- [`docs/guides/MULTI_USER_SESSION_IMPLEMENTATION.md`](./docs/guides/MULTI_USER_SESSION_IMPLEMENTATION.md) - ⭐ Implementação Session ID
- [`docs/async-transcription-guide.md`](./docs/async-transcription-guide.md) - Guia de transcrição assíncrona
- [`docs/blueprint.md`](./docs/blueprint.md) - Blueprint da arquitetura

### Documentação Adicional
- [`FEATURES.md`](./FEATURES.md) - Lista completa de funcionalidades
- [`docs/archive/`](./docs/archive/) - Documentação histórica, investigações e relatórios de bugs

### Scripts de Teste
- [`scripts/`](./scripts/) - Scripts para testar funcionalidades específicas (isolamento multi-usuário, polling, upload, etc.)

## 🚀 Deploy

### Vercel
```bash
# Push para GitHub
git push origin main

# Vercel detecta automaticamente Next.js
# Variáveis de ambiente configuradas via dashboard
```

### Docker
```bash
docker build -t transcription-app .
docker run -p 3000:3000 -e NEXT_PUBLIC_DAREDEVIL_API_URL=... transcription-app
```

## ⚡ Performance

| Operação | Tempo |
|---------|-------|
| useSessionId (read localStorage) | < 1ms |
| Prefixing jobId | < 1ms |
| Validação de acesso | < 1ms |
| Polling interval | 2000ms (configurável) |
| Filtragem de jobs (100 items) | < 5ms |

## 🔄 Limites Conhecidos

- ⚠️ sessionId baseado em localStorage (pode ser manipulado)
- ⚠️ Sem autenticação real (solução local/desenvolvimento)
- ⚠️ Jobs persistem em memória (perdidos ao reiniciar servidor)
- ℹ️ Para produção, implementar JWT + Database

## 📈 Roadmap

- [ ] Integração com banco de dados (PostgreSQL)
- [ ] Autenticação real (JWT/OAuth)
- [ ] Rate limiting por usuário
- [ ] Auditoria de ações
- [ ] Testes E2E
- [ ] CI/CD com GitHub Actions
- [ ] Métricas e analytics
- [ ] Dashboard de admin

## 📞 Suporte

Para dúvidas ou issues:
1. Verifique [`docs/archive/IMPLEMENTATION_SUMMARY.md`](./docs/archive/IMPLEMENTATION_SUMMARY.md) para changelog
2. Consulte [`docs/guides/MULTI_USER_SESSION_IMPLEMENTATION.md`](./docs/guides/MULTI_USER_SESSION_IMPLEMENTATION.md) para detalhes técnicos
3. Entre em contato com o backend se precisar adicionar campos na API

## 📂 Organização do Projeto

```
.
├── src/                    # Código fonte da aplicação
├── docs/
│   ├── guides/            # Guias principais e documentação técnica
│   ├── archive/           # Documentação histórica e investigações
│   └── *.md              # Guias de uso e otimização
├── scripts/               # Scripts de teste e debug
├── README.md             # Este arquivo
├── FEATURES.md           # Lista de funcionalidades
└── package.json          # Dependências e scripts npm
```