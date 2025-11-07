import React from 'react';
import { ProcessingEvent } from '@/lib/transcription-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProcessingProgressDetailProps {
  events: ProcessingEvent[] | undefined;
  currentStage: string | undefined;
}

export function ProcessingProgressDetail({ events, currentStage }: ProcessingProgressDetailProps) {
  if (!events || events.length === 0) {
    console.log('[DEBUG ProcessingProgressDetail] Events:', events);
    return null;
  }

  const stageIcons: Record<string, string> = {
    transcribing: '🎙️',
    correcting: '✏️',
    identifying: '🎤',
    summarizing: '📝',
    deepseek_call: '🤖',
    completed: '✅',
  };

  const stageLabels: Record<string, string> = {
    transcribing: 'Transcrição',
    correcting: 'Correção',
    identifying: 'Identificação de Locutores',
    summarizing: 'Resumo',
    deepseek_call: 'Chamada Deepseek',
    completed: 'Concluído',
  };

  return (
    <Card className="mt-4 bg-gradient-to-r from-slate-50 to-slate-100">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          📊 Progresso de Processamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event, index) => {
          const isActive = event.stage === currentStage;
          const isCompleted = event.percentage === 100 || 
            events.some(e => e.percentage > event.percentage);

          return (
            <div
              key={index}
              className={`flex items-start gap-3 p-2 rounded transition-colors ${
                isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white'
              }`}
            >
              <div className="text-xl mt-1">
                {stageIcons[event.stage] || '•'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {stageLabels[event.stage] || event.stage}
                  </span>
                  <Badge 
                    variant={isCompleted ? 'default' : isActive ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {event.percentage}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 truncate mt-1">
                  {event.message}
                </p>
                {event.details && (
                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    {event.details.deepseekModel && (
                      <div>🤖 Modelo: {event.details.deepseekModel}</div>
                    )}
                    {event.details.responseTime && (
                      <div>⏱️ Tempo: {event.details.responseTime}ms</div>
                    )}
                    {event.details.promptLength && (
                      <div>📏 Prompt: {event.details.promptLength} caracteres</div>
                    )}
                    {event.details.tokenCount !== undefined && (
                      <div>🔢 Tokens: {event.details.tokenCount}</div>
                    )}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(event.timestamp).toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
