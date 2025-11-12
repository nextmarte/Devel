'use client';

/**
 * Sistema de eventos para comunicação entre webhook e components frontend
 * Permite que o webhook notifique components em tempo real
 */

export type TranscriptionEventType = 
  | 'started' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface TranscriptionEvent {
  type: TranscriptionEventType;
  jobId: string;
  progress?: number;
  status?: string;
  data?: any;
  timestamp: number;
}

class TranscriptionEventEmitter {
  private listeners: Map<string, Set<(event: TranscriptionEvent) => void>> = new Map();

  /**
   * Inscrever-se em eventos de um jobId específico
   */
  subscribe(jobId: string, callback: (event: TranscriptionEvent) => void): () => void {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }

    this.listeners.get(jobId)!.add(callback);

    // Retornar função de unsubscribe
    return () => {
      this.listeners.get(jobId)?.delete(callback);
      if (this.listeners.get(jobId)?.size === 0) {
        this.listeners.delete(jobId);
      }
    };
  }

  /**
   * Emitir evento para todos os listeners de um jobId
   */
  emit(event: TranscriptionEvent) {
    console.log(`📡 [Event] ${event.type.toUpperCase()} para ${event.jobId}`);
    
    const callbacks = this.listeners.get(event.jobId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('❌ Erro ao executar listener:', error);
        }
      });
    }
  }

  /**
   * Emitir evento de progresso
   */
  emitProgress(jobId: string, progress: number, status: string) {
    this.emit({
      type: 'processing',
      jobId,
      progress,
      status,
      timestamp: Date.now(),
    });
  }

  /**
   * Emitir evento de conclusão
   */
  emitComplete(jobId: string, data: any) {
    this.emit({
      type: 'completed',
      jobId,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Emitir evento de erro
   */
  emitError(jobId: string, error: string) {
    this.emit({
      type: 'failed',
      jobId,
      data: { error },
      timestamp: Date.now(),
    });
  }

  /**
   * Limpar todos os listeners de um jobId
   */
  clear(jobId: string) {
    this.listeners.delete(jobId);
  }
}

// Instância global
export const transcriptionEvents = new TranscriptionEventEmitter();

/**
 * Hook React para se inscrever em eventos de transcrição
 */
export function useTranscriptionEvent(jobId: string, callback: (event: TranscriptionEvent) => void) {
  return transcriptionEvents.subscribe(jobId, callback);
}
