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
 * Inicia uma transcrição assíncrona usando o endpoint /api/transcribe/async
 * Retorna imediatamente com o jobId para que o cliente possa consultar o status
 */
export async function startAsyncTranscription(formData: FormData): Promise<{
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

    // Preparar FormData para enviar à API
    const apiFormData = new FormData();
    apiFormData.append('file', file);
    apiFormData.append('language', 'pt');

    const apiUrl = process.env.NEXT_PUBLIC_DAREDEVIL_API_URL;
    if (!apiUrl) {
      return { jobId: null, error: 'A URL da API não está configurada.' };
    }

    // URL do webhook (será chamada pela API quando terminar)
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/transcription`;
    if (webhookUrl) {
      apiFormData.append('webhook_url', webhookUrl);
    }

    // Iniciar transcrição assíncrona
    const response = await fetch(`${apiUrl}/api/transcribe/async`, {
      method: 'POST',
      body: apiFormData,
    });

    if (!response.ok) {
      let errorMessage = `A requisição para a API falhou com o status: ${response.statusText}`;
      try {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || JSON.stringify(errorData);
        } catch {
          errorMessage = errorText || errorMessage;
        }
      } catch {
        // Usar mensagem padrão se não conseguir ler a resposta
      }

      asyncJobStorage.updateJobStatus(jobId, 'FAILURE', undefined, errorMessage);
      console.error('API Error:', errorMessage);

      return {
        jobId: null,
        error: `Falha ao iniciar transcrição: ${errorMessage}`,
      };
    }

    const apiResponse = await response.json();

    if (!apiResponse.task_id) {
      asyncJobStorage.updateJobStatus(
        jobId,
        'FAILURE',
        undefined,
        'Resposta inválida da API: sem task_id'
      );

      return {
        jobId: null,
        error: 'A API retornou uma resposta inválida.',
      };
    }

    // Atualizar job com task_id da API
    const job = asyncJobStorage.getJob(jobId);
    if (job) {
      (job as any).apiTaskId = apiResponse.task_id;
      asyncJobStorage.updateJobStatus(jobId, 'STARTED');
    }

    console.log(`Transcrição iniciada: jobId=${jobId}, apiTaskId=${apiResponse.task_id}`);

    return { jobId, error: null };
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
export async function getAsyncTranscriptionStatus(jobId: string): Promise<{
  job: any | null;
  error: string | null;
}> {
  try {
    if (!jobId) {
      return { job: null, error: 'jobId é obrigatório.' };
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
export async function getRecentAsyncTranscriptions(limit: number = 10): Promise<{
  jobs: any[];
  error: string | null;
}> {
  try {
    if (limit < 1 || limit > 100) {
      return { jobs: [], error: 'Limite deve estar entre 1 e 100.' };
    }

    const jobs = asyncJobStorage.getRecentJobs(limit);

    return { jobs, error: null };
  } catch (error: any) {
    console.error('Erro ao listar transcrições:', error);
    return { jobs: [], error: error.message || 'Falha ao listar transcrições.' };
  }
}

/**
 * Cancela uma transcrição assíncrona
 */
export async function cancelAsyncTranscription(jobId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    if (!jobId) {
      return { success: false, error: 'jobId é obrigatório.' };
    }

    const job = asyncJobStorage.getJob(jobId);

    if (!job) {
      return { success: false, error: `Job ${jobId} não encontrado.` };
    }

    // Se o job ainda está em processamento, atualizar status
    if (job.status === 'PENDING' || job.status === 'STARTED') {
      asyncJobStorage.updateJobStatus(jobId, 'CANCELLED', undefined, 'Cancelado pelo usuário');
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Erro ao cancelar transcrição:', error);
    return { success: false, error: error.message || 'Falha ao cancelar transcrição.' };
  }
}
