'use client';

import React, { useState } from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import APIHealthMonitor from './api-health-monitor';
import CacheStatsDashboard from './cache-stats-dashboard';

export default function MonitoringPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between px-4"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span>Monitoramento da API</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4 space-y-4">
        <APIHealthMonitor />
        <CacheStatsDashboard />
      </CollapsibleContent>
    </Collapsible>
  );
}
