'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Clock, XCircle, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { AsyncTranscriptionTask, AsyncTaskStatus } from '@/lib/transcription-types';
import { 
  getAsyncTask, 
  updateAsyncTask, 
  deleteAsyncTask 
} from '@/lib/async-transcription-storage';
import { 
  checkAsyncTranscriptionStatus, 
  cancelAsyncTranscription,
  processAsyncTranscriptionResult 
} from '@/app/actions';

interface AsyncTaskMonitorProps {
  task: AsyncTranscriptionTask;
  onTaskComplete: (task: AsyncTranscriptionTask) => void;
  onTaskError: (task: AsyncTranscriptionTask) => void;
  onTaskCancel: (taskId: string) => void;
}

const STATUS_LABELS: Record<AsyncTaskStatus, string> = {
  PENDING: 'Aguardando',
  STARTED: 'Processando',
  SUCCESS: 'Concluído',
  FAILURE: 'Erro',
  RETRY: 'Tentando novamente',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<AsyncTaskStatus, string> = {
  PENDING: 'text-yellow-600 dark:text-yellow-400',
  STARTED: 'text-blue-600 dark:text-blue-400',
  SUCCESS: 'text-green-600 dark:text-green-400',
  FAILURE: 'text-red-600 dark:text-red-400',
  RETRY: 'text-orange-600 dark:text-orange-400',
  CANCELLED: 'text-gray-600 dark:text-gray-400',
};

const STATUS_ICONS: Record<AsyncTaskStatus, React.ReactNode> = {
  PENDING: <Clock className="w-5 h-5 animate-pulse" />,
  STARTED: <Clock className="w-5 h-5 animate-spin" />,
  SUCCESS: <CheckCircle2 className="w-5 h-5" />,
  FAILURE: <AlertCircle className="w-5 h-5" />,
  RETRY: <Pause className="w-5 h-5 animate-pulse" />,
  CANCELLED: <XCircle className="w-5 h-5" />,
};

export default function AsyncTaskMonitor({
  task,
  onTaskComplete,
  onTaskError,
  onTaskCancel,
}: AsyncTaskMonitorProps) {
  const [currentTask, setCurrentTask] = useState(task);
  const [isPolling, setIsPolling] = useState(
    task.status === 'PENDING' || task.status === 'STARTED' || task.status === 'RETRY'
  );
  const [processingError, setProcessingError] = useState<string | null>(null);
  const { toast } = useToast();

  // Verificar status da tarefa periodicamente
  const pollTaskStatus = useCallback(async () => {
    try {
      const { status: taskStatus, error } = await checkAsyncTranscriptionStatus(currentTask.taskId);

      if (error) {
        console.error('Erro ao verificar status:', error);
        return;
      }

      if (taskStatus) {
        const newProgress = taskStatus.progress?.percentage || 0;

        // Atualizar tarefa local
        const updatedTask: AsyncTranscriptionTask = {
          ...currentTask,
          status: taskStatus.state as AsyncTaskStatus,
          progress: newProgress,
          result: taskStatus.result,
          error: taskStatus.error,
        };

        setCurrentTask(updatedTask);
        updateAsyncTask(currentTask.localId, updatedTask);

        // Se concluído com sucesso
        if (taskStatus.state === 'SUCCESS' && taskStatus.result?.success) {
          setIsPolling(false);

          // Processar resultado com correções e IA
          if (taskStatus.result.transcription?.text) {
            const { data, error: processingError } = await processAsyncTranscriptionResult(
              taskStatus.result.transcription.text,
              currentTask.generateSummary
            );

            if (processingError) {
              setProcessingError(processingError);
              updatedTask.status = 'FAILURE';
              updatedTask.error = processingError;
              setCurrentTask(updatedTask);
              updateAsyncTask(currentTask.localId, updatedTask);
              onTaskError(updatedTask);

              toast({
                variant: 'destructive',
                title: 'Erro no processamento',
                description: processingError,
              });
            } else if (data) {
              updatedTask.correctedTranscription = data.correctedTranscription;
              updatedTask.identifiedTranscription = data.identifiedTranscription;
              updatedTask.summary = data.summary ?? undefined;
              setCurrentTask(updatedTask);
              updateAsyncTask(currentTask.localId, updatedTask);

              onTaskComplete(updatedTask);

              toast({
                title: 'Transcrição concluída',
                description: `${currentTask.fileName} foi transcrito com sucesso!`,
              });
            }
          }
        } else if (taskStatus.state === 'FAILURE') {
          setIsPolling(false);
          onTaskError(updatedTask);

          toast({
            variant: 'destructive',
            title: 'Erro na transcrição',
            description: taskStatus.error || 'Falha ao transcrever arquivo',
          });
        } else if (taskStatus.state === 'CANCELLED') {
          setIsPolling(false);
        }
      }
    } catch (error) {
      console.error('Erro ao fazer polling:', error);
    }
  }, [currentTask, onTaskComplete, onTaskError, toast]);

  // Setup polling interval
  useEffect(() => {
    if (!isPolling) return;

    const pollInterval = setInterval(pollTaskStatus, 2000); // Verificar a cada 2 segundos

    return () => clearInterval(pollInterval);
  }, [isPolling, pollTaskStatus]);

  // Fazer primeira verificação
  useEffect(() => {
    if (isPolling) {
      pollTaskStatus();
    }
  }, []);

  const handleCancel = async () => {
    const { success, error } = await cancelAsyncTranscription(currentTask.taskId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao cancelar',
        description: error,
      });
    } else if (success) {
      const updatedTask = { ...currentTask, status: 'CANCELLED' as AsyncTaskStatus };
      setCurrentTask(updatedTask);
      updateAsyncTask(currentTask.localId, updatedTask);
      setIsPolling(false);
      onTaskCancel(currentTask.localId);

      toast({
        title: 'Tarefa cancelada',
        description: `${currentTask.fileName} foi cancelada`,
      });
    }
  };

  const isFinalStatus = ['SUCCESS', 'FAILURE', 'CANCELLED'].includes(currentTask.status);

  return (
    <Card className="shadow-md border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={STATUS_COLORS[currentTask.status]}>
              {STATUS_ICONS[currentTask.status]}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{currentTask.fileName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {STATUS_LABELS[currentTask.status]}
              </p>
            </div>
          </div>
          {!isFinalStatus && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleCancel}
              disabled={currentTask.status === 'CANCELLED'}
            >
              Cancelar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {!isFinalStatus && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{Math.round(currentTask.progress)}%</span>
            </div>
            <Progress value={currentTask.progress} className="h-2" />
          </div>
        )}

        {/* Task Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Tamanho do arquivo</span>
            <p className="font-medium">
              {(currentTask.fileSize / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Idioma</span>
            <p className="font-medium">
              {currentTask.language === 'pt' ? 'Português' : currentTask.language}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Criado em</span>
            <p className="font-medium text-xs">
              {new Date(currentTask.createdAt).toLocaleString('pt-BR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          {currentTask.retries > 0 && (
            <div>
              <span className="text-muted-foreground">Tentativas</span>
              <p className="font-medium">
                {currentTask.retries} / {currentTask.maxRetries}
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {(currentTask.error || processingError) && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              {currentTask.error || processingError}
            </p>
          </div>
        )}

        {/* Retry Message */}
        {currentTask.status === 'RETRY' && (
          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/20">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              ⚠️ A tarefa está sendo repetida após um erro...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
