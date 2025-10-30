'use client';

import React from 'react';
import { Database, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CacheIndicatorProps {
  isCached: boolean;
  processingTime?: number;
}

export default function CacheIndicator({
  isCached,
  processingTime,
}: CacheIndicatorProps) {
  if (!isCached) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="gap-1 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-200 cursor-help"
          >
            <Database className="w-3 h-3" />
            Do Cache
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <p>✨ Esta transcrição foi recuperada do cache</p>
            <p>Tempo de processamento: {processingTime?.toFixed(2) || '0'}ms</p>
            <p>Sem custo computacional adicional</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
