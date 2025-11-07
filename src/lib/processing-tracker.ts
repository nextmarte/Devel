/**
 * Sistema de tracking para processamento assíncrono
 * Rastreia etapas de processamento e chamadas à API Deepseek
 */

import { ProcessingEvent, ProcessingStage } from './transcription-types';

export interface ProcessingTracker {
  addEvent(stage: ProcessingStage, percentage: number, message: string, details?: any): void;
  getEvents(): ProcessingEvent[];
  clear(): void;
  logDeepseekCall(model: string, promptLength: number, responseTime: number, tokenCount?: number): void;
}

/**
 * Cria um tracker de processamento para uso em Server Actions
 */
export function createProcessingTracker(): ProcessingTracker {
  const events: ProcessingEvent[] = [];

  return {
    addEvent(stage: ProcessingStage, percentage: number, message: string, details?: any) {
      const event: ProcessingEvent = {
        stage,
        percentage,
        message,
        timestamp: Date.now(),
        details,
      };
      events.push(event);
      console.log(`[PROGRESS] ${stage}: ${message}`, details ? JSON.stringify(details) : '');
    },

    getEvents(): ProcessingEvent[] {
      return events;
    },

    clear() {
      events.length = 0;
    },

    logDeepseekCall(model: string, promptLength: number, responseTime: number, tokenCount?: number) {
      this.addEvent(
        'deepseek_call',
        50, // Percentage placeholder, será ajustado conforme contexto
        `Chamada ao Deepseek (${model})`,
        {
          deepseekModel: model,
          promptLength,
          responseTime,
          tokenCount,
        }
      );
    },
  };
}

/**
 * Sistema global para rastrear eventos de processamento
 * Usado para comunicar progresso para o frontend
 */
class GlobalProcessingTracker {
  private trackers: Map<string, ProcessingEvent[]> = new Map();

  addEventForJob(jobId: string, event: ProcessingEvent) {
    if (!this.trackers.has(jobId)) {
      this.trackers.set(jobId, []);
      console.log(`[TRACKER] ✨ Nova lista de eventos criada para jobId: ${jobId}`);
    }
    this.trackers.get(jobId)!.push(event);
    const totalEvents = this.trackers.get(jobId)!.length;
    console.log(`[TRACKER] ✅ Evento adicionado - Job: ${jobId} | Stage: ${event.stage} | Total: ${totalEvents} | Message: ${event.message}`);
  }

  getEventsForJob(jobId: string): ProcessingEvent[] {
    const events = this.trackers.get(jobId) || [];
    console.log(`[TRACKER] 🔍 Buscando eventos - jobId: ${jobId} | Encontrados: ${events.length}`);
    if (events.length > 0) {
      console.log(`[TRACKER] 📋 Eventos:`, JSON.stringify(events, null, 2));
    }
    return events;
  }

  clearJob(jobId: string) {
    this.trackers.delete(jobId);
  }

  clearAll() {
    this.trackers.clear();
  }

  logDeepseekCall(jobId: string, model: string, promptLength: number, responseTime: number, tokenCount?: number) {
    this.addEventForJob(jobId, {
      stage: 'deepseek_call',
      percentage: 50,
      message: `Chamada ao Deepseek (${model}) - ${responseTime}ms`,
      timestamp: Date.now(),
      details: {
        deepseekModel: model,
        promptLength,
        responseTime,
        tokenCount,
      },
    });
  }
}

export const globalProcessingTracker = new GlobalProcessingTracker();
