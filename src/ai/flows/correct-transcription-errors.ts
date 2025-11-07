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
import { globalProcessingTracker } from '@/lib/processing-tracker';

const CorrectTranscriptionErrorsInputSchema = z.object({
  transcription: z
    .string()
    .describe("The transcribed text that needs to be corrected for grammar and contextual errors."),
  jobId: z.string().optional().describe("ID do job para rastreamento"),
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

  // Log de início da chamada
  console.log('[DEEPSEEK] 🚀 Iniciando correção de transcrição');
  const startTime = Date.now();
  
  if (input.jobId) {
    globalProcessingTracker.addEventForJob(input.jobId, {
      stage: 'correcting',
      percentage: 30,
      message: 'Enviando para Deepseek - Correção de erros',
      timestamp: Date.now(),
      details: {
        deepseekModel: 'deepseek-chat',
        promptLength: prompt.length,
      },
    });
  }

  const correctedTranscription = await generateWithDeepseek(prompt);
  const responseTime = Date.now() - startTime;

  // Log de conclusão
  console.log(`[DEEPSEEK] ✅ Correção concluída em ${responseTime}ms`);
  
  if (input.jobId) {
    globalProcessingTracker.logDeepseekCall(input.jobId, 'deepseek-chat', responseTime, 0);
  }

  return {
    correctedTranscription: correctedTranscription || '',
  };
}
