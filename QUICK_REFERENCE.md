# 🚀 Quick Reference - Transcrição Assíncrona

## TL;DR

✅ Transcrição assíncrona implementada e ativa por padrão  
✅ UI não bloqueia mais durante processamento  
✅ Suporta arquivos até 500MB  
✅ Retry automático + Histórico visual  

## Iniciar Rápido

### Upload com Assíncrono (Padrão)
```typescript
const formData = new FormData();
formData.append('file', audioFile);

const { taskId, error } = await startAsyncTranscription(formData);
// Pronto! Tarefa será monitorada automaticamente
```

### Verificar Status
```typescript
const { status, error } = await checkAsyncTranscriptionStatus(taskId);
console.log(status.state);      // PENDING, STARTED, SUCCESS, FAILURE...
console.log(status.progress);   // { percentage: 45 }
```

### Processar Resultado
```typescript
const { data, error } = await processAsyncTranscriptionResult(
  transcriptionText,
  true // generateSummary
);
// data contém: correctedTranscription, identifiedTranscription, summary
```

## Estados da Tarefa

```
PENDING  → Aguardando processamento
STARTED  → Processamento iniciado
SUCCESS  → ✅ Concluído com sucesso
FAILURE  → ❌ Erro
RETRY    → ⚠️  Tentando novamente
CANCELLED → ⏹️ Cancelado
```

## Armazenamento Local

```typescript
import { 
  getAsyncTasks,        // Todas as tarefas
  getActiveTasks,       // Tarefas em andamento
  getCompletedTasks,    // Concluídas com sucesso
  getFailedTasks,       // Com erro
  saveAsyncTask,        // Salvar nova
  updateAsyncTask,      // Atualizar existente
  deleteAsyncTask,      // Deletar
  cleanupOldTasks       // Limpar > 7 dias
} from '@/lib/async-transcription-storage';
```

## Componentes

### AsyncTaskManager
```tsx
<AsyncTaskManager 
  onTaskComplete={(task) => console.log('Completa!', task)}
  onTaskError={(task) => console.log('Erro!', task)}
/>
```
Apareça no canto inferior direito automaticamente.

### AsyncTaskMonitor
```tsx
<AsyncTaskMonitor
  task={asyncTask}
  onTaskComplete={handleComplete}
  onTaskError={handleError}
  onTaskCancel={handleCancel}
/>
```

## Tipos Principais

```typescript
interface AsyncTranscriptionTask {
  id: string;
  taskId: string;              // ID da API
  fileName: string;
  status: AsyncTaskStatus;     // PENDING, STARTED, SUCCESS...
  progress: number;            // 0-100
  result?: AsyncTranscriptionResponse;
  error?: string;
  retries: number;
  maxRetries: number;
  language: string;
  generateSummary: boolean;
  correctedTranscription?: string;
  identifiedTranscription?: string;
  summary?: string;
}

type AsyncTaskStatus = 
  | 'PENDING' | 'STARTED' | 'SUCCESS' 
  | 'FAILURE' | 'RETRY' | 'CANCELLED';
```

## UI

### Ativar/Desativar Assíncrono
```tsx
<div className="flex items-center space-x-2">
  <Switch id="async-switch" checked={useAsync} onCheckedChange={setUseAsync} />
  <Label>Transcrição assíncrona (recomendado)</Label>
</div>
```

### Monitor Flutuante
- Aparece automaticamente no canto inferior direito
- 3 abas: Ativas, Concluídas, Com Erro
- Recolhível/Expansível
- Atualização em tempo real

## APIs

### Iniciar
```
POST /api/transcribe/async
file: <arquivo>
language: pt (opcional)
model: <modelo> (opcional)
webhook_url: <url> (opcional, não enviar se não usar)

→ { task_id: "abc123", status_url: "..." }
```

**Nota:** A aplicação não envia o campo `webhook_url` quando não está sendo usado (usa polling em vez de webhooks).

### Status
```
GET /api/transcribe/async/status/{task_id}

→ { 
    state: "STARTED",
    progress: { percentage: 45 },
    result: { transcription: {...} }
  }
```

### Cancelar
```
DELETE /api/transcribe/async/{task_id}

→ { success: true }
```

## Troubleshooting

### Tarefa não aparece
- ✅ Verifique se task_id foi retornado
- ✅ Verifique console.log para erros
- ✅ Atualize a página

### Progresso não atualiza
- ✅ Verifique conexão de internet
- ✅ Verifique se polling está ativo (2s)
- ✅ Verifique browser console

### Resultado não processa
- ✅ Verifique status === 'SUCCESS'
- ✅ Verifique result.transcription.text
- ✅ Verifique console para erros de IA

### Tarefa sempre ativa
- ✅ Pode significar erro no backend
- ✅ Clique "Cancelar" para remover
- ✅ Verifique logs do backend

## Configurações

```typescript
// Intervalo de polling (ms)
const pollInterval = 2000;  // A cada 2 segundos

// Máximo de tarefas no histórico
const MAX_ITEMS = 50;

// Tentativas de retry automático
const maxRetries = 3;

// Limpeza automática (dias)
cleanupOldTasks(7);  // Remove tarefas > 7 dias
```

## Performance

| Métrica | Valor |
|---------|-------|
| Intervalo polling | 2s |
| Timeout geral | 10min (300 tentativas) |
| Max arquivo | 500MB |
| Max tarefas local | 50 |
| Retry automático | 3x |

## Checklist de Uso

- [ ] Importar componentes necessários
- [ ] Ativar switch de "Transcrição assíncrona"
- [ ] Fazer upload de arquivo
- [ ] Verificar progresso no monitor
- [ ] Aguardar conclusão
- [ ] Revisar resultado
- [ ] Editar se necessário
- [ ] Exportar/Salvar

## Links Úteis

- 📖 **Documentação Completa**: `docs/ASYNC_TRANSCRIPTION.md`
- 💡 **Exemplos de Código**: `ASYNC_TRANSCRIPTION_EXAMPLES.ts`
- 📊 **Resumo de Mudanças**: `ASYNC_TRANSCRIPTION_UPDATE.md`
- 🎯 **Implementação Resumida**: `IMPLEMENTATION_SUMMARY.md`

## Exemplos Rápidos

### Upload e Esperar Resultado
```typescript
const formData = new FormData();
formData.append('file', file);

// Iniciar
const { taskId } = await startAsyncTranscription(formData);

// Criar tarefa local
const task = { taskId, fileName: file.name, ... };
saveAsyncTask(task);

// Monitor automático irá:
// 1. Fazer polling a cada 2s
// 2. Processar com IA quando completa
// 3. Salvar resultado em localStorage
// 4. Exibir no histórico
```

### Monitorar Manualmente
```typescript
let complete = false;

while (!complete) {
  const { status } = await checkAsyncTranscriptionStatus(taskId);
  
  if (status?.state === 'SUCCESS') {
    console.log('Concluído:', status.result.transcription.text);
    complete = true;
  }
  
  await new Promise(r => setTimeout(r, 2000)); // Esperar 2s
}
```

### Salvar Resultado
```typescript
const transcriptionData: TranscriptionData = {
  id: Date.now().toString(),
  timestamp: Date.now(),
  duration: task.result.transcription.duration,
  rawTranscription: task.result.transcription.text,
  correctedTranscription: task.correctedTranscription,
  identifiedTranscription: task.identifiedTranscription,
  summary: task.summary,
  fileName: task.fileName,
};

saveTranscription(transcriptionData);
```

## Modo Síncrono (Legacy)

Para usar o modo antigo (UI bloqueia):

```typescript
// Em src/app/page.tsx
const [useAsync, setUseAsync] = useState(false); // ← Mudar para false

// Resultado:
// - Sem polling
// - UI bloqueia
// - Sem gerenciador de tarefas
// - Compatível com versão anterior
```

---

**Pronto para usar!** 🚀

Qualquer dúvida, verifique a documentação completa em `docs/ASYNC_TRANSCRIPTION.md`
