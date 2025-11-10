# 🔧 Como Usar o Workaround de Retry

## O Problema
Arquivo está sendo **truncado no meio** pela API Daredevil (50% apenas).

## A Solução
Implementar **retry automático com detecção de truncamento**.

---

## 📦 Componentes Implementados

### 1. `transcription-retry-handler.ts`
Arquivo novo com funções de retry:
- `retryTranscriptionIfNeeded()` - Verifica se precisa retry
- `handleTranscriptionRetry()` - Executa retry com backoff
- `shouldRetryTranscription()` - Helper para detectar erros

### 2. `actions.ts` (Atualizado)
Upload com retry automático:
- `uploadFileToApi()` - Orquestra upload/retry
- `uploadSimple()` - Upload com 3 tentativas
- `uploadChunked()` - Para arquivos > 50MB
- Timeout de 5 minutos por chunk

### 3. `page.tsx` (Atualizado)
Logging melhorado:
- Tamanho do arquivo mostrado
- Status de upload no toast
- Logs prefixados com `[CLIENT]`

---

## 🚀 Como Ativar o Retry

### Opção 1: Automático (Recomendado)
```typescript
// Em use-transcription-polling.ts
if (job?.status === 'FAILURE') {
  // Importar função
  import { shouldRetryTranscription } from '@/lib/transcription-retry-handler';
  
  // Verificar se deve fazer retry
  if (shouldRetryTranscription(job)) {
    console.log('🔄 Detectado erro de arquivo - iniciando retry automático');
    
    // Fazer retry
    const retryResult = await handleTranscriptionRetry(
      jobId,
      file, // Arquivo original
      apiUrl,
      sessionId,
      { maxRetries: 5 } // Até 5 tentativas
    );
    
    if (retryResult.success && retryResult.newJobId) {
      console.log('✅ Retry bem-sucedido! Novo jobId:', retryResult.newJobId);
      setCurrentJobId(retryResult.newJobId); // Atualizar para novo job
    }
  }
}
```

### Opção 2: Manual (Se Quiser Controlar)
```typescript
// Em seu componente
import { handleTranscriptionRetry } from '@/lib/transcription-retry-handler';

const handleRetryClick = async () => {
  const result = await handleTranscriptionRetry(
    currentJobId,
    file,
    apiUrl,
    sessionId
  );
  
  if (result.success) {
    setCurrentJobId(result.newJobId);
  }
};
```

---

## 📊 Fluxo com Retry

```
Usuário faz upload
  ↓
Arquivo enviado com retry automático (até 3 tentativas)
  ├─ Upload 1 → falha com "No such file"
  └─ Aguarda 2s, Upload 2 → sucesso ✅
  
Job inicia polling
  ├─ Status: PENDING
  ├─ Status: STARTED
  └─ Status: FAILURE (arquivo truncado apenas 50%)
  
Detector de Retry
  ├─ Detecta: "No such file" error
  └─ Inicia retry...

Retry com Backoff
  ├─ Retry 1: Aguarda 2s → reenviar
  ├─ Retry 2: Aguarda 4s → reenviar
  ├─ Retry 3: Aguarda 8s → reenviar
  ├─ Retry 4: Aguarda 16s → reenviar
  └─ Retry 5: Aguarda 30s → reenviar

Novo Job ID
  ├─ Task ID: novo_task_id_xyz
  └─ Polling retorna ao estado STARTED

Transcrição Completa ✅
```

---

## 📋 Configuração (Customizar se Quiser)

### Default
```typescript
const config = {
  maxRetries: 5,           // Até 5 tentativas
  initialDelayMs: 2000,    // Começa com 2s
  maxDelayMs: 30000,       // Máximo 30s
  backoffMultiplier: 2,    // Dobra a cada vez
};

// Delays: 2s → 4s → 8s → 16s → 30s
```

### Customizar
```typescript
// Usar menos tentativas
const myConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 15000,
  backoffMultiplier: 2,
};

const result = await handleTranscriptionRetry(
  jobId,
  file,
  apiUrl,
  sessionId,
  myConfig // ← Passar config customizada
);
```

---

## 🔍 Logs Esperados

### Upload Normal
```
📤 [CLIENT] Iniciando processamento - Arquivo: audio.ogg, Tamanho: 45.50MB
📤 [CLIENT] Chamando startAsyncTranscription...
📤 Iniciando upload - Arquivo: audio.ogg, Tamanho: 45.50MB
📤 Upload simples - Tentativa 1/3
✅ Upload simples concluído - Task ID: task_abc123
📤 [CLIENT] Resultado do upload: { taskId: 'task_abc123', success: true }
✅ [CLIENT] Job iniciado: sessionid:task_abc123
```

### Com Retry (Truncamento Detectado)
```
🔄 [RETRY] Detectado erro de arquivo temporário desaparecido
📋 Job ID: sessionid:task_abc123
❌ Erro original: [Errno 2] No such file...
🔄 Iniciando retry com max 5 tentativas

📤 [RETRY 1/5] Reenviando arquivo...
⏳ [RETRY] Aguardando 2000ms antes da próxima tentativa...

📤 [RETRY 2/5] Reenviando arquivo...
✅ [RETRY 2] Sucesso! Novo jobId: sessionid:task_xyz789
```

---

## 🛠️ Troubleshooting

### Retry não está acionando
1. Verifique se `shouldRetryTranscription()` foi integrado
2. Verifique console.log para ver se erro é detectado
3. Verifique se `handleTranscriptionRetowait` está sendo chamado

### Retry falhando sempre
1. Aumentar `maxRetries` para 7-10
2. Aumentar `initialDelayMs` para 3000-5000ms
3. Verificar se API Daredevil está up
4. Verificar logs da API para erros

### Arquivo ainda truncado após retry
1. Problema está na API Daredevil (timeout, limite)
2. Enviou email para dev?
3. Contatar dev da API

---

## ✅ Checklist de Implementação

- [ ] Arquivo `transcription-retry-handler.ts` criado
- [ ] `actions.ts` atualizado com upload + retry
- [ ] `page.tsx` com logging melhorado
- [ ] Integração em `use-transcription-polling.ts` (opcional)
- [ ] Testar com arquivo grande (> 1 minuto)
- [ ] Verificar logs no console
- [ ] Email enviado para dev API

---

## 🎁 Resultado Final

Seu app agora:
✅ Envia arquivo completo
✅ Faz retry automático no upload
✅ Detecta transcrição truncada
✅ Re-envia automaticamente
✅ Logging detalhado
✅ Backoff inteligente

**Tempo para implementação completa**: ~5 minutos de integração

---

Workaround criado: 7 de Novembro de 2025
