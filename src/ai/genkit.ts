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

// Wrapper function to call Deepseek API directly
export async function generateWithDeepseek(prompt: string): Promise<string> {
  try {
    const response = await deepseekClient.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
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
