import {genkit} from 'genkit';
import deepseek, {deepseekChat, deepseekReasoner} from 'genkitx-deepseek';
import {OpenAI} from 'openai';
import { getDeepseekConfig, logTruncation } from '@/lib/deepseek-config';

export const ai = genkit({
  plugins: [deepseek({apiKey: process.env.DEEPSEEK_API_KEY})],
  model: deepseekChat, // Modelo padrão
});

export const deepseekModel = deepseekChat;
export const deepseekReasonerModel = deepseekReasoner;

// Direct Deepseek client for bypassing Genkit schema issues
const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

/**
 * Trunca texto mantendo a integridade de frases e contexto importante
 * OTIMIZAÇÃO: Reduz tamanho do prompt para economizar tokens SEM perder conteúdo crítico
 * 
 * @param text - Texto a ser truncado
 * @param maxChars - Máximo de caracteres permitidos (default: 16000)
 * @param purpose - Propósito do truncamento (summarize, identify, correct)
 * @returns Texto truncado na última frase completa com nota de truncamento
 */
export function truncateText(
  text: string,
  maxChars: number = 16000,
  purpose: 'summarize' | 'identify' | 'correct' = 'summarize'
): string {
  if (text.length <= maxChars) {
    return text;
  }

  // Diferentes limites por propósito para minimizar perda
  const purposeMaxChars: Record<string, number> = {
    'summarize': 16000,   // Sumário precisa de mais contexto
    'identify': 12000,    // Identificação de locutor menos sensível
    'correct': 14000,     // Correção precisa do contexto completo
  };

  const actualMaxChars = purposeMaxChars[purpose] || maxChars;

  if (text.length <= actualMaxChars) {
    return text;
  }

  // Se precisar truncar, encontrar última frase completa (terminada com . ! ou ?)
  const truncated = text.substring(0, actualMaxChars);
  
  // Procurar pelo último ponto, exclamação ou interrogação
  const lastPeriod = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );

  let result = truncated;
  let truncationPercentage = 0;

  if (lastPeriod > actualMaxChars * 0.7) {
    // Se o ponto está nos últimos 30%, usar ele
    result = truncated.substring(0, lastPeriod + 1);
    truncationPercentage = ((text.length - result.length) / text.length) * 100;
  } else {
    // Caso contrário, truncar no limite + aviso
    truncationPercentage = ((text.length - truncated.length) / text.length) * 100;
    result = truncated + '\n\n[... conteúdo truncado ...]';
  }

  // Log detalhado de truncamento
  logTruncation(text.length, result.length, purpose);

  return result;
}

// Wrapper function to call Deepseek API directly
export async function generateWithDeepseek(
  prompt: string,
  options?: { purpose?: 'summarize' | 'identify' | 'correct'; maxChars?: number }
): Promise<string> {
  try {
    // OTIMIZAÇÃO: Truncar prompt se muito grande (economizar tokens)
    const purpose = options?.purpose || 'summarize';
    const config = getDeepseekConfig(purpose);
    const maxPromptChars = options?.maxChars || config.maxChars;
    
    const truncatedPrompt = truncateText(prompt, maxPromptChars, purpose);

    const response = await deepseekClient.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: truncatedPrompt,
        },
      ],
    });

    // Extract text from the response
    const firstChoice = response.choices[0];
    if (firstChoice && 'message' in firstChoice && firstChoice.message) {
      return firstChoice.message.content || '';
    }

    return '';
  } catch (error) {
    console.error('Error calling Deepseek:', error);
    throw error;
  }
}
