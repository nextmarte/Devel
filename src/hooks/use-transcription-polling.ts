'use client';

import { useEffect, useState, useCallback } from 'react';
import { AsyncJob } from '@/lib/transcription-types';

interface UseTranscriptionPollingProps {
  jobId: string | null;
  onComplete?: (job: AsyncJob) => void;
  onError?: (error: string) => void;
  pollInterval?: number; // em ms, padrão 2000
}

export function useTranscriptionPolling({
  jobId,
  onComplete,
  onError,
  pollInterval = 2000,
}: UseTranscriptionPollingProps) {
  const [job, setJob] = useState<AsyncJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}`);

      if (!response.ok) {
        throw new Error('Falha ao buscar status');
      }

      const data = await response.json();
      const updatedJob = data.job as AsyncJob;

      setJob(updatedJob);
      setError(null);

      // Se completou, para de fazer polling
      if (updatedJob.status === 'SUCCESS' || updatedJob.status === 'FAILURE') {
        setIsPolling(false);
        if (updatedJob.status === 'SUCCESS') {
          onComplete?.(updatedJob);
        } else {
          onError?.(updatedJob.error || 'Transcrição falhou');
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao buscar status';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsPolling(false);
    }
  }, [jobId, onComplete, onError]);

  // Inicia polling quando jobId muda
  useEffect(() => {
    if (!jobId) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    // Faz a primeira consulta imediatamente
    fetchJobStatus();

    // Depois consulta a cada pollInterval
    const interval = setInterval(fetchJobStatus, pollInterval);

    return () => clearInterval(interval);
  }, [jobId, pollInterval, fetchJobStatus]);

  return {
    job,
    isPolling,
    error,
    refetch: fetchJobStatus, // permite refetch manual
  };
}
