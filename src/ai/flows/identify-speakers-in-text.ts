'use server';

/**
 * @fileOverview Identifies and labels different speakers in a given text.
 *
 * - identifySpeakers - A function that takes transcribed text as input and returns the text with speakers identified.
 * - IdentifySpeakersInput - The input type for the identifySpeakers function.
 * - IdentifySpeakersOutput - The return type for the identifySpeakers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifySpeakersInputSchema = z.object({
  text: z.string().describe('The transcribed text to identify speakers in.'),
});
export type IdentifySpeakersInput = z.infer<typeof IdentifySpeakersInputSchema>;

const IdentifySpeakersOutputSchema = z.object({
  identifiedText: z
    .string()    
    .describe(
      'The transcribed text with each identified speaker labeled (e.g., Speaker 1: ... Speaker 2: ...).'
    ),
});
export type IdentifySpeakersOutput = z.infer<typeof IdentifySpeakersOutputSchema>;

export async function identifySpeakers(input: IdentifySpeakersInput): Promise<IdentifySpeakersOutput> {
  return identifySpeakersFlow(input);
}

const identifySpeakersPrompt = ai.definePrompt({
  name: 'identifySpeakersPrompt',
  input: {schema: IdentifySpeakersInputSchema},
  output: {schema: IdentifySpeakersOutputSchema},
  prompt: `You are an AI expert in identifying speakers in transcribed text. Analyze the following text and identify the different speakers.  Label each speaker clearly (e.g., Speaker 1:, Speaker 2:, etc.).  Return the full text with speaker labels.

Text: {{{text}}}`,
});

const identifySpeakersFlow = ai.defineFlow(
  {
    name: 'identifySpeakersFlow',
    inputSchema: IdentifySpeakersInputSchema,
    outputSchema: IdentifySpeakersOutputSchema,
  },
  async input => {
    const {output} = await identifySpeakersPrompt(input);
    return output!;
  }
);
