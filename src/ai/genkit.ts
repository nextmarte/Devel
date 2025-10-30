import {genkit} from 'genkit';
import deepseek, {deepseekChat} from 'genkitx-deepseek';

if (!process.env.DEEPSEEK_API_KEY) {
  throw new Error('DEEPSEEK_API_KEY environment variable is required');
}

export const ai = genkit({
  plugins: [deepseek({apiKey: process.env.DEEPSEEK_API_KEY})],
  model: deepseekChat,
});
