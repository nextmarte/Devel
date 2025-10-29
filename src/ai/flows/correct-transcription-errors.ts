'use server';
/**
 * @fileOverview AI-powered grammar and contextual error correction for transcribed text.
 *
 * - correctTranscriptionErrors - A function that accepts transcribed text and returns corrected text.
 * - CorrectTranscriptionErrorsInput - The input type for the correctTranscriptionErrors function.
 * - CorrectTranscriptionErrorsOutput - The return type for the correctTranscriptionErrors function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectTranscriptionErrorsInputSchema = z.object({
  transcription: z
    .string()
    .describe("The transcribed text that needs to be corrected for grammar and contextual errors."),
});
export type CorrectTranscriptionErrorsInput = z.infer<
  typeof CorrectTranscriptionErrorsInputSchema
>;

const CorrectTranscriptionErrorsOutputSchema = z.object({
  correctedTranscription: z
    .string()
    .describe("The transcribed text, corrected for grammar and contextual errors."),
});
export type CorrectTranscriptionErrorsOutput = z.infer<
  typeof CorrectTranscriptionErrorsOutputSchema
>;

export async function correctTranscriptionErrors(
  input: CorrectTranscriptionErrorsInput
): Promise<CorrectTranscriptionErrorsOutput> {
  return correctTranscriptionErrorsFlow(input);
}

const correctTranscriptionErrorsPrompt = ai.definePrompt({
  name: 'correctTranscriptionErrorsPrompt',
  input: {schema: CorrectTranscriptionErrorsInputSchema},
  output: {schema: CorrectTranscriptionErrorsOutputSchema},
  prompt: `You are an AI expert in grammar and contextual correction.

You will receive a transcribed text and you will correct any grammatical or contextual errors in it.

Transcription: {{{transcription}}}

Corrected Transcription:`,
});

const correctTranscriptionErrorsFlow = ai.defineFlow(
  {
    name: 'correctTranscriptionErrorsFlow',
    inputSchema: CorrectTranscriptionErrorsInputSchema,
    outputSchema: CorrectTranscriptionErrorsOutputSchema,
  },
  async input => {
    const {output} = await correctTranscriptionErrorsPrompt(input);
    return output!;
  }
);
