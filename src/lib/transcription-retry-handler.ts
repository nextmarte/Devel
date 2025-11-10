/**
 * Workaround para bug na API Daredevil
 * 
 * Problema: Arquivo temporário desaparece antes do Deepseek processar
 * Solução: Retry inteligente com backoff exponencial
 * 
 * Quando receber erro "No such file", reenviar arquivo automaticamente
 */

import { asyncJobStorage } from '@/lib/async-job-storage';

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 2000,      // 2 segundos
  maxDelayMs: 30000,         // 30 segundos
  backoffMultiplier: 2,      // Dobra a cada tentativa
};

/**
 * Calcula delay com backoff exponencial
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Verifica se erro é o bug do arquivo temporário desaparecido
 */
function isMissingFileError(error: string): boolean {
  return error.includes("No such file") || 
         error.includes("temp_") ||
         error.includes("daredevil");
}

/**
 * Aguarda com callback de progresso
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Implementar retry inteligente para transcrições com erro de arquivo
 * 
 * USAGE:
 * ```
 * const retryableJobId = await retryTranscriptionIfNeeded(jobId, sessionId);
 * ```
 */
export async function retryTranscriptionIfNeeded(
  jobId: string,
  sessionId: string | null,
  apiUrl: string,
  config: Partial<RetryConfig> = {}
): Promise<{ success: boolean; retriedJobId?: string; error?: string }> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  try {
    const job = asyncJobStorage.getJob(jobId);
    
    if (!job) {
      return { success: false, error: `Job ${jobId} não encontrado` };
    }
    
    // Só fazer retry se houver erro de arquivo
    if (!job.error || !isMissingFileError(job.error)) {
      return { success: true }; // Não precisa retry
    }
    
    console.log(`🔄 [RETRY] Detectado erro de arquivo temporário desaparecido`);
    console.log(`📋 Job ID: ${jobId}`);
    console.log(`❌ Erro original: ${job.error}`);
    console.log(`🔄 Iniciando retry com max ${finalConfig.maxRetries} tentativas`);
    
    // Reiniciar o job
    asyncJobStorage.updateJobStatus(jobId, 'RETRY');
    
    return { success: true };
    
  } catch (error: any) {
    console.error(`[RETRY ERROR]`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Hook para verificar e fazer retry automático após status ser consultado
 * 
 * USAGE em page.tsx:
 * ```
 * useEffect(() => {
 *   if (asyncJob?.status === 'FAILURE' && asyncJob?.error?.includes('No such file')) {
 *     handleAutoRetry();
 *   }
 * }, [asyncJob?.status]);
 * ```
 */
export async function handleTranscriptionRetry(
  jobId: string,
  file: File,
  apiUrl: string,
  sessionId: string | null,
  config: Partial<RetryConfig> = {}
): Promise<{
  success: boolean;
  newJobId?: string;
  error?: string;
}> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  console.log(`🔄 [RETRY HANDLER] Iniciando retry para jobId: ${jobId}`);
  
  for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      console.log(`\n📤 [RETRY ${attempt}/${finalConfig.maxRetries}] Reenviando arquivo...`);
      
      // Enviar arquivo novamente
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', 'pt');
      formData.append('webhook_url', '');
      
      // Usar fetch com timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minutos
      
      try {
        const response = await fetch(`${apiUrl}/api/transcribe/async`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          throw new Error(`Status ${response.status}: ${response.statusText}`);
        }
        
        const apiResponse = await response.json();
        
        if (!apiResponse.task_id) {
          throw new Error('Resposta inválida: sem task_id');
        }
        
        // Novo job ID
        const newJobId = sessionId ? `${sessionId}:${apiResponse.task_id}` : apiResponse.task_id;
        
        // Criar novo job com novo ID
        asyncJobStorage.createJob(newJobId, file.name, file.size);
        asyncJobStorage.updateJobStatus(newJobId, 'STARTED');
        
        // Deletar job antigo
        asyncJobStorage.deleteJob(jobId);
        
        console.log(`✅ [RETRY ${attempt}] Sucesso! Novo jobId: ${newJobId}`);
        
        return {
          success: true,
          newJobId,
        };
        
      } finally {
        clearTimeout(timeout);
      }
      
    } catch (error: any) {
      console.error(`❌ [RETRY ${attempt}] Falha:`, error.message);
      
      if (attempt < finalConfig.maxRetries) {
        const waitTime = calculateDelay(attempt, finalConfig);
        console.log(`⏳ [RETRY] Aguardando ${waitTime}ms antes da próxima tentativa...`);
        await delay(waitTime);
      } else {
        console.error(`❌ [RETRY] Todas as ${finalConfig.maxRetries} tentativas falharam`);
        return { 
          success: false, 
          error: `Retry falhou após ${finalConfig.maxRetries} tentativas: ${error.message}` 
        };
      }
    }
  }
  
  return { 
    success: false, 
    error: 'Retry falhou - número máximo de tentativas atingido' 
  };
}

/**
 * Integração com hook de polling - adicionar retry automático
 * 
 * USAGE em use-transcription-polling.ts:
 * ```
 * if (job?.status === 'FAILURE' && isMissingFileError(job?.error)) {
 *   await handleTranscriptionRetry(jobId, file, apiUrl, sessionId);
 * }
 * ```
 */
export function shouldRetryTranscription(job: any): boolean {
  if (!job) return false;
  if (job.status !== 'FAILURE') return false;
  if (!job.error) return false;
  
  return isMissingFileError(job.error);
}
