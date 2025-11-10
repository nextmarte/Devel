import {genkit} from 'genkit';
import deepseek, {deepseekChat, deepseekReasoner} from 'genkitx-deepseek';
import {OpenAI} from 'openai';

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
 * Trunca texto mantendo a integridade de frases
 * OTIMIZAÇÃO: Reduz tamanho do prompt para economizar tokens
 * 
 * @param text - Texto a ser truncado
 * @param maxChars - Máximo de caracteres permitidos (default: 8000)
 * @returns Texto truncado na última frase completa
 */
export function truncateText(text: string, maxChars: number = 8000): string {
  if (text.length <= maxChars) {
    return text;
  }

  // Se precisar truncar, encontrar última frase completa (terminada com . ! ou ?)
  const truncated = text.substring(0, maxChars);
  
  // Procurar pelo último ponto, exclamação ou interrogação
  const lastPeriod = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );

  if (lastPeriod > maxChars * 0.7) {
    // Se o ponto está nos últimos 30%, usar ele
    return truncated.substring(0, lastPeriod + 1);
  } else {
    // Caso contrário, apenas truncar
    return truncated;
  }
}

// Wrapper function to call Deepseek API directly
export async function generateWithDeepseek(prompt: string): Promise<string> {
  try {
    // OTIMIZAÇÃO: Truncar prompt se muito grande (economizar tokens)
    const maxPromptChars = parseInt(process.env.DEEPSEEK_MAX_PROMPT_CHARS || '8000');
    const truncatedPrompt = truncateText(prompt, maxPromptChars);
    
    const wasPromptTruncated = truncatedPrompt.length < prompt.length;
    if (wasPromptTruncated) {
      console.log(`[DEEPSEEK-OPT] ✂️ Prompt truncado: ${prompt.length} → ${truncatedPrompt.length} chars (economizou ${prompt.length - truncatedPrompt.length} chars)`);
    }

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
