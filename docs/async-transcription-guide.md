# Sistema de Transcrição Assíncrona

Este documento descreve como usar o novo sistema de transcrição assíncrona implementado na aplicação.

## Visão Geral

O sistema oferece agora **dois modos de operação**:

### 1. Modo Síncrono (já existente)
- Função: `processMedia()`
- Aguarda a resposta completa
- Ideal para arquivos pequenos
- Sem webhook

### 2. Modo Assíncrono (novo)
- Funções: `startAsyncTranscription()`, `getAsyncTranscriptionStatus()`, etc.
- Retorna imediatamente com um `jobId`
- Cliente faz polling para consultar status
- Ideal para arquivos grandes
- Permite processamento em background

## Como Usar o Modo Assíncrono

### 1. Iniciar uma Transcrição

```typescript
import { startAsyncTranscription } from '@/app/actions';

const formData = new FormData();
formData.append('file', audioFile);

const { jobId, error } = await startAsyncTranscription(formData);

if (error) {
  console.error('Erro:', error);
} else {
  console.log('Transcrição iniciada com jobId:', jobId);
  // Guardar jobId para consultas posteriores
}
```

### 2. Consultar Status de uma Transcrição

```typescript
import { getAsyncTranscriptionStatus } from '@/app/actions';

const { job, error } = await getAsyncTranscriptionStatus(jobId);

if (error) {
  console.error('Erro:', error);
} else {
  console.log('Status:', job.status);
  console.log('Progresso:', job.progress);
  
  if (job.status === 'SUCCESS') {
    console.log('Resultado:', job.result);
  }
}
```

### 3. Listar Transcrições Recentes

```typescript
import { getRecentAsyncTranscriptions } from '@/app/actions';

const { jobs, error } = await getRecentAsyncTranscriptions(10);

if (!error) {
  jobs.forEach(job => {
    console.log(`${job.fileName}: ${job.status}`);
  });
}
```

### 4. Cancelar uma Transcrição

```typescript
import { cancelAsyncTranscription } from '@/app/actions';

const { success, error } = await cancelAsyncTranscription(jobId);

if (success) {
  console.log('Transcrição cancelada');
}
```

## Fluxo de Funcionamento

1. **Cliente inicia transcrição**
   ```
   POST /api/transcribe/async (Daredevil API)
   → Retorna task_id
   ```

2. **Daredevil API processa em background**
   ```
   Processando áudio...
   ```

3. **Cliente consulta status via polling**
   ```
   GET /api/jobs/[jobId]
   (A cada 2 segundos automaticamente)
   ```

4. **Quando concluir (SUCCESS ou FAILURE)**
   ```
   Cliente recebe resultado completo
   ```

## Estados do Job

```typescript
type AsyncJobStatus = 
  | 'PENDING'     // Aguardando processamento
  | 'STARTED'     // Processamento iniciado
  | 'SUCCESS'     // Concluído com sucesso
  | 'FAILURE'     // Falhou
  | 'RETRY'       // Tentando novamente após erro
  | 'CANCELLED'   // Cancelado pelo usuário
```

## Estrutura do Job

```typescript
interface AsyncJob {
  jobId: string;                    // ID único
  status: AsyncJobStatus;           // Status atual
  fileName: string;                 // Nome do arquivo
  fileSize: number;                 // Tamanho em bytes
  createdAt: number;                // Timestamp de criação
  updatedAt: number;                // Última atualização
  progress?: {                       // Progresso
    stage: string;
    percentage: number;
  };
  result?: {                         // Resultado (quando SUCCESS)
    rawTranscription: string;
    correctedTranscription: string;
    identifiedTranscription: string;
    summary: string | null;
    processingTime: number;
    audioInfo: {...};
  };
  error?: string;                    // Mensagem de erro
}
```

## Endpoints da API

### Consultar Status
```
GET /api/jobs/[jobId]
Resposta: { success: true, job: AsyncJob }
```

### Listar Jobs Recentes
```
GET /api/jobs?limit=10
Resposta: { success: true, total: number, jobs: AsyncJob[] }
```

### Deletar Job
```
DELETE /api/jobs/[jobId]
Resposta: { success: true, message: string }
```

### Receber Webhook (interno)
```
GET /api/jobs/[jobId]
Resposta: { success: true, job: AsyncJob }
```

## Variáveis de Ambiente Necessárias

```env
# URL da Daredevil API
NEXT_PUBLIC_DAREDEVIL_API_URL=https://api.daredevil.example.com

# URL da aplicação
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

## Exemplo Completo de Uso no Cliente

```typescript
'use client';

import { useState, useEffect } from 'react';
import { startAsyncTranscription, getAsyncTranscriptionStatus } from '@/app/actions';

export function TranscriptionComponent() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    const { jobId: id, error } = await startAsyncTranscription(formData);

    if (!error && id) {
      setJobId(id);
      console.log('Transcrição iniciada:', id);
    } else {
      console.error('Erro:', error);
    }
    setLoading(false);
  };

  // Consultar status a cada 2 segundos
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      const { job: data } = await getAsyncTranscriptionStatus(jobId);
      if (data) {
        setJob(data);

        // Parar polling quando concluir
        if (data.status === 'SUCCESS' || data.status === 'FAILURE') {
          clearInterval(interval);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={loading}
      />

      {job && (
        <div>
          <p>Status: {job.status}</p>
          <p>Progresso: {job.progress?.percentage}%</p>

          {job.status === 'SUCCESS' && job.result && (
            <div>
              <h3>Resultado</h3>
              <p>Transcrição: {job.result.rawTranscription}</p>
              <p>Resumo: {job.result.summary}</p>
            </div>
          )}

          {job.status === 'FAILURE' && <p>Erro: {job.error}</p>}
        </div>
      )}
    </div>
  );
}
```

## Notas de Segurança

- Jobs armazenados em memória e localStorage
- localStorage persiste apenas no navegador do usuário
- Nenhum dados sensível é armazenado nos jobs

## Limpeza de Jobs Antigos

Jobs com mais de 7 dias serão automaticamente limpos:

```typescript
// Chamar periodicamente (ex: em um cron job)
asyncJobStorage.cleanup();
```

## Limitações Atuais

- Jobs armazenados em memória (perdidos ao reiniciar servidor)
- Para produção, considere usar um banco de dados
- Polling não é real-time (delay de 2-5 segundos típico)

## Próximos Passos

Para melhorar em produção:

1. **Persistência em Banco de Dados**
   - Trocar localStorage por PostgreSQL/MongoDB
   - Histórico permanente de transcrições

2. **WebSocket Real-time**
   - Ao invés de polling, usar WebSocket
   - Atualizações instantâneas

3. **Autenticação por Usuário**
   - Cada usuário vê seus próprios jobs
   - Histórico por usuário

4. **Queue System**
   - Bull, Celery ou similar
   - Processamento paralelo de múltiplos jobs

5. **Cache Distribuído**
   - Redis para compartilhar estado entre servidores
