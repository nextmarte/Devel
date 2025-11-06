import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {OpenAI} from 'openai';

// Configurar Deepseek via OpenAI API (compatible)
const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-pro', // Modelo padrão (será sobrescrito em cada chamada)
});

// Modelo primário: Deepseek
export const deepseekModel = deepseekClient;
export const geminiModel = 'googleai/gemini-2.5-pro';

export async function withFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<T>
): Promise<T> {
  try {
    return await primaryFn();
  } catch (error) {
    console.warn('Deepseek failed, falling back to Gemini:', error);
    return await fallbackFn();
  }
}
