# Transcrição Assíncrona - Guia de Implementação

## 📋 Resumo das Melhorias

O frontend foi totalmente atualizado para aproveitar ao máximo as melhorias do backend, com foco especial na **transcrição assíncrona**. As seguintes funcionalidades foram implementadas:

### ✨ Novas Funcionalidades

1. **Transcrição Assíncrona (Padrão)**
   - Envio de arquivos em background sem bloquear a interface
   - Ideal para arquivos grandes (até 500MB)
   - Polling automático de status
   - Suporte a webhooks para notificação

2. **Gerenciador de Tarefas Assíncronas**
   - Monitor em tempo real de tarefas ativas
   - Histórico de tarefas concluídas, com erro ou canceladas
   - Limpeza automática de tarefas antigas
   - Interface flutuante conversível

3. **Monitoramento de Progresso**
   - Exibição visual do progresso (0-100%)
   - Status em tempo real (PENDING, STARTED, SUCCESS, FAILURE, RETRY, CANCELLED)
   - Informações detalhadas sobre cada tarefa

4. **Otimizações**
   - Processamento assíncrono com retry automático
   - Integração com fluxos de IA (correção, identificação de locutores, resumo)
   - Cache de transcrições
   - Armazenamento local de estado das tarefas

## 🏗️ Estrutura de Arquivos

### Novos Arquivos Criados

```
src/
├── lib/
│   ├── transcription-types.ts (atualizado)
│   └── async-transcription-storage.ts (novo)
├── app/
│   └── actions.ts (atualizado)
├── components/
│   ├── async-task-monitor.tsx (novo)
│   └── async-task-manager.tsx (novo)
```

### Arquivos Modificados

- `src/lib/transcription-types.ts` - Adicionados tipos para tarefas assíncronas
- `src/app/actions.ts` - Adicionadas funções server para API assíncrona
- `src/app/page.tsx` - Integração da transcrição assíncrona com UI

## 🚀 Como Usar

### 1. Transcrição Assíncrona (Recomendado)

**Por padrão, a transcrição assíncrona está ativada.** Funciona assim:

```
1. Usuário seleciona arquivo ou grava áudio
2. Frontend envia para API assíncrona (/api/transcribe/async)
3. API retorna task_id imediatamente
4. Frontend começa a verificar status a cada 2 segundos
5. Quando completa, processa com IA (correção, identificação de locutores)
6. Resultado é salvo no localStorage
```

**Vantagens:**
- ✅ Não bloqueia a interface
- ✅ Suporta arquivos grandes
- ✅ Melhor experiência do usuário
- ✅ Retry automático em caso de erro

### 2. Transcrição Síncrona (Legacy)

Para usar o modo síncrono anterior, desative a opção "Transcrição assíncrona" na UI.

```
1. Arquivo é enviado via /api/transcribe
2. API processa e retorna resultado
3. Interface bloqueia até conclusão
```

**Desvantagens:**
- ❌ Bloqueia a interface
- ❌ Melhor apenas para arquivos pequenos

## 📊 Tipos de Dados

### AsyncTranscriptionTask

```typescript
interface AsyncTranscriptionTask {
  id: string;                    // ID local
  taskId: string;               // ID retornado pela API
  localId: string;              // ID para gerenciamento
  fileName: string;             // Nome do arquivo
  fileSize: number;             // Tamanho em bytes
  status: AsyncTaskStatus;      // PENDING, STARTED, SUCCESS, FAILURE, RETRY, CANCELLED
  progress: number;             // 0-100
  createdAt: number;            // Timestamp
  updatedAt: number;            // Timestamp
  result?: AsyncTranscriptionResponse;
  error?: string;
  retries: number;              // Tentativas atuais
  maxRetries: number;           // Máximo de tentativas
  language: string;             // 'pt', 'en', etc
  generateSummary: boolean;     // Gerar ata?
  webhookUrl?: string;          // URL para notificação
  correctedTranscription?: string;
  identifiedTranscription?: string;
  summary?: string;
}
```

### AsyncTaskStatus

```typescript
type AsyncTaskStatus = 
  | 'PENDING'      // Aguardando processamento
  | 'STARTED'      // Processamento iniciado
  | 'SUCCESS'      // Concluído com sucesso
  | 'FAILURE'      // Erro
  | 'RETRY'        // Tentando novamente
  | 'CANCELLED';   // Cancelado pelo usuário
```

## 🔄 Fluxo de Processamento

```
┌─────────────────────────────────────────────────────────────┐
│                    Usuário Envia Arquivo                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ useAsync === true?   │
              └──────────┬───────┬───┘
                    SIM  │       │  NÃO
                         ▼       ▼
              ┌──────────────┐  ┌─────────────────┐
              │   ASYNC      │  │   SYNC (Legacy) │
              │   MODE       │  │   MODE          │
              └───────┬──────┘  └────────┬────────┘
                      │                 │
                      ▼                 ▼
          ┌─────────────────────────────────────┐
          │  START: /api/transcribe/async       │
          └──────────────────┬──────────────────┘
                             │
                             ▼
              ┌──────────────────────────────────┐
              │  POLLING: /api/transcribe/async  │
              │  /status/{task_id} (a cada 2s)   │
              └──────────┬───────────────────────┘
                         │
                    ┌────┴────┬─────────┐
                    ▼         ▼         ▼
              PENDING    STARTED    SUCCESS
                    │         │         │
                    └─────────┘         ▼
                         RETRY    ┌──────────────────────┐
                                  │ PROCESS WITH AI:     │
                                  │ 1. Correct errors    │
                                  │ 2. Identify speakers │
                                  │ 3. Generate summary  │
                                  └──────────┬───────────┘
                                             │
                                             ▼
                                   ┌──────────────────────┐
                                   │  SAVE TO STORAGE     │
                                   │  SHOW RESULTS        │
                                   └──────────────────────┘
```

## 🎯 API Assíncrona do Backend

### Iniciar Transcrição

```bash
POST /api/transcribe/async
Content-Type: multipart/form-data

file: <arquivo>
language: pt (opcional)
webhook_url: <url> (opcional)
```

**Resposta:**
```json
{
  "task_id": "abc123",
  "status_url": "/api/transcribe/async/status/abc123"
}
```

### Verificar Status

```bash
GET /api/transcribe/async/status/{task_id}
```

**Resposta:**
```json
{
  "state": "STARTED",
  "progress": {
    "percentage": 45
  },
  "result": null
}
```

Quando concluído:
```json
{
  "state": "SUCCESS",
  "result": {
    "success": true,
    "transcription": {
      "text": "...",
      "segments": [...],
      "duration": 120
    },
    "processing_time": 45.5,
    "cached": false
  }
}
```

### Cancelar Transcrição

```bash
DELETE /api/transcribe/async/{task_id}
```

## 🧠 Integração com Fluxos de IA

Após a transcrição assíncrona ser concluída, o resultado é automaticamente processado pelos fluxos de IA:

1. **correctTranscriptionErrors** - Remove hesitações, capitaliza, normaliza pontuação
2. **identifySpeakers** - Identifica e marca diferentes locutores (Locutor 1:, Locutor 2:, etc)
3. **summarizeText** - Gera ata/resumo da reunião

```typescript
// Fluxo automático no componente AsyncTaskMonitor
const { data, error } = await processAsyncTranscriptionResult(
  transcriptionText,
  generateSummary
);

// data contém:
// - correctedTranscription
// - identifiedTranscription  
// - summary (opcional)
```

## 💾 Armazenamento Local

As tarefas assíncronas são armazenadas no localStorage com a chave `async_transcription_tasks`:

```typescript
// Obter todas as tarefas
const tasks = getAsyncTasks();

// Salvar nova tarefa
saveAsyncTask(task);

// Atualizar tarefa
updateAsyncTask(localId, updates);

// Deletar tarefa
deleteAsyncTask(localId);

// Obter tarefas por status
const activeTasks = getActiveTasks();
const completed = getCompletedTasks();
const failed = getFailedTasks();

// Limpar tarefas antigas (7 dias)
cleanupOldTasks(7);
```

## 🎨 Componentes

### AsyncTaskManager
Monitor flutuante de tarefas assíncronas no canto inferior direito.

**Props:**
- `onTaskComplete?: (task: AsyncTranscriptionTask) => void`
- `onTaskError?: (task: AsyncTranscriptionTask) => void`

**Recursos:**
- 3 abas: Ativas, Concluídas, Com Erro
- Scroll com histórico
- Botão para limpar tarefas antigas
- Indicador de tarefas ativas

### AsyncTaskMonitor
Monitor individual de uma tarefa assíncrona.

**Props:**
- `task: AsyncTranscriptionTask` - Tarefa a monitorar
- `onTaskComplete: (task: AsyncTranscriptionTask) => void`
- `onTaskError: (task: AsyncTranscriptionTask) => void`
- `onTaskCancel: (taskId: string) => void`

**Recursos:**
- Barra de progresso visual
- Status em tempo real
- Informações da tarefa
- Botão de cancelamento
- Exibição de erros

## 🔧 Configuração

A transcrição assíncrona é ativada por padrão. Para alterar, modifique em `page.tsx`:

```typescript
const [useAsync, setUseAsync] = useState(true); // true = async, false = sync
```

## 📝 Exemplos de Uso

### Processar um arquivo com transcrição assíncrona

```typescript
const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('language', 'pt');
  
  const { taskId, error } = await startAsyncTranscription(formData);
  
  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('Tarefa iniciada:', taskId);
    // Tarefa será monitorada automaticamente pelo AsyncTaskManager
  }
};
```

### Processar resultado assíncrono

```typescript
const processResult = async (taskId: string) => {
  const { status, error } = await checkAsyncTranscriptionStatus(taskId);
  
  if (status?.state === 'SUCCESS' && status.result?.transcription?.text) {
    const { data } = await processAsyncTranscriptionResult(
      status.result.transcription.text,
      true // generateSummary
    );
    
    console.log('Transcrição corrigida:', data?.correctedTranscription);
    console.log('Locutores identificados:', data?.identifiedTranscription);
    console.log('Resumo:', data?.summary);
  }
};
```

## 🚨 Tratamento de Erros

Os erros são tratados em múltiplas camadas:

1. **API Error** - Erros da requisição HTTP
2. **Processing Error** - Erro ao processar resultado
3. **Retry** - Tentativas automáticas (até 3 vezes)
4. **Cancel** - Usuário pode cancelar a qualquer momento

```typescript
if (taskStatus.state === 'FAILURE') {
  console.error('Erro:', taskStatus.error);
  // Usuário pode deletar ou tentar novamente
}
```

## 📈 Monitoramento

O AsyncTaskManager monitora automaticamente:

- Tarefas em progresso (atualiza a cada 2s no componente)
- Histórico geral de tarefas (atualiza a cada 30s)
- Limpeza automática de tarefas antigas

## 🔄 Webhooks (Opcional)

Para notificações em tempo real sem polling, pode-se fornecer um webhook:

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('webhook_url', 'https://seu-servidor.com/webhook');

await startAsyncTranscription(formData);
```

A API chamará a URL quando a transcrição for concluída.

## ✅ Checklist de Recursos

- ✅ Transcrição assíncrona com API backend
- ✅ Polling automático de status
- ✅ Retry automático com limite configurável
- ✅ Processamento com IA (correção, identificação, resumo)
- ✅ Gerenciador visual de tarefas
- ✅ Armazenamento local de tarefas
- ✅ Histórico de transcrições
- ✅ Cancelamento de tarefas
- ✅ Tratamento de erros
- ✅ Limpeza automática de tarefas antigas
- ✅ Suporte a modo síncrono (legacy)

## 🎯 Próximos Passos (Sugestões)

1. Implementar webhooks no frontend para notificações em tempo real
2. Adicionar export de tarefas e histórico
3. Implementar dashboard com estatísticas de transcrições
4. Adicionar filtros avançados no histórico
5. Implementar fila de prioridades para tarefas
6. Adicionar suporte a batch processing otimizado
