import React from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export type ProcessingStep = 'transcribing' | 'correcting' | 'identifying' | 'summarizing';

type ProcessingProgressProps = {
  currentStep: ProcessingStep;
  generateSummary: boolean;
};

const steps: { id: ProcessingStep; label: string; description: string }[] = [
  { id: 'transcribing', label: 'Transcrição', description: 'Enviando para API de transcrição' },
  { id: 'correcting', label: 'Correção', description: 'Corrigindo erros e melhorando texto' },
  { id: 'identifying', label: 'Locutores', description: 'Identificando e marcando locutores' },
  { id: 'summarizing', label: 'Resumo', description: 'Gerando ata da reunião' },
];

export default function ProcessingProgress({ currentStep, generateSummary }: ProcessingProgressProps) {
  const stepOrder: ProcessingStep[] = generateSummary 
    ? ['transcribing', 'correcting', 'identifying', 'summarizing']
    : ['transcribing', 'correcting', 'identifying'];

  const getStepStatus = (stepId: ProcessingStep) => {
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const visibleSteps = steps.filter(step => generateSummary || step.id !== 'summarizing');

  return (
    <div className="w-full space-y-4">
      <div className="space-y-3">
        {visibleSteps.map((step, index) => {
          const status = getStepStatus(step.id);
          return (
            <div key={step.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                {status === 'completed' && (
                  <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />
                )}
                {status === 'current' && (
                  <Loader2 className="w-8 h-8 text-primary animate-spin flex-shrink-0" />
                )}
                {status === 'pending' && (
                  <Circle className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                )}
                {index < visibleSteps.length - 1 && (
                  <div className={`w-1 h-6 mt-1 ${status === 'pending' ? 'bg-muted-foreground' : 'bg-primary'}`} />
                )}
              </div>
              <div className="flex-1 pt-1">
                <p className={`font-semibold ${status === 'current' ? 'text-primary' : status === 'completed' ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
