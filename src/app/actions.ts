'use server';

import { correctTranscriptionErrors } from '@/ai/flows/correct-transcription-errors';
import { identifySpeakers } from '@/ai/flows/identify-speakers-in-text';
import { summarizeText } from '@/ai/flows/summarize-text';
import { asyncJobStorage } from '@/lib/async-job-storage';

// Helper para gerar IDs únicos
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function processMedia(formData: FormData): Promise<{ data: { rawTranscription: string; correctedTranscription: string; identifiedTranscription: string; summary: string | null } | null; error: string | null; }> {
  try {
    const file = formData.get('file') as File;
    const generateSummary = formData.get('generateSummary') === 'true';

    if (!file) {
      return { data: null, error: 'Nenhum arquivo foi fornecido.' };
    }
    
    // Step 1: Transcribe the audio file using Daredevil API
    const apiFormData = new FormData();
    apiFormData.append('file', file);
    apiFormData.append('language', 'pt');

    const apiUrl = process.env.NEXT_PUBLIC_DAREDEVIL_API_URL;
    if (!apiUrl) {
      return { data: null, error: 'A URL da API não está configurada.' };
    }

    const response = await fetch(`${apiUrl}/api/transcribe`, {
      method: 'POST',
      body: apiFormData,
    });

    if (!response.ok) {
      let errorMessage = `A requisição para a API falhou com o status: ${response.statusText}`;
      try {
        // First, try to get the full response text
        const errorText = await response.text();
        try {
          // Then, try to parse it as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || JSON.stringify(errorData);
        } catch (jsonError) {
          // If parsing fails, use the raw text as the error message
          errorMessage = errorText || errorMessage;
        }
      } catch (textError) {
        // If reading text fails, stick with the original status message
      }
      console.error("API Error:", errorMessage);
      return { data: null, error: `A requisição para a API falhou: ${errorMessage}` };
    }

    const transcriptionResult = await response.json();
    
    if (!transcriptionResult.success) {
      return { data: null, error: transcriptionResult.error || "A transcrição falhou." };
    }

    const transcriptionText = transcriptionResult.transcription.text;
    
    // Step 2: Correct grammatical errors
    const correctedResult = await correctTranscriptionErrors({ transcription: transcriptionText });

    // Step 3: Identify speakers in the corrected text
    const speakersResult = await identifySpeakers({ text: correctedResult.correctedTranscription });
    const identifiedText = speakersResult.identifiedText;

    let summary: string | null = null;
    if (generateSummary) {
        // Step 4: Generate a summary/meeting minutes from the identified text
        const summaryResult = await summarizeText({ text: identifiedText });
        summary = summaryResult.summary;
    }


    return { 
      data: { 
        rawTranscription: transcriptionText,
        correctedTranscription: correctedResult.correctedTranscription,
        identifiedTranscription: identifiedText,
        summary: summary 
      }, 
      error: null 
    };
  } catch (error: any) {
    console.error("Error processing media:", error);
    return { data: null, error: error.message || "Falha ao processar a transcrição. Por favor, tente novamente." };
  }
}

/**
 * Upload de arquivo com retry e timeout automático
 * Para arquivos > 50MB, usa chunked upload
 */
async function uploadFileToApi(
  file: File,
  apiUrl: string,
  language: string = 'pt',
  maxRetries: number = 3
): Promise<{ taskId: string; success: boolean }> {
  const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB por chunk
  const TIMEOUT = 5 * 60 * 1000; // 5 minutos de timeout por chunk
  const INITIAL_RETRY_DELAY = 1000; // 1 segundo

  console.log(`📤 Iniciando upload - Arquivo: ${file.name}, Tamanho: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

  // Se arquivo é pequeno (<50MB), fazer upload simples
  if (file.size <= CHUNK_SIZE) {
    return uploadSimple(file, apiUrl, language, maxRetries, TIMEOUT);
  }

  // Para arquivos maiores, usar chunked upload
  console.log(`📦 Arquivo grande detectado - usando chunked upload (${Math.ceil(file.size / CHUNK_SIZE)} chunks)`);
  return uploadChunked(file, apiUrl, language, maxRetries, CHUNK_SIZE, TIMEOUT);
}

/**
 * Upload simples com retry
 */
async function uploadSimple(
  file: File,
  apiUrl: string,
  language: string,
  maxRetries: number,
  timeout: number
): Promise<{ taskId: string; success: boolean }> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Upload simples - Tentativa ${attempt}/${maxRetries}`);

      const apiFormData = new FormData();
      apiFormData.append('file', file);
      apiFormData.append('language', language);
      apiFormData.append('webhook_url', '');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${apiUrl}/api/transcribe/async`, {
        method: 'POST',
        body: apiFormData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Status ${response.status}: ${response.statusText}`);
      }

      const apiResponse = await response.json();

      if (!apiResponse.task_id) {
        throw new Error('Resposta inválida: sem task_id');
      }

      console.log(`✅ Upload simples concluído - Task ID: ${apiResponse.task_id}`);
      return { taskId: apiResponse.task_id, success: true };
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Tentativa ${attempt} falhou:`, error.message);

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Backoff exponencial até 30s
        console.log(`⏳ Aguardando ${delay}ms antes de retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Upload falhou após ${maxRetries} tentativas: ${lastError?.message}`);
}

/**
 * Upload por chunks com retry por chunk
 */
async function uploadChunked(
  file: File,
  apiUrl: string,
  language: string,
  maxRetries: number,
  chunkSize: number,
  timeout: number
): Promise<{ taskId: string; success: boolean }> {
  const totalChunks = Math.ceil(file.size / chunkSize);
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  console.log(`🔄 Iniciando chunked upload - ID: ${uploadId}, Chunks: ${totalChunks}`);

  // Enviar cada chunk
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    let chunkSuccess = false;

    // Retry por chunk
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📦 Chunk ${chunkIndex + 1}/${totalChunks} - Tentativa ${attempt}/${maxRetries}`);

        const chunkFormData = new FormData();
        chunkFormData.append('chunk', chunk);
        chunkFormData.append('chunkIndex', String(chunkIndex));
        chunkFormData.append('totalChunks', String(totalChunks));
        chunkFormData.append('fileName', file.name);
        chunkFormData.append('uploadId', uploadId);
        chunkFormData.append('language', language);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${apiUrl}/api/transcribe/async/chunk`, {
          method: 'POST',
          body: chunkFormData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Status ${response.status}: ${response.statusText}`);
        }

        console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} concluído`);
        chunkSuccess = true;
        break;
      } catch (error: any) {
        console.error(`❌ Chunk ${chunkIndex + 1} falhou:`, error.message);

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
          console.log(`⏳ Aguardando ${delay}ms antes de retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!chunkSuccess) {
      throw new Error(`Chunk ${chunkIndex + 1}/${totalChunks} falhou após ${maxRetries} tentativas`);
    }
  }

  // Após todos os chunks, solicitar processamento
  console.log(`🔗 Todos os chunks enviados - solicitando processamento...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const finalizeFormData = new FormData();
      finalizeFormData.append('uploadId', uploadId);
      finalizeFormData.append('fileName', file.name);
      finalizeFormData.append('language', language);

      const response = await fetch(`${apiUrl}/api/transcribe/async/finalize`, {
        method: 'POST',
        body: finalizeFormData,
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}: ${response.statusText}`);
      }

      const apiResponse = await response.json();

      if (!apiResponse.task_id) {
        throw new Error('Resposta inválida: sem task_id');
      }

      console.log(`✅ Chunked upload concluído - Task ID: ${apiResponse.task_id}`);
      return { taskId: apiResponse.task_id, success: true };
    } catch (error: any) {
      console.error(`❌ Tentativa ${attempt} de finalização falhou:`, error.message);

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        console.log(`⏳ Aguardando ${delay}ms antes de retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Finalização do chunked upload falhou após ${maxRetries} tentativas`);
}

/**
 * Inicia uma transcrição assíncrona usando o endpoint /api/transcribe/async
 * Retorna imediatamente com o jobId para que o cliente possa consultar o status
 * 
 * OTIMIZADO: Upload com retry automático, timeout aumentado, e suporte a chunked upload
 */
export async function startAsyncTranscription(
  formData: FormData,
  sessionId: string | null
): Promise<{
  jobId: string | null;
  error: string | null;
}> {
  try {
    const file = formData.get('file') as File;

    if (!file) {
      return { jobId: null, error: 'Nenhum arquivo foi fornecido.' };
    }

    // Gerar ID da tarefa
    const jobId = generateJobId();

    // Criar registro local do job
    asyncJobStorage.createJob(jobId, file.name, file.size);

    const apiUrl = process.env.NEXT_PUBLIC_DAREDEVIL_API_URL;
    if (!apiUrl) {
      return { jobId: null, error: 'A URL da API não está configurada.' };
    }

    // Upload com retry e timeout automático
    console.log(`🚀 Iniciando upload com retry - Arquivo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    const uploadResult = await uploadFileToApi(file, apiUrl, 'pt', 3);
    
    if (!uploadResult.success || !uploadResult.taskId) {
      asyncJobStorage.updateJobStatus(jobId, 'FAILURE', undefined, 'Falha ao fazer upload do arquivo');
      return {
        jobId: null,
        error: 'Falha ao fazer upload do arquivo para a API.',
      };
    }

    // Usar task_id da API como identificador real
    const realJobId = uploadResult.taskId;
    
    // Prefixar com sessionId para isolamento de usuários
    const prefixedJobId = sessionId ? `${sessionId}:${realJobId}` : realJobId;
    
    // Atualizar ou recriar job com task_id real
    asyncJobStorage.deleteJob(jobId); // Remover job temporário
    asyncJobStorage.createJob(prefixedJobId, file.name, file.size);
    asyncJobStorage.updateJobStatus(prefixedJobId, 'STARTED');

    console.log(`✅ Transcrição iniciada: jobId=${prefixedJobId}`);

    return { jobId: prefixedJobId, error: null };
  } catch (error: any) {
    console.error('Erro ao iniciar transcrição assíncrona:', error);
    return {
      jobId: null,
      error: error.message || 'Falha ao iniciar a transcrição assíncrona.',
    };
  }
}

/**
 * Consulta o status de uma transcrição assíncrona
 */
export async function getAsyncTranscriptionStatus(
  jobId: string,
  sessionId: string | null
): Promise<{
  job: any | null;
  error: string | null;
}> {
  try {
    if (!jobId) {
      return { job: null, error: 'jobId é obrigatório.' };
    }

    // O jobId já vem prefixado do frontend, não precisa prefixar novamente
    // Apenas validar que pertence ao sessionId
    if (sessionId && !jobId.startsWith(`${sessionId}:`)) {
      return { job: null, error: 'Acesso negado a este job.' };
    }
    
    const job = asyncJobStorage.getJob(jobId);

    if (!job) {
      return { job: null, error: `Job ${jobId} não encontrado.` };
    }

    return { job, error: null };
  } catch (error: any) {
    console.error('Erro ao consultar status:', error);
    return { job: null, error: error.message || 'Falha ao consultar status.' };
  }
}

/**
 * Lista as transcrições assíncronas recentes
 */
export async function getRecentAsyncTranscriptions(
  limit: number = 10,
  sessionId: string | null
): Promise<{
  jobs: any[];
  error: string | null;
}> {
  try {
    if (limit < 1 || limit > 100) {
      return { jobs: [], error: 'Limite deve estar entre 1 e 100.' };
    }

    const jobs = asyncJobStorage.getRecentJobs(limit);

    // Filtrar jobs apenas do sessionId atual
    const filteredJobs = sessionId
      ? jobs.filter((job) => job.jobId.startsWith(`${sessionId}:`))
      : jobs;

    return { jobs: filteredJobs, error: null };
  } catch (error: any) {
    console.error('Erro ao listar transcrições:', error);
    return { jobs: [], error: error.message || 'Falha ao listar transcrições.' };
  }
}

/**
 * Processa os flows de IA (correção, identificação de speakers, summarização)
 * quando a transcrição assíncrona estiver completa
 */
export async function processTranscriptionFlows(
  jobId: string,
  transcription: string,
  generateSummary: boolean = false
): Promise<{
  success: boolean;
  correctedTranscription: string | null;
  identifiedTranscription: string | null;
  summary: string | null;
  error: string | null;
}> {
  try {
    if (!jobId || !transcription) {
      return {
        success: false,
        correctedTranscription: null,
        identifiedTranscription: null,
        summary: null,
        error: 'jobId e transcription são obrigatórios.',
      };
    }

    console.log(`[FLOWS] 🚀 Iniciando processamento de flows para jobId: ${jobId}`);

    // Step 1: Corrigir erros gramaticais
    console.log(`[FLOWS] 📝 Iniciando correção...`);
    const correctedResult = await correctTranscriptionErrors({ 
      transcription,
      jobId 
    });
    console.log(`[FLOWS] ✅ Correção completa`);

    // Step 2: Identificar speakers
    console.log(`[FLOWS] 🎤 Iniciando identificação de speakers...`);
    const speakersResult = await identifySpeakers({ 
      text: correctedResult.correctedTranscription,
      jobId 
    });
    console.log(`[FLOWS] ✅ Identificação de speakers completa`);

    let summary: string | null = null;
    if (generateSummary) {
      // Step 3: Gerar sumário
      console.log(`[FLOWS] 📊 Iniciando geração de sumário...`);
      const summaryResult = await summarizeText({ 
        text: speakersResult.identifiedText,
        jobId 
      });
      summary = summaryResult.summary;
      console.log(`[FLOWS] ✅ Sumário gerado`);
    }

    console.log(`[FLOWS] 🎉 Todos os flows completados para jobId: ${jobId}`);

    return {
      success: true,
      correctedTranscription: correctedResult.correctedTranscription,
      identifiedTranscription: speakersResult.identifiedText,
      summary,
      error: null,
    };
  } catch (error: any) {
    console.error(`[FLOWS] ❌ Erro ao processar flows:`, error);
    return {
      success: false,
      correctedTranscription: null,
      identifiedTranscription: null,
      summary: null,
      error: error.message || 'Falha ao processar flows.',
    };
  }
}

/**
 * Atualiza o job com os resultados dos flows processados
 */
export async function updateJobWithFlowResults(
  jobId: string,
  transcription: string,
  correctedTranscription: string,
  identifiedTranscription: string,
  summary: string | null
): Promise<{ success: boolean; error: string | null }> {
  try {
    const job = asyncJobStorage.getJob(jobId);

    if (!job) {
      return { success: false, error: `Job ${jobId} não encontrado.` };
    }

    const result = {
      rawTranscription: transcription,
      correctedTranscription,
      identifiedTranscription,
      summary,
      processingTime: job.updatedAt ? Date.now() - job.createdAt : 0,
      audioInfo: job.result?.audioInfo || {
        format: '',
        duration: 0,
        sampleRate: 0,
        channels: 0,
        fileSizeMb: job.fileSize / (1024 * 1024),
      },
    };

    asyncJobStorage.updateJobStatus(jobId, 'SUCCESS', result);

    console.log(`[UPDATE] ✅ Job ${jobId} atualizado com resultados dos flows`);

    return { success: true, error: null };
  } catch (error: any) {
    console.error(`[UPDATE] ❌ Erro ao atualizar job:`, error);
    return { success: false, error: error.message || 'Falha ao atualizar job.' };
  }
}

/**
 * Cancela uma transcrição assíncrona
 */
export async function cancelAsyncTranscription(
  jobId: string,
  sessionId: string | null
): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    if (!jobId) {
      return { success: false, error: 'jobId é obrigatório.' };
    }

    // O jobId já vem prefixado do frontend, não precisa prefixar novamente
    // Apenas validar que pertence ao sessionId
    if (sessionId && !jobId.startsWith(`${sessionId}:`)) {
      console.log('❌ Job não pertence ao sessionId:', { jobId, sessionId });
      return { success: false, error: 'Acesso negado a este job.' };
    }

    console.log('🔍 Buscando job para cancelar:', jobId);
    const job = asyncJobStorage.getJob(jobId);

    if (!job) {
      console.log('❌ Job não encontrado:', jobId);
      return { success: false, error: `Job ${jobId} não encontrado.` };
    }

    // Se o job ainda está em processamento, atualizar status
    if (job.status === 'PENDING' || job.status === 'STARTED') {
      console.log('🛑 Cancelando job:', jobId);
      asyncJobStorage.updateJobStatus(jobId, 'CANCELLED', undefined, 'Cancelado pelo usuário');
    }

    console.log('✅ Job cancelado com sucesso:', jobId);
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Erro ao cancelar transcrição:', error);
    return { success: false, error: error.message || 'Falha ao cancelar transcrição.' };
  }
}
