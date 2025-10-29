'use server';

import { correctTranscriptionErrors } from '@/ai/flows/correct-transcription-errors';
import { identifySpeakers } from '@/ai/flows/identify-speakers-in-text';

// This is a hardcoded sample of what a transcription API might return.
const MOCK_TRANSCRIPTION = `
helo my name is Matt Murdock i am a lawyer. how can i help you today
well mr murdock i have a problem. my name is frank castle someone is trying to take my property
i see. we can help with that. tell me everything.
`;

export async function processMedia(): Promise<{ data: string | null; error: string | null; }> {
  try {
    // In a real app, you'd upload a file and call a transcription service here.
    // For this demo, we'll simulate a delay and use a mock transcription.
    await new Promise(resolve => setTimeout(resolve, 3000));

    const transcription = { transcription: MOCK_TRANSCRIPTION };

    // Step 1: Correct grammatical errors
    const correctedResult = await correctTranscriptionErrors(transcription);

    // Step 2: Identify speakers in the corrected text
    const speakersResult = await identifySpeakers({ text: correctedResult.correctedTranscription });

    return { data: speakersResult.identifiedText, error: null };
  } catch (error) {
    console.error("Error processing media:", error);
    return { data: null, error: "Failed to process transcription. Please try again." };
  }
}
