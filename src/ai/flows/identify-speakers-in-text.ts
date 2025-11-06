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

  const identifiedText = await generateWithDeepseek(prompt);

  return {
    identifiedText: identifiedText || '',
  };
}
