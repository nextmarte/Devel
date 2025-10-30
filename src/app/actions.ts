'use server';

import { correctTranscriptionErrors } from '@/ai/flows/correct-transcription-errors';
import { identifySpeakers } from '@/ai/flows/identify-speakers-in-text';
import { summarizeText } from '@/ai/flows/summarize-text';
import { AsyncTaskStatus, AsyncTaskResult } from '@/lib/transcription-types';

// Proxy function to call backend - contorna problemas CORS do Apache
async function proxyToBackend(endpoint: string, formData: FormData): Promise<Response> {
  const apiUrl = process.env.NEXT_PUBLIC_DAREDEVIL_API_URL;
  if (!apiUrl) {
    throw new Error('Backend URL não configurada');
  }

  const response = await fetch(`${apiUrl}${endpoint}`, {
    method: 'POST',
    body: formData,
    headers: {
      // Não adicione Content-Type aqui, deixa o navegador fazer
    },
  });

  return response;
}

export async function processMedia(formData: FormData): Promise<{ data: { rawTranscription: string; correctedTranscription: string; identifiedTranscription: string; summary: string | null } | null; error: string | null; }> {
  try {
    const file = formData.get('file') as File;
    const generateSummary = formData.get('generateSummary') === 'true';
    const language = (formData.get('language') as string) || 'pt';
    const model = formData.get('model') as string;

    if (!file) {
      return { data: null, error: 'Nenhum arquivo foi fornecido.' };
    }
    
    // Step 1: Transcribe the audio file using Daredevil API
    const apiFormData = new FormData();
    apiFormData.append('file', file);
    apiFormData.append('language', language);
    
    // Adicionar modelo se fornecido
    if (model && model.trim()) {
      apiFormData.append('model', model);
    }

    const apiUrl = process.env.NEXT_PUBLIC_DAREDEVIL_API_URL;
    if (!apiUrl) {
      return { data: null, error: 'A URL da API não está configurada.' };
    }

    // Use o proxy do Next.js para contornar problemas CORS do Apache
    const response = await proxyToBackend('/api/transcribe', apiFormData);

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

// Iniciar transcrição assíncrona
export async function startAsyncTranscription(formData: FormData): Promise<{ taskId: string | null; error: string | null }> {
  try {
    const file = formData.get('file') as File;
    const language = (formData.get('language') as string) || 'pt';
    const model = (formData.get('model') as string);

    if (!file) {
      return { taskId: null, error: 'Nenhum arquivo foi fornecido.' };
    }

    const apiUrl = process.env.NEXT_PUBLIC_DAREDEVIL_API_URL;
    if (!apiUrl) {
      return { taskId: null, error: 'A URL da API não está configurada.' };
    }

    const apiFormData = new FormData();
    apiFormData.append('file', file);
    apiFormData.append('language', language);
    
    // Apenas adiciona model se houver valor
    if (model && model.trim()) {
      apiFormData.append('model', model);
    }
    
    // NÃO enviamos webhook_url - o usuário não insere, 
    // usamos polling para verificar status em vez disso

    // Use o proxy do Next.js para contornar problemas CORS do Apache
    const response = await proxyToBackend('/api/transcribe/async', apiFormData);

    if (!response.ok) {
      let errorMessage = `A requisição para a API falhou com o status: ${response.statusText}`;
      try {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || JSON.stringify(errorData);
        } catch (jsonError) {
          errorMessage = errorText || errorMessage;
        }
      } catch (textError) {
        // Continue with original error message
      }
      console.error("API Error:", errorMessage);
      return { taskId: null, error: `A requisição para a API falhou: ${errorMessage}` };
    }

    const result = await response.json();
    return { taskId: result.task_id, error: null };
  } catch (error: any) {
    console.error("Error starting async transcription:", error);
    return { taskId: null, error: error.message || "Falha ao iniciar a transcrição assíncrona." };
  }
}

// Verificar status da transcrição assíncrona
export async function checkAsyncTranscriptionStatus(taskId: string): Promise<{ status: AsyncTaskResult | null; error: string | null }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_DAREDEVIL_API_URL;
    if (!apiUrl) {
      return { status: null, error: 'A URL da API não está configurada.' };
    }

    const response = await fetch(`${apiUrl}/api/transcribe/async/status/${taskId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      let errorMessage = `A requisição para a API falhou com o status: ${response.statusText}`;
      try {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || JSON.stringify(errorData);
        } catch (jsonError) {
          errorMessage = errorText || errorMessage;
        }
      } catch (textError) {
        // Continue with original error message
      }
      console.error("API Error:", errorMessage);
      return { status: null, error: `A requisição para a API falhou: ${errorMessage}` };
    }

    const status: AsyncTaskResult = await response.json();
    return { status, error: null };
  } catch (error: any) {
    console.error("Error checking async transcription status:", error);
    return { status: null, error: error.message || "Falha ao verificar o status da transcrição." };
  }
}

// Cancelar transcrição assíncrona
export async function cancelAsyncTranscription(taskId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_DAREDEVIL_API_URL;
    if (!apiUrl) {
      return { success: false, error: 'A URL da API não está configurada.' };
    }

    const response = await fetch(`${apiUrl}/api/transcribe/async/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      let errorMessage = `A requisição para a API falhou com o status: ${response.statusText}`;
      try {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || JSON.stringify(errorData);
        } catch (jsonError) {
          errorMessage = errorText || errorMessage;
        }
      } catch (textError) {
        // Continue with original error message
      }
      console.error("API Error:", errorMessage);
      return { success: false, error: `A requisição para a API falhou: ${errorMessage}` };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error canceling async transcription:", error);
    return { success: false, error: error.message || "Falha ao cancelar a transcrição." };
  }
}

// Processar resultado assíncrono completo (aplicar correções e IA)
export async function processAsyncTranscriptionResult(
  rawTranscription: string,
  generateSummary: boolean
): Promise<{ data: { rawTranscription: string; correctedTranscription: string; identifiedTranscription: string; summary: string | null } | null; error: string | null }> {
  try {
    // Step 1: Correct grammatical errors
    const correctedResult = await correctTranscriptionErrors({ transcription: rawTranscription });

    // Step 2: Identify speakers in the corrected text
    const speakersResult = await identifySpeakers({ text: correctedResult.correctedTranscription });
    const identifiedText = speakersResult.identifiedText;

    let summary: string | null = null;
    if (generateSummary) {
      // Step 3: Generate a summary/meeting minutes from the identified text
      const summaryResult = await summarizeText({ text: identifiedText });
      summary = summaryResult.summary;
    }

    return {
      data: {
        rawTranscription: rawTranscription,
        correctedTranscription: correctedResult.correctedTranscription,
        identifiedTranscription: identifiedText,
        summary: summary,
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Error processing async transcription result:", error);
    return {
      data: null,
      error: error.message || "Falha ao processar o resultado da transcrição assíncrona.",
    };
  }
}

