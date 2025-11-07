'use server';

/**
 * @fileOverview Identifies and labels different speakers in a given text.
 *
 * - identifySpeakers - A function that takes transcribed text as input and returns the text with speakers identified.
 * - IdentifySpeakersInput - The input type for the identifySpeakers function.
 * - IdentifySpeakersOutput - The return type for the identifySpeakers function.
 */

import {generateWithDeepseek} from '@/ai/genkit';
import {z} from 'genkit';
import { globalProcessingTracker } from '@/lib/processing-tracker';

const IdentifySpeakersInputSchema = z.object({
  text: z.string().describe('The transcribed text to identify speakers in.'),
  jobId: z.string().optional().describe("ID do job para rastreamento"),
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
  const prompt = `Você é uma IA especialista em identificar locutores em textos transcritos de áudio. Sua tarefa é MUITO importante: identificar APENAS os locutores que realmente falam no áudio.

REGRAS CRÍTICAS:
1. Um locutor é alguém que FALA e tem suas falas transcritas (com vírgula, dois-pontos, ou início de parágrafo indicando fala direta).
2. NÃO confunda nomes MENCIONADOS na conversa com locutores reais. Se um nome aparece apenas como referência (ex: "Aurélio", "Roberto Salles", "OpenAI"), NÃO é um locutor.
3. Identifique APENAS as pessoas que têm trechos de fala atribuídos a elas no texto.
4. Use o padrão: "Locutor 1: [fala]", "Locutor 2: [fala]", etc.
5. Se houver identificação de locutor já no texto (ex: "Locutor 1:"), mantenha a identificação existente.
6. Diferencie entre:
   - LOCUTOR (quem fala): "Eu entendi, então..." 
   - MENÇÃO (nome citado): "...o Roberto Salles respondeu..."

ANALISE O TEXTO E:
- Identifique quantos locutores REALMENTE FALAM
- Mantenha as falas intactas
- Organize por locutor
- Retorne o texto COMPLETO reorganizado

Texto:
${input.text}

Responda APENAS com o texto reorganizado com locutores identificados, sem explicações ou markdown.`;

  console.log('[DEEPSEEK] 🎤 Identificando locutores');
  const startTime = Date.now();
  
  if (input.jobId) {
    globalProcessingTracker.addEventForJob(input.jobId, {
      stage: 'identifying',
      percentage: 50,
      message: 'Enviando para Deepseek - Identificação de locutores',
      timestamp: Date.now(),
      details: {
        deepseekModel: 'deepseek-chat',
        promptLength: prompt.length,
      },
    });
  }

  const identifiedText = await generateWithDeepseek(prompt);
  const responseTime = Date.now() - startTime;

  console.log(`[DEEPSEEK] ✅ Identificação concluída em ${responseTime}ms`);
  
  if (input.jobId) {
    globalProcessingTracker.logDeepseekCall(input.jobId, 'deepseek-chat', responseTime, 0);
  }

  return {
    identifiedText: identifiedText || '',
  };
}
