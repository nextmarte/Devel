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

/**
 * Analisa padrões de fala para detectar quantos locutores há
 */
interface ConversationPatterns {
  possibleSpeakers: number;
  speakerIndicators: string[];
  conversationStyle: 'dialogue' | 'monologue' | 'mixed';
  wordCount: number;
}

function analyzeConversationPatterns(text: string): ConversationPatterns {
  // Análise de padrões: detectar indicadores de múltiplos locutores
  const patterns = [
    /\.[\s\n]+[A-Z]/g, // Ponto seguido de maiúscula = novo locutor provável
    /:\s+/g, // Dois-pontos = possível identificação
    /([A-Z][a-z]+):\s+/g, // "Nome: fala"
  ];
  
  const speakerIndicators = patterns
    .flatMap(p => text.match(p) || [])
    .filter((v, i, a) => a.indexOf(v) === i);
  
  // Contar linhas que começam com maiúscula (heurística)
  const lineStarts = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && /^[A-Z]/.test(l))
    .length;
  
  // Decidir quantidade de locutores baseado em heurísticas
  let possibleSpeakers = 0;
  if (speakerIndicators.length >= 3) {
    possibleSpeakers = Math.min(speakerIndicators.length, 5);
  } else if (lineStarts >= 5) {
    possibleSpeakers = Math.min(Math.ceil(lineStarts / 3), 4); // 1 locutor a cada ~3 linhas
  } else if (speakerIndicators.length > 0) {
    possibleSpeakers = 2;
  } else {
    possibleSpeakers = 1; // Monólogo detectado
  }
  
  const conversationStyle = text.includes(':') && text.split('\n').length > 3
    ? 'dialogue' 
    : text.includes(':') 
    ? 'mixed'
    : 'monologue';
  
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  
  return { 
    possibleSpeakers, 
    speakerIndicators, 
    conversationStyle,
    wordCount
  };
}

/**
 * Valida que nenhum conteúdo foi perdido na reorganização
 */
interface IntegrityResult {
  valid: boolean;
  integrityRatio: number;
  originalWordCount: number;
  identifiedWordCount: number;
  lostWords: number;
}

function validateContentIntegrity(original: string, identified: string): IntegrityResult {
  const originalWords = new Set(
    original
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3) // Apenas palavras significativas
  );
  
  const identifiedWords = new Set(
    identified
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
  );
  
  let lostWords = 0;
  originalWords.forEach(word => {
    if (!identifiedWords.has(word)) lostWords++;
  });
  
  const integrityRatio = originalWords.size > 0 
    ? (identifiedWords.size / originalWords.size) * 100 
    : 100;
  
  return {
    valid: integrityRatio > 95, // Aceitar máximo 5% de perda
    integrityRatio,
    originalWordCount: originalWords.size,
    identifiedWordCount: identifiedWords.size,
    lostWords,
  };
}

/**
 * Fallback: Marca locutores de forma simples sem reorganizar conteúdo
 * Preserva 100% do texto original
 */
function applySimpleSpeakerMarking(text: string): string {
  const lines = text.split('\n');
  let currentSpeaker = 1;
  const maxSpeakers = 3;
  let lastLineHadContent = false;
  
  return lines
    .map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.length === 0) return line; // Manter linhas vazias
      
      // Se já tem identificação de locutor, manter
      if (/^Locutor \d+:/i.test(trimmed)) return line;
      
      // Heurística: mudança de locutor quando há quebra + nova maiúscula
      if (lastLineHadContent && idx > 0 && trimmed.match(/^[A-Z]/) && !trimmed.match(/^(e |mais|também|então|bem|ok|sim|não)/i)) {
        currentSpeaker = (currentSpeaker % maxSpeakers) + 1;
      }
      
      lastLineHadContent = true;
      return `Locutor ${currentSpeaker}: ${line}`;
    })
    .join('\n');
}

const IdentifySpeakersOutputSchema = z.object({
  identifiedText: z
    .string()    
    .describe(
      'O texto transcrito com cada locutor identificado (e.g., Locutor 1: ... Locutor 2: ...).'
    ),
});
export type IdentifySpeakersOutput = z.infer<typeof IdentifySpeakersOutputSchema>;

export async function identifySpeakers(input: IdentifySpeakersInput): Promise<IdentifySpeakersOutput> {
  // NOVO: Análise prévia dos padrões de conversa
  const patterns = analyzeConversationPatterns(input.text);
  
  console.log(`[SPEAKERS] 🔍 Padrões detectados:`, {
    conversationStyle: patterns.conversationStyle,
    possibleSpeakers: patterns.possibleSpeakers,
    indicators: patterns.speakerIndicators.length,
    wordCount: patterns.wordCount,
  });
  
  const prompt = `Você é um especialista em transcrições de áudio e identificação de locutores.

CONTEXTO DETECTADO:
- Estilo de conversa: ${patterns.conversationStyle}
- Locutores estimados: ${patterns.possibleSpeakers}
- Total de palavras: ${patterns.wordCount}

REGRAS CRÍTICAS:
1. Um locutor é alguém que FALA e tem suas falas transcritas (com vírgula, dois-pontos, ou início de parágrafo indicando fala direta).
2. NÃO confunda nomes MENCIONADOS na conversa com locutores reais. Se um nome aparece apenas como referência (ex: "Aurélio", "Roberto Salles", "OpenAI"), NÃO é um locutor.
3. Identifique APENAS as pessoas que têm trechos de fala atribuídos a elas no texto.
4. Use o padrão: "Locutor 1: [fala]", "Locutor 2: [fala]", etc.
5. Se houver identificação de locutor já no texto, mantenha a identificação existente.
6. ⚠️ PRESERVAR 100% DO CONTEÚDO - Não deletar nenhuma palavra
7. ⚠️ Não reestruturar além do necessário - Manter ordem cronológica

DIFERENCIE ENTRE:
- LOCUTOR (quem fala): "Eu entendi, então..." 
- MENÇÃO (nome citado): "...o Roberto Salles respondeu..."

TAREFAS:
1. Detectar quantos locutores REALMENTE FALAM (pode ser 1, 2, 3, etc.)
2. Atribuir cada fala ao locutor correto
3. PRESERVAR 100% do texto original
4. Se houver só 1 locutor, retornar: "Locutor 1: [texto]"
5. Se houver múltiplos, reorganizar por locutor

Texto Original:
${input.text}

Responda APENAS com o texto reorganizado com locutores identificados, sem explicações ou markdown.`;

  console.log('[DEEPSEEK] 🎤 Identificando locutores');
  const startTime = Date.now();
  
  if (input.jobId) {
    globalProcessingTracker.addEventForJob(input.jobId, {
      stage: 'identifying',
      percentage: 50,
      message: `Enviando para Deepseek - Identificação de locutores (${patterns.conversationStyle}, ${patterns.possibleSpeakers} locutores)`,
      timestamp: Date.now(),
      details: {
        deepseekModel: 'deepseek-chat',
        promptLength: prompt.length,
      },
    });
  }

  let identifiedText = await generateWithDeepseek(prompt, { purpose: 'identify', maxChars: 14000 });
  const responseTime = Date.now() - startTime;

  console.log(`[DEEPSEEK] ✅ Identificação concluída em ${responseTime}ms`);
  console.log(`[DEEPSEEK] 📝 Resposta (primeiros 100 chars): ${identifiedText.substring(0, 100)}...`);
  
  // NOVO: Validar integridade do conteúdo
  const integrity = validateContentIntegrity(input.text, identifiedText);
  
  console.log(`[INTEGRITY] 📊 Validação:`, {
    integrityRatio: `${integrity.integrityRatio.toFixed(2)}%`,
    originalWords: integrity.originalWordCount,
    identifiedWords: integrity.identifiedWordCount,
    lostWords: integrity.lostWords,
    valid: integrity.valid,
  });
  
  let fallbackUsed = false;
  
  // Validar: se não tem locutores marcados OU perda significativa, usar fallback
  const hasSpeakerMarkers = /Locutor \d+:/i.test(identifiedText);
  const emptyResponse = identifiedText.trim().length === 0;
  const significantLoss = integrity.lostWords > Math.max(50, integrity.originalWordCount * 0.1);
  
  if (emptyResponse || !hasSpeakerMarkers) {
    console.warn(`[QUALITY] ⚠️ Resposta inválida - empty: ${emptyResponse}, markers: ${hasSpeakerMarkers}`);
    console.log(`[FALLBACK] 🔄 Aplicando fallback (resposta vazia ou sem marcadores)`);
    identifiedText = applySimpleSpeakerMarking(input.text);
    fallbackUsed = true;
  } else if (!integrity.valid && significantLoss) {
    console.warn(`[INTEGRITY] ⚠️ Possível perda de conteúdo significativa (${integrity.lostWords} palavras)`);
    console.log(`[FALLBACK] 🔄 Aplicando fallback (perda significativa)`);
    identifiedText = applySimpleSpeakerMarking(input.text);
    fallbackUsed = true;
  } else if (!integrity.valid) {
    console.warn(`[INTEGRITY] ⚠️ Possível perda de conteúdo (${integrity.lostWords} palavras, mas aceitável)`);
  } else {
    console.log(`[INTEGRITY] ✅ Conteúdo íntegro (${integrity.identifiedWordCount} palavras preservadas)`);
  }
  
  if (fallbackUsed) {
    const fallbackIntegrity = validateContentIntegrity(input.text, identifiedText);
    console.log(`[FALLBACK] ✅ Integridade após fallback: ${fallbackIntegrity.integrityRatio.toFixed(2)}%`);
  }
  
  if (input.jobId) {
    globalProcessingTracker.addEventForJob(input.jobId, {
      stage: 'deepseek_call',
      percentage: 65,
      message: `Identificação de locutores (${responseTime}ms) - Integridade: ${integrity.integrityRatio.toFixed(1)}% ${fallbackUsed ? '[FALLBACK]' : ''}`,
      timestamp: Date.now(),
      details: {
        deepseekModel: 'deepseek-chat',
        promptLength: prompt.length,
        responseTime,
      },
    });
  }

  return {
    identifiedText: identifiedText || '',
  };
}
