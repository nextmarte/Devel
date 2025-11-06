'use server';
/**
 * @fileOverview AI-powered grammar and contextual error correction for transcribed text.
 *
 * - correctTranscriptionErrors - A function that accepts transcribed text and returns corrected text.
 * - CorrectTranscriptionErrorsInput - The input type for the correctTranscriptionErrors function.
 * - CorrectTranscriptionErrorsOutput - The return type for the correctTranscriptionErrors function.
 */

import {generateWithDeepseek} from '@/ai/genkit';
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
  const prompt = `Você é um especialista em correção de transcrições de áudio em português brasileiro.

TAREFAS:
1. Corrigir erros gramaticais e de digitação
2. Corrigir nomes próprios e termos técnicos com base no contexto
3. Melhorar a pontuação para melhor legibilidade
4. Manter o tom e estilo original do falante
5. Preservar termos técnicos e nomes específicos já corretos
6. Ajustar informações contraditórias baseado em contexto

REGRAS IMPORTANTES:
- Não mude o significado ou conteúdo da fala
- Se houver dúvida sobre uma correção, mantenha o original
- Melhore a fluidez sem ser invasivo
- Preserve gírias e expressões coloquiais quando forem propositais
- Corrija apenas o necessário para entendimento claro

Transcrição Original:
${input.transcription}

Responda APENAS com o texto corrigido, sem explicações ou markdown.`;

  const correctedTranscription = await generateWithDeepseek(prompt);

  return {
    correctedTranscription: correctedTranscription || '',
  };
}
