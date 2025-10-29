'use server';

import { correctTranscriptionErrors } from '@/ai/flows/correct-transcription-errors';
import { identifySpeakers } from '@/ai/flows/identify-speakers-in-text';

export async function processMedia(formData: FormData): Promise<{ data: string | null; error: string | null; }> {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { data: null, error: 'No file was provided.' };
    }
    
    // Step 1: Transcribe the audio file using Daredevil API
    const apiFormData = new FormData();
    apiFormData.append('file', file);
    apiFormData.append('language', 'pt');

    const response = await fetch(`${process.env.NEXT_PUBLIC_DAREDEVIL_API_URL}/api/transcribe`, {
      method: 'POST',
      body: apiFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'An unknown API error occurred.' }));
      console.error("API Error:", errorData);
      return { data: null, error: `API request failed: ${errorData.error || response.statusText}` };
    }

    const transcriptionResult = await response.json();
    
    if (!transcriptionResult.success) {
      return { data: null, error: transcriptionResult.error || "Transcription failed." };
    }

    const transcriptionText = transcriptionResult.transcription.text;
    
    // Step 2: Correct grammatical errors
    const correctedResult = await correctTranscriptionErrors({ transcription: transcriptionText });

    // Step 3: Identify speakers in the corrected text
    const speakersResult = await identifySpeakers({ text: correctedResult.correctedTranscription });

    return { data: speakersResult.identifiedText, error: null };
  } catch (error: any) {
    console.error("Error processing media:", error);
    return { data: null, error: error.message || "Failed to process transcription. Please try again." };
  }
}
