/**
 * Configuração de limites de tokens por propósito
 * Balanceia entre economia de tokens e qualidade/fidelidade do conteúdo
 */

export const DEEPSEEK_CONFIG = {
  // Limites padrão por propósito (em caracteres)
  // Regra: ~1 char ≈ 0.25 tokens (token count = chars / 4)
  limits: {
    summarize: {
      maxChars: 20000,  // ~5000 tokens - precisa de contexto completo
      description: 'Resumo/Ata de reunião',
    },
    correct: {
      maxChars: 18000,  // ~4500 tokens - precisa entender contexto
      description: 'Correção de transcrição',
    },
    identify: {
      maxChars: 14000,  // ~3500 tokens - menos sensível a contexto completo
      description: 'Identificação de locutores',
    },
    default: {
      maxChars: 16000,  // ~4000 tokens
      description: 'Padrão',
    },
  },

  // Alertas de perda de conteúdo
  alerts: {
    warningThreshold: 10,  // Avisar se perda > 10%
    criticalThreshold: 20, // Erro se perda > 20%
  },

  // Modo de dados sensíveis (não truncar agressivamente)
  sensitiveMode: {
    enabled: false, // Pode ser ativado por env var
    maxChars: 32000, // Muito maior para não perder contexto
  },
};

/**
 * Retorna configuração para um propósito específico
 */
export function getDeepseekConfig(purpose?: 'summarize' | 'identify' | 'correct') {
  const purpose_ = purpose || 'default';
  const config = DEEPSEEK_CONFIG.limits[purpose_] || DEEPSEEK_CONFIG.limits.default;
  
  // Se modo sensitivo habilitado, usar limite maior
  if (DEEPSEEK_CONFIG.sensitiveMode.enabled) {
    return {
      ...config,
      maxChars: DEEPSEEK_CONFIG.sensitiveMode.maxChars,
    };
  }

  // Se env var DEEPSEEK_NO_TRUNCATE=true, não truncar
  if (process.env.DEEPSEEK_NO_TRUNCATE === 'true') {
    return {
      ...config,
      maxChars: 999999,
    };
  }

  return config;
}

/**
 * Log estruturado de truncamento
 */
export function logTruncation(
  originalSize: number,
  truncatedSize: number,
  purpose: string
) {
  const percentageLost = ((originalSize - truncatedSize) / originalSize) * 100;
  const config = DEEPSEEK_CONFIG.alerts;

  if (percentageLost > config.criticalThreshold) {
    console.error(
      `[DEEPSEEK-OPT] 🔴 CRÍTICO: ${percentageLost.toFixed(1)}% de conteúdo perdido (${purpose})`
    );
  } else if (percentageLost > config.warningThreshold) {
    console.warn(
      `[DEEPSEEK-OPT] ⚠️ AVISO: ${percentageLost.toFixed(1)}% de conteúdo perdido (${purpose})`
    );
  } else if (percentageLost > 0) {
    console.log(
      `[DEEPSEEK-OPT] ✂️ Truncamento: ${percentageLost.toFixed(1)}% (${originalSize} → ${truncatedSize} chars) [${purpose}]`
    );
  }
}
