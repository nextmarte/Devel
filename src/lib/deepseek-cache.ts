/**
 * Sistema de Cache para Deepseek
 * OTIMIZAÇÃO: Evita reprocessar prompts idênticos
 * 
 * Redução esperada: 90% para requisições repetidas
 * 
 * Uso:
 * 1. Instalar: npm install redis
 * 2. Docker: docker run -d -p 6379:6379 redis:latest
 * 3. Configurar: REDIS_URL=redis://localhost:6379
 */

import crypto from 'crypto';

interface CacheEntry {
  result: string;
  timestamp: number;
  promptHash: string;
  promptLength: number;
}

/**
 * Gera hash SHA-256 do prompt para usar como chave
 */
function generatePromptHash(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16);
}

/**
 * Cache em memória (fallback se Redis não estiver disponível)
 */
class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 100;

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Verificar TTL (1 hora)
    if (Date.now() - entry.timestamp > 3600000) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  set(key: string, result: string, promptHash: string, promptLength: number): void {
    // Limpar cache se ficar muito grande
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      promptHash,
      promptLength,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Sistema de cache para Deepseek com suporte a Redis
 */
class DeepseekCache {
  private memoryCache = new MemoryCache();
  private redisClient: any = null;
  private redisAvailable: boolean = false;

  constructor() {
    this.initializeRedis();
  }

  /**
   * Inicializa cliente Redis se disponível
   */
  private async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        console.log('[CACHE] 📝 Redis não configurado, usando cache em memória');
        return;
      }

      // Dinâmico para não quebrar em ambientes sem redis
      const redis = require('redis');
      this.redisClient = redis.createClient({ url: redisUrl });

      this.redisClient.on('error', (err: any) => {
        console.warn('[CACHE] ⚠️ Erro no Redis:', err.message);
        this.redisAvailable = false;
      });

      this.redisClient.on('connect', () => {
        console.log('[CACHE] ✅ Redis conectado');
        this.redisAvailable = true;
      });

      await this.redisClient.connect();
    } catch (error) {
      console.warn('[CACHE] ℹ️ Redis não disponível:', (error as any).message);
    }
  }

  /**
   * Obtém resultado em cache
   */
  async get(prompt: string): Promise<string | null> {
    const promptHash = generatePromptHash(prompt);
    const cacheKey = `deepseek:${promptHash}`;

    console.log(`[CACHE] 🔍 Procurando cache para prompt (hash: ${promptHash})`);

    // Tentar Redis primeiro
    if (this.redisAvailable && this.redisClient) {
      try {
        const cachedResult = await this.redisClient.get(cacheKey);
        if (cachedResult) {
          console.log(`[CACHE] ✅ Encontrado em Redis! (economizou chamada ao Deepseek)`);
          return cachedResult;
        }
      } catch (error) {
        console.warn('[CACHE] ⚠️ Erro ao acessar Redis:', (error as any).message);
      }
    }

    // Fallback para memória
    const memResult = this.memoryCache.get(cacheKey);
    if (memResult) {
      console.log(`[CACHE] ✅ Encontrado em memória! (economizou chamada ao Deepseek)`);
      return memResult;
    }

    return null;
  }

  /**
   * Armazena resultado em cache
   */
  async set(prompt: string, result: string): Promise<void> {
    const promptHash = generatePromptHash(prompt);
    const cacheKey = `deepseek:${promptHash}`;

    console.log(`[CACHE] 💾 Armazenando em cache (hash: ${promptHash}, ${result.length} chars)`);

    // Armazenar em memória (sempre)
    this.memoryCache.set(cacheKey, result, promptHash, prompt.length);

    // Tentar Redis
    if (this.redisAvailable && this.redisClient) {
      try {
        // TTL de 1 hora (3600 segundos)
        await this.redisClient.setEx(cacheKey, 3600, result);
        console.log(`[CACHE] ✅ Armazenado em Redis`);
      } catch (error) {
        console.warn('[CACHE] ⚠️ Erro ao armazenar em Redis:', (error as any).message);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    console.log('[CACHE] 🧹 Limpando cache');
    this.memoryCache.clear();

    if (this.redisAvailable && this.redisClient) {
      try {
        await this.redisClient.flushDb();
        console.log('[CACHE] ✅ Redis cache limpo');
      } catch (error) {
        console.warn('[CACHE] ⚠️ Erro ao limpar Redis:', (error as any).message);
      }
    }
  }

  /**
   * Obtém estatísticas de cache
   */
  getStats() {
    return {
      memorySize: this.memoryCache.size(),
      redisAvailable: this.redisAvailable,
      timestamp: new Date().toISOString(),
    };
  }
}

// Singleton global
export const deepseekCache = new DeepseekCache();

/**
 * Wrapper para usar cache com Deepseek
 */
export async function generateWithDeepseekCached(
  generateFn: (prompt: string) => Promise<string>,
  prompt: string
): Promise<string> {
  // Verificar cache
  const cached = await deepseekCache.get(prompt);
  if (cached) {
    return cached;
  }

  // Gerar novo resultado
  console.log('[CACHE] 🌐 Cache miss, chamando Deepseek...');
  const result = await generateFn(prompt);

  // Armazenar em cache
  await deepseekCache.set(prompt, result);

  return result;
}
