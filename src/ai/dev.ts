import { config } from 'dotenv';
config();

import '@/ai/flows/correct-transcription-errors.ts';
import '@/ai/flows/identify-speakers-in-text.ts';
import '@/ai/flows/summarize-text.ts';
