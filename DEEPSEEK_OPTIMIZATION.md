# 🚀 Estratégias de Otimização - Deepseek

## 📊 Problemas Identificados

1. **Execução Sequencial dos Flows**
   - Correção → Identificação → Sumário (um por um)
   - Esperando cada chamada terminar antes de iniciar a próxima
   - Tempo total = soma de todos os tempos

2. **Prompts Muito Grandes**
   - Textos completos sendo enviados para cada flow
   - Deepseek cobra por tokens → mais tokens = mais caro e lento

3. **Sem Cache/Memoização**
   - Mesmos prompts são reprocessados
   - Sem reutilização de resultados

4. **Modelo Padrão Pode Não Ser Ótimo**
   - Usando `deepseek-chat` para tudo
   - Não aproveitando `deepseek-reasoner` quando necessário

## ✅ Soluções Propostas

### 1. **Executar Flows em Paralelo** ⚡ (Impacto: Alto - 60-70% mais rápido)

```typescript
// ❌ ANTES (sequencial)
const correctedResult = await correctTranscriptionErrors({...});
const speakersResult = await identifySpeakers({...});
const summaryResult = await summarizeText({...});

// ✅ DEPOIS (paralelo)
const [correctedResult, speakersResult, summaryResult] = await Promise.all([
  correctTranscriptionErrors({...}),
  identifySpeakers({...}),
  summarizeText({...})
]);
```

**Implementação**: Arquivo `src/app/api/jobs/[jobId]/route.ts` - função `processFlowsServer`

---

### 2. **Implementar Cache em Redis** 💾 (Impacto: Médio - 90% mais rápido para repeats)

```typescript
// Exemplo de chave de cache
const cacheKey = `deepseek:${hashOfPrompt}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

const result = await generateWithDeepseek(prompt);
await redis.set(cacheKey, result, { ex: 3600 }); // 1 hora
return result;
```

**Benefícios**:
- Prompts idênticos não precisam ir ao Deepseek
- Redis na memória (muito rápido)

---

### 3. **Resumir Texto Antes de Processar** 📝 (Impacto: Alto - 50% menos tokens)

```typescript
// Antes: 100.000 caracteres
// Depois: Extrair apenas key sentences (~20.000 caracteres)

const summaryForProcessing = await extractKeySentences(rawTranscription);
// Usar summaryForProcessing nos flows em vez do texto completo
```

**Como fazer**:
- Usar regex para extrair frases principais
- Ou chamar Deepseek com `max_tokens: 2000` para pré-resumir

---

### 4. **Usar Modelo Mais Rápido** ⚡ (Impacto: Médio - 2-3x mais rápido)

```typescript
// Deepseek tem diferentes modelos:
// - deepseek-chat (mais rápido, bom custo-benefício)
// - deepseek-reasoner (mais lento, mais preciso - use só quando necessário)

// Para correção e identificação: use chat
// Para sumário complexo: considere reasoner
```

**Estratégia**:
- Correction: `deepseek-chat` (rápido)
- Identify Speakers: `deepseek-chat` (rápido)
- Summary: Depende da complexidade - testar ambos

---

### 5. **Batch Prompts** 📦 (Impacto: Médio - 30% mais rápido + barato)

```typescript
// ❌ ANTES - 3 chamadas
await generateWithDeepseek("Corrigir: " + text);
await generateWithDeepseek("Identificar speakers: " + text);
await generateWithDeepseek("Summarizar: " + text);

// ✅ DEPOIS - 1 chamada
const batchPrompt = `
[TAREFA 1] Corrigir: ${text}
---
[TAREFA 2] Identificar speakers: ${text}
---
[TAREFA 3] Summarizar: ${text}
`;
const result = await generateWithDeepseek(batchPrompt);
// Parse result para extrair as 3 respostas
```

**Vantagens**:
- 1 chamada em vez de 3 = 3x mais rápido (overhead de rede)
- Setup de contexto único
- Mais barato

---

### 6. **Adicionar Timeout e Fallback** ⏱️ (Impacto: Segurança)

```typescript
async function generateWithDeepseekTimeout(
  prompt: string, 
  timeoutMs: number = 30000
): Promise<string> {
  return Promise.race([
    generateWithDeepseek(prompt),
    new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ]);
}
```

---

### 7. **Truncar/Resumir Automaticamente** ✂️ (Impacto: Alto - 80% menos tokens para textos grandes)

```typescript
function truncateText(text: string, maxChars: number = 5000): string {
  if (text.length <= maxChars) return text;
  
  // Encontrar última frase completa antes do limite
  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  return text.substring(0, lastPeriod + 1);
}

// Usar em todos os flows
const truncatedText = truncateText(input.text, 5000);
```

---

## 🎯 Plano de Implementação (Priorizado)

### Fase 1: Rápida (30 min) - Impacto: 60-70% mais rápido
- [ ] **Executar flows em paralelo** (máximo impacto + fácil)
- Arquivo: `src/app/api/jobs/[jobId]/route.ts`
- Mudança: Usar `Promise.all()` em `processFlowsServer()`

### Fase 2: Média (1-2 horas) - Impacto: 50% menos tokens
- [ ] **Truncar textos automaticamente**
- Arquivo: `src/ai/genkit.ts` + flows
- Mudança: Adicionar função `truncateText()` e usar antes de chamar Deepseek

### Fase 3: Longa (2-3 horas) - Impacto: 90% para repeats
- [ ] **Implementar Redis cache**
- Arquivo: Novo `src/lib/deepseek-cache.ts`
- Dependência: Redis rodando em Docker

### Fase 4: Otimização (opcional) - Impacto: 30% mais rápido
- [ ] **Batch prompts**
- Arquivo: Novo `src/lib/deepseek-batch.ts`
- Complexidade: Média (parsing de resultados)

---

## 📈 Benchmarks Esperados

| Estratégia | Tempo Antes | Tempo Depois | Redução | Investimento |
|-----------|------------|-------------|---------|--------------|
| Paralelo | 30s | 10s | 67% | 30 min |
| Truncar | 10s | 5s | 50% | 1h |
| Redis Cache | 5s (repeat) | 0.5s | 90% | 2h |
| Batch | 10s | 7s | 30% | 2h |
| **TOTAL** | **30s** | **~5s** | **~85%** | **5-6h** |

---

## 🔧 Código Base para Começar

### Opção 1: Paralelo (Recomendado para começar)

```typescript
// Em src/app/api/jobs/[jobId]/route.ts

async function processFlowsServer(jobId: string, rawTranscription: string, generateSummary: boolean = false) {
  try {
    console.log(`[FLOWS-SERVER] 🚀 Iniciando processamento paralelo...`);
    const startTime = Date.now();
    
    // Preparar promises
    const flowPromises = [
      correctTranscriptionErrors({
        transcription: rawTranscription,
        jobId,
      }),
      identifySpeakers({
        text: rawTranscription,
        jobId,
      })
    ];
    
    if (generateSummary) {
      flowPromises.push(
        summarizeText({
          text: rawTranscription,
          jobId,
        })
      );
    }
    
    // Executar tudo em paralelo
    const [correctedResult, speakersResult, summaryResult] = await Promise.all(flowPromises);
    
    const elapsed = Date.now() - startTime;
    console.log(`[FLOWS-SERVER] ✅ Processamento paralelo completado em ${elapsed}ms`);
    
    return {
      correctedTranscription: correctedResult?.correctedTranscription || rawTranscription,
      identifiedTranscription: speakersResult?.identifiedText || rawTranscription,
      summary: summaryResult?.summary || null,
    };
  } catch (error: any) {
    console.error(`[FLOWS-SERVER] ❌ Erro:`, error);
    return null;
  }
}
```

### Opção 2: Truncar Texto

```typescript
// Em src/ai/genkit.ts

export function truncateText(text: string, maxChars: number = 5000): string {
  if (text.length <= maxChars) return text;
  
  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  return text.substring(0, lastPeriod + 1) || truncated;
}

export async function generateWithDeepseek(prompt: string): Promise<string> {
  try {
    // Truncar prompt se muito grande
    const truncatedPrompt = truncateText(prompt, 8000);
    
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
```

---

## ⚙️ Configurações Recomendadas

```env
# .env.local

# Limites de texto
DEEPSEEK_MAX_PROMPT_CHARS=5000
DEEPSEEK_MAX_TOKENS=4000

# Timeout
DEEPSEEK_TIMEOUT_MS=30000

# Cache (se implementar)
REDIS_URL=redis://localhost:6379

# Modelo
DEEPSEEK_MODEL=deepseek-chat
```

---

## 📊 Monitoramento

Adicionar métricas nos logs:

```typescript
const startTime = Date.now();
const result = await generateWithDeepseek(prompt);
const duration = Date.now() - startTime;

console.log(`[DEEPSEEK-METRICS]`, {
  duration,
  promptLength: prompt.length,
  model: 'deepseek-chat',
  stage: 'correcting',
  timestamp: new Date().toISOString(),
});
```

---

## 🎓 Recursos

- [Deepseek API Docs](https://api-docs.deepseek.com/)
- [OpenAI Batch API](https://platform.openai.com/docs/guides/batch-processing)
- [Redis for Node.js](https://github.com/redis/node-redis)

---

**Status**: 📋 Documento de Otimização Completo - Pronto para Implementação
