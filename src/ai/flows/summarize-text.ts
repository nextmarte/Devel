'use server';
/**
 * @fileOverview Generates a summary or meeting minutes from a given text.
 *
 * - summarizeText - A function that takes text as input and returns a structured summary.
 * - SummarizeTextInput - The input type for the summarizeText function.
 * - SummarizeTextOutput - The return type for the summarizeText function.
 */

import {generateWithDeepseek} from '@/ai/genkit';
import {z} from 'genkit';
import { globalProcessingTracker } from '@/lib/processing-tracker';

const SummarizeTextInputSchema = z.object({
  text: z
    .string()
    .describe(
      'The transcribed text from which to generate a summary or meeting minutes.'
    ),
  jobId: z.string().optional().describe("ID do job para rastreamento"),
});
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

const SummarizeTextOutputSchema = z.object({
  summary: z
    .string()
    .describe('The generated summary or meeting minutes in Markdown format.'),
});
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

export async function summarizeText(
  input: SummarizeTextInput
): Promise<SummarizeTextOutput> {
  const prompt = `Você é um especialista em criar atas de reunião e resumos detalhados a partir de transcrições de áudio. Sua tarefa é analisar o texto a seguir, que é uma transcrição de uma reunião, e gerar uma ata concisa e bem estruturada em formato Markdown.

A ata deve incluir:
- **Título da Reunião:** Um título breve e descritivo.
- **Participantes:** Liste os "Locutores" como participantes. Se os nomes não estiverem disponíveis, use "Participante 1", "Participante 2", etc.
- **Pauta:** Os principais tópicos discutidos.
- **Decisões e Ações:** Liste as principais decisões tomadas e as ações a serem realizadas, incluindo os responsáveis (se mencionado).
- **Resumo:** Um parágrafo resumindo os pontos mais importantes da discussão.

Use formatação Markdown (negrito, itálico, listas) para tornar a ata clara e legível.

Texto da Transcrição:
${input.text}

Responda APENAS com a ata em Markdown, sem explicações ou marcadores de código.`;

  console.log('[DEEPSEEK] 📝 Gerando resumo/ata');
  const startTime = Date.now();
  
  if (input.jobId) {
    globalProcessingTracker.addEventForJob(input.jobId, {
      stage: 'summarizing',
      percentage: 70,
      message: 'Enviando para Deepseek - Geração de resumo',
      timestamp: Date.now(),
      details: {
        deepseekModel: 'deepseek-chat',
        promptLength: prompt.length,
      },
    });
  }

  const summary = await generateWithDeepseek(prompt, { purpose: 'summarize', maxChars: 20000 });
  const responseTime = Date.now() - startTime;

  console.log(`[DEEPSEEK] ✅ Resumo gerado em ${responseTime}ms`);
  
  if (input.jobId) {
    globalProcessingTracker.logDeepseekCall(input.jobId, 'deepseek-chat', responseTime, 0);
  }

  return {
    summary: summary || '',
  };
}
