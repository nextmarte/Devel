'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AsyncTranscriptionTask } from '@/lib/transcription-types';
import {
  getAsyncTasks,
  getActiveTasks,
  getCompletedTasks,
  getFailedTasks,
  deleteAsyncTask,
  cleanupOldTasks,
} from '@/lib/async-transcription-storage';
import AsyncTaskMonitor from './async-task-monitor';
import { useToast } from '@/hooks/use-toast';

interface AsyncTaskManagerProps {
  onTaskComplete?: (task: AsyncTranscriptionTask) => void;
  onTaskError?: (task: AsyncTranscriptionTask) => void;
}

export default function AsyncTaskManager({
  onTaskComplete,
  onTaskError,
}: AsyncTaskManagerProps) {
  const [activeTasks, setActiveTasks] = useState<AsyncTranscriptionTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<AsyncTranscriptionTask[]>([]);
  const [failedTasks, setFailedTasks] = useState<AsyncTranscriptionTask[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const refreshTasks = () => {
    setActiveTasks(getActiveTasks());
    setCompletedTasks(getCompletedTasks());
    setFailedTasks(getFailedTasks());
  };

  useEffect(() => {
    refreshTasks();

    // Atualizar a cada 30 segundos quando há tarefas ativas
    const interval = setInterval(() => {
      if (getActiveTasks().length > 0) {
        refreshTasks();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleTaskComplete = (task: AsyncTranscriptionTask) => {
    refreshTasks();
    if (onTaskComplete) {
      onTaskComplete(task);
    }
  };

  const handleTaskError = (task: AsyncTranscriptionTask) => {
    refreshTasks();
    if (onTaskError) {
      onTaskError(task);
    }
  };

  const handleTaskCancel = (localId: string) => {
    deleteAsyncTask(localId);
    refreshTasks();
  };

  const handleDeleteTask = (localId: string) => {
    deleteAsyncTask(localId);
    refreshTasks();

    toast({
      title: 'Tarefa removida',
      description: 'A tarefa foi removida do histórico',
    });
  };

  const handleCleanupOldTasks = () => {
    cleanupOldTasks(7);
    refreshTasks();

    toast({
      title: 'Limpeza concluída',
      description: 'Tarefas antigas foram removidas',
    });
  };

  const totalTasks = activeTasks.length + completedTasks.length + failedTasks.length;

  if (totalTasks === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg shadow-primary/10 border-border fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)]">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <CardTitle className="text-sm">Tarefas Assíncronas</CardTitle>
            {activeTasks.length > 0 && (
              <span className="inline-block bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
                {activeTasks.length} ativa{activeTasks.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active" className="text-xs">
                Ativas ({activeTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">
                Concluídas ({completedTasks.length})
              </TabsTrigger>
              <TabsTrigger value="failed" className="text-xs">
                Erros ({failedTasks.length})
              </TabsTrigger>
            </TabsList>

            {/* Active Tasks */}
            <TabsContent value="active" className="space-y-3">
              {activeTasks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Nenhuma tarefa ativa
                </div>
              ) : (
                <ScrollArea className="h-80">
                  <div className="pr-4 space-y-3">
                    {activeTasks.map((task) => (
                      <AsyncTaskMonitor
                        key={task.localId}
                        task={task}
                        onTaskComplete={handleTaskComplete}
                        onTaskError={handleTaskError}
                        onTaskCancel={handleTaskCancel}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Completed Tasks */}
            <TabsContent value="completed" className="space-y-3">
              {completedTasks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Nenhuma tarefa concluída
                </div>
              ) : (
                <ScrollArea className="h-80">
                  <div className="pr-4 space-y-2">
                    {completedTasks.map((task) => (
                      <div
                        key={task.localId}
                        className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/20"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                            {task.fileName}
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-200">
                            {new Date(task.updatedAt).toLocaleString('pt-BR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTask(task.localId)}
                          className="text-green-700 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Failed Tasks */}
            <TabsContent value="failed" className="space-y-3">
              {failedTasks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Nenhuma tarefa com erro
                </div>
              ) : (
                <ScrollArea className="h-80">
                  <div className="pr-4 space-y-2">
                    {failedTasks.map((task) => (
                      <div
                        key={task.localId}
                        className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/20"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-red-900 dark:text-red-100 truncate">
                            {task.fileName}
                          </p>
                          <p className="text-xs text-red-700 dark:text-red-200 truncate">
                            {task.error || 'Erro desconhecido'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTask(task.localId)}
                          className="text-red-700 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={handleCleanupOldTasks}
            >
              Limpar antigas
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
