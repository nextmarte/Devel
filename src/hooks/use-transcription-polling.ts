'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { AsyncJob } from '@/lib/transcription-types';

interface UseTranscriptionPollingProps {
  jobId: string | null;
  sessionId?: string | null;
  onComplete?: (job: AsyncJob) => void;
  onError?: (error: string) => void;
  pollInterval?: number; // em ms, padrão 2000
}

export function useTranscriptionPolling({
  jobId,
  sessionId,
  onComplete,
  onError,
  pollInterval = 2000,
}: UseTranscriptionPollingProps) {
  const [job, setJob] = useState<AsyncJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Usar refs para callbacks e flags para evitar ciclos infinitos
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const shouldPollRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledCallbackRef = useRef(false); // Prevenir múltiplas chamadas do callback
  
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const fetchJobStatus = useCallback(async () => {
    if (!jobId || !shouldPollRef.current) {
      console.log('[POLLING] Skipping: jobId=', jobId, 'shouldPoll=', shouldPollRef.current);
      return;
    }

    console.log('[POLLING] 🔄 Fetching status for jobId:', jobId);

    try {
      const headers: HeadersInit = {};
      if (sessionId) {
        headers['X-Session-Id'] = sessionId;
      }

      const response = await fetch(`/api/jobs/${jobId}`, { headers });

      if (!response.ok) {
        throw new Error('Falha ao buscar status');
      }

      const data = await response.json();
      const updatedJob = data.job as AsyncJob;

      console.log('[POLLING] 📊 Status recebido:', updatedJob.status);
      console.log('[POLLING] 📦 Job completo:', JSON.stringify(updatedJob, null, 2));

      setJob(updatedJob);
      setError(null);

      // Se completou, para de fazer polling
      if (updatedJob.status === 'SUCCESS' || updatedJob.status === 'FAILURE') {
        console.log('[POLLING] ✅ Status final detectado:', updatedJob.status);
        console.log('[POLLING] 📦 Job result existe?', updatedJob.result ? 'SIM' : 'NÃO');
        if (updatedJob.result?.rawTranscription) {
          console.log('[POLLING] 📝 Transcrição (primeiros 50 chars):', updatedJob.result.rawTranscription.substring(0, 50));
        }
        
        // Log dos eventos de processamento
        if (updatedJob.processingEvents && updatedJob.processingEvents.length > 0) {
          console.log('[POLLING] 📊 Eventos de processamento:');
          updatedJob.processingEvents.forEach((event, index) => {
            console.log(`  ${index + 1}. [${event.stage}] ${event.message} (${event.percentage}%)`);
            if (event.details?.responseTime) {
              console.log(`     └─ ⏱️ ${event.details.responseTime}ms`);
            }
          });
        }
        
        // Prevenir múltiplas chamadas do callback
        if (hasCalledCallbackRef.current) {
          console.log('[POLLING] ⚠️ Callback já foi chamado, ignorando');
          return;
        }
        
        console.log('[POLLING] 🛑 Parando polling...');
        
        shouldPollRef.current = false;
        setIsPolling(false);
        hasCalledCallbackRef.current = true;
        
        // Limpar intervalo
        if (intervalRef.current) {
          console.log('[POLLING] 🧹 Limpando intervalo');
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        if (updatedJob.status === 'SUCCESS') {
          console.log('[POLLING] 🎉 Chamando onComplete callback');
          onCompleteRef.current?.(updatedJob);
        } else {
          console.log('[POLLING] ❌ Chamando onError callback');
          onErrorRef.current?.(updatedJob.error || 'Transcrição falhou');
        }
      } else {
        console.log('[POLLING] ⏳ Status ainda em progresso, continuando polling...');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao buscar status';
      console.error('[POLLING] ❌ Erro ao buscar status:', errorMsg);
      setError(errorMsg);
      onErrorRef.current?.(errorMsg);
      shouldPollRef.current = false;
      setIsPolling(false);
      
      // Limpar intervalo em caso de erro
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [jobId, sessionId]);

  // Inicia polling quando jobId muda
  useEffect(() => {
    console.log('[POLLING] 🔧 useEffect triggered - jobId:', jobId);
    
    if (!jobId) {
      console.log('[POLLING] ⚠️ Sem jobId, limpando polling');
      shouldPollRef.current = false;
      setIsPolling(false);
      hasCalledCallbackRef.current = false; // Reset quando limpa jobId
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('[POLLING] 🚀 Iniciando polling para jobId:', jobId);
    shouldPollRef.current = true;
    setIsPolling(true);
    hasCalledCallbackRef.current = false; // Reset para novo job

    // Faz a primeira consulta imediatamente
    console.log('[POLLING] 📞 Primeira consulta imediata');
    fetchJobStatus();

    // Depois consulta a cada pollInterval
    console.log('[POLLING] ⏰ Configurando intervalo de', pollInterval, 'ms');
    intervalRef.current = setInterval(() => {
      console.log('[POLLING] ⏰ Intervalo disparado');
      fetchJobStatus();
    }, pollInterval);

    return () => {
      console.log('[POLLING] 🧹 Cleanup: parando polling');
      shouldPollRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId, sessionId, pollInterval, fetchJobStatus]);

  return {
    job,
    isPolling,
    error,
    refetch: fetchJobStatus, // permite refetch manual
  };
}
