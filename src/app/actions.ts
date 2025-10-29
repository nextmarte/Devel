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

    const apiUrl = process.env.NEXT_PUBLIC_DAREDEVIL_API_URL;
    if (!apiUrl) {
      return { data: null, error: 'API URL is not configured.' };
    }

    const response = await fetch(`${apiUrl}/api/transcribe`, {
      method: 'POST',
      body: apiFormData,
    });

    if (!response.ok) {
      // Try to parse error response as JSON, but fallback to text if it fails
      let errorMessage = `API request failed with status: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || JSON.stringify(errorData);
      } catch (e) {
        // The response was not JSON, use the raw text
        errorMessage = await response.text();
      }
      console.error("API Error:", errorMessage);
      return { data: null, error: `API request failed: ${errorMessage}` };
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
