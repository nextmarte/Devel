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
      'O texto transcrito com cada locutor identificado (e.g., Locutor 1: ... Locutor 2: ...).'
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
  prompt: `Você é uma IA especialista em identificar locutores em textos transcritos. Analise o texto a seguir e identifique os diferentes locutores.  Identifique cada locutor de forma clara (ex: Locutor 1:, Locutor 2:, etc.).  Retorne o texto completo com as identificações dos locutores.

Texto: {{{text}}}`,
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
