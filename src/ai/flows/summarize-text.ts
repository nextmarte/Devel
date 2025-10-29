'use server';
/**
 * @fileOverview Generates a summary or meeting minutes from a given text.
 *
 * - summarizeText - A function that takes text as input and returns a structured summary.
 * - SummarizeTextInput - The input type for the summarizeText function.
 * - SummarizeTextOutput - The return type for the summarizeText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTextInputSchema = z.object({
  text: z
    .string()
    .describe(
      'The transcribed text from which to generate a summary or meeting minutes.'
    ),
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
  return summarizeTextFlow(input);
}

const summarizeTextPrompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: {schema: SummarizeTextInputSchema},
  output: {schema: SummarizeTextOutputSchema},
  prompt: `Você é um especialista em criar atas de reunião e resumos detalhados a partir de transcrições de áudio. Sua tarefa é analisar o texto a seguir, que é uma transcrição de uma reunião, e gerar uma ata concisa e bem estruturada em formato Markdown.

A ata deve incluir:
- **Título da Reunião:** Um título breve e descritivo.
- **Participantes:** Liste os "Locutores" como participantes. Se os nomes não estiverem disponíveis, use "Participante 1", "Participante 2", etc.
- **Pauta:** Os principais tópicos discutidos.
- **Decisões e Ações:** Liste as principais decisões tomadas e as ações a serem realizadas, incluindo os responsáveis (se mencionado).
- **Resumo:** Um parágrafo resumindo os pontos mais importantes da discussão.

Use formatação Markdown (negrito, itálico, listas) para tornar a ata clara e legível.

Texto da Transcrição:
{{{text}}}
`,
});

const summarizeTextFlow = ai.defineFlow(
  {
    name: 'summarizeTextFlow',
    inputSchema: SummarizeTextInputSchema,
    outputSchema: SummarizeTextOutputSchema,
  },
  async input => {
    const {output} = await summarizeTextPrompt(input);
    return output!;
  }
);
