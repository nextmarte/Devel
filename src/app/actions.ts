'use server';

import { correctTranscriptionErrors } from '@/ai/flows/correct-transcription-errors';
import { identifySpeakers } from '@/ai/flows/identify-speakers-in-text';
import { summarizeText } from '@/ai/flows/summarize-text';

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
