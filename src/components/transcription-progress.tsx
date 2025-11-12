'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TranscriptionProgressProps {
  jobId: string;
  fileName: string;
  startedAt?: number;  // Novo: timestamp do início
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;  // Novo: callback para cancelar
}

export default function TranscriptionProgress({
  jobId,
  fileName,
  startedAt,
  onComplete,
  onError,
  onCancel,
}: TranscriptionProgressProps) {
  const [status, setStatus] = useState<string>('PENDING');
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [estimatedTime, setEstimatedTime] = useState<string>('Calculando...');
  const [isCancelling, setIsCancelling] = useState(false);

  // Inicializar tempo decorrido baseado em startedAt
  useEffect(() => {
    if (startedAt) {
      const now = Date.now();
      const elapsed = Math.floor((now - startedAt) / 1000);
      setElapsedTime(elapsed);
      console.log(`⏱️ Tempo decorrido restaurado: ${elapsed}s`);
    }
  }, [startedAt]);

  // Atualizar tempo decorrido a cada segundo (parar quando completo)
  useEffect(() => {
    // Parar de incrementar o timer se estiver completo ou com erro
    if (isComplete || error) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      // Estimar tempo total baseado no progresso
      if (progress > 0 && progress < 100) {
        const estimatedTotal = Math.round(elapsedTime / (progress / 100));
        const remaining = estimatedTotal - elapsedTime;
        setEstimatedTime(remaining > 0 ? `${remaining}s` : 'Finalizando...');
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [progress, elapsedTime, isComplete, error]);

  // Fazer polling do status
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`, {
          headers: {
            'X-Session-Id': typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') || '' : '',
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ao buscar status: ${response.statusText}`);
        }

        const data = await response.json();
        const job = data.job;

        if (!job) {
          throw new Error('Job não encontrado');
        }

        setStatus(job.status);
        setLastUpdate(new Date());

        // Atualizar progresso baseado no status e no progresso real quando disponível
        if (job.status === 'PENDING') {
          setProgress(job.progress?.percentage ?? 5);
        } else if (job.status === 'STARTED') {
          setProgress(job.progress?.percentage ?? 20);
        } else if (job.status === 'SUCCESS') {
          setProgress(100);
          setIsComplete(true);

          if (onComplete) {
            const res = job.result || {};
            onComplete({
              text: res.rawTranscription || '',
              correctedText: res.correctedTranscription || res.rawTranscription || '',
              identifiedText: res.identifiedTranscription || '',
              summary: res.summary || null,
              processingTime: res.processingTime || 0,
              audioInfo: res.audioInfo || null,
            });
          }
        } else if (job.status === 'FAILURE') {
          const errMsg = job.error || 'Falha desconhecida na transcrição';
          setError(errMsg);
          if (onError) {
            onError(errMsg);
          }
        }
      } catch (err: any) {
        console.error('Erro ao buscar status:', err);
        // Se ficar em PENDING por mais de 10 minutos, considerar como erro
        if (elapsedTime > 600 && status === 'PENDING') {
          const timeoutMsg = 'Timeout: A transcrição demorou mais de 10 minutos. Por favor, tente novamente.';
          setError(timeoutMsg);
          if (onError) {
            onError(timeoutMsg);
          }
          return;
        }
      }
    };

    // Fazer polling a cada 2 segundos, mas parar quando estiver completo
    if (!isComplete && !error) {
      pollStatus(); // Fazer primeira chamada imediatamente
      const interval = setInterval(pollStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [jobId, isComplete, error, onComplete, onError]);

  const getStatusColor = () => {
    switch (status) {
      case 'SUCCESS':
        return 'text-green-400';
      case 'FAILURE':
        return 'text-red-400';
      case 'STARTED':
      default:
        return 'text-blue-400';
    }
  };

  const getStatusIcon = () => {
    if (isComplete) {
      return <CheckCircle2 className={`w-6 h-6 ${getStatusColor()}`} />;
    } else if (error) {
      return <AlertCircle className={`w-6 h-6 ${getStatusColor()}`} />;
    } else {
      return <Loader2 className={`w-6 h-6 ${getStatusColor()} animate-spin`} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'STARTED':
        return 'Processando transcrição...';
      case 'SUCCESS':
        return 'Transcrição concluída! ✅';
      case 'FAILURE':
        return 'Erro na transcrição ❌';
      default:
        return 'Aguardando...';
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      // Chamar endpoint de cancelamento se existir
      const response = await fetch(`/api/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setError('Transcrição cancelada pelo usuário');
        if (onCancel) {
          onCancel();
        }
      } else {
        throw new Error('Erro ao cancelar transcrição');
      }
    } catch (err: any) {
      console.error('Erro ao cancelar:', err);
      setError(`Erro ao cancelar: ${err.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-lg p-6 border border-slate-700">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 mb-4">
        {getStatusIcon()}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{fileName}</h3>
          <p className={`text-sm ${getStatusColor()}`}>{getStatusText()}</p>
        </div>
        <div className="text-right text-sm text-slate-400">
          {isComplete ? (
            <>
              <p className="text-green-400 font-semibold">✅ Completo</p>
              <p className="text-slate-300">Tempo Total: {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s</p>
            </>
          ) : error ? (
            <>
              <p className="text-red-400 font-semibold">❌ Erro</p>
              <p className="text-slate-300">Tempo: {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s</p>
            </>
          ) : (
            <>
              <p>Tempo: {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s</p>
              <p>Estimado: {estimatedTime}</p>
            </>
          )}
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mb-4">
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isComplete ? 'bg-green-500' : error ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>Progresso</span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Status detalhado */}
      <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 mb-4 pb-4 border-b border-slate-700">
        <div>
          <span className="text-slate-500">ID da Tarefa:</span>
          <p className="font-mono text-slate-300 truncate">{jobId}</p>
        </div>
        <div>
          <span className="text-slate-500">Última Atualização:</span>
          <p className="text-slate-300">{formatDistanceToNow(lastUpdate, { locale: ptBR, addSuffix: true })}</p>
        </div>
        <div>
          <span className="text-slate-500">Status:</span>
          <p className={`font-semibold ${getStatusColor()}`}>{status}</p>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-950/30 border border-red-800 rounded p-3 text-red-300 text-sm">
          <p className="font-semibold mb-1">❌ Erro na Transcrição</p>
          <p>{error}</p>
        </div>
      )}

      {/* Mensagem de sucesso */}
      {isComplete && !error && (
        <div className="bg-green-950/30 border border-green-800 rounded p-3 text-green-300 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} />
            <span className="font-semibold">Transcrição Concluída!</span>
          </div>
          <p className="text-xs text-green-400">
            Tempo total: {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s
          </p>
        </div>
      )}

      {/* Dicas enquanto processa */}
      {!isComplete && !error && (
        <div className="flex gap-3 items-start">
          <div className="bg-blue-950/20 border border-blue-800 rounded p-3 text-blue-300 text-xs flex-1">
            <div className="flex items-center gap-2">
              <Zap size={14} />
              <span>A transcrição está sendo processada pela API Daredevil. Não feche esta página.</span>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white px-4 py-2 rounded text-xs font-medium transition-colors whitespace-nowrap"
          >
            {isCancelling ? '⏳ Cancelando...' : '✕ Cancelar'}
          </button>
        </div>
      )}
    </div>
  );
}
