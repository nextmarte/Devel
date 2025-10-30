'use client';

import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type WhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large';

interface WhisperModelSelectorProps {
  value: WhisperModel;
  onChange: (model: WhisperModel) => void;
}

const MODEL_INFO: Record<WhisperModel, { label: string; speed: string; accuracy: string; size: string }> = {
  tiny: {
    label: 'Tiny',
    speed: '⚡⚡⚡ Muito Rápido',
    accuracy: '📊 Baixa (~62%)',
    size: '39MB',
  },
  base: {
    label: 'Base',
    speed: '⚡⚡ Rápido',
    accuracy: '📊 Média (~71%)',
    size: '140MB',
  },
  small: {
    label: 'Small',
    speed: '⚡ Moderado',
    accuracy: '📊 Boa (~85%)',
    size: '466MB',
  },
  medium: {
    label: 'Medium',
    speed: '🐢 Lento',
    accuracy: '📊 Muito Boa (~91%)',
    size: '1.5GB',
  },
  large: {
    label: 'Large',
    speed: '🐢🐢 Muito Lento',
    accuracy: '📊 Excelente (~96%)',
    size: '2.9GB',
  },
};

export default function WhisperModelSelector({
  value,
  onChange,
}: WhisperModelSelectorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const currentModel = MODEL_INFO[value];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="model-select" className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Modelo Whisper
        </Label>
        <Badge variant="outline" className="text-xs">
          {currentModel.label}
        </Badge>
      </div>

      <Select value={value} onValueChange={(val) => onChange(val as WhisperModel)}>
        <SelectTrigger id="model-select" className="w-full">
          <SelectValue placeholder="Selecione um modelo" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(MODEL_INFO).map(([key, info]) => (
            <SelectItem key={key} value={key}>
              <div className="flex items-center gap-2">
                <span>{info.label}</span>
                <span className="text-xs text-muted-foreground">({info.size})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Model Details Card */}
      <Card
        className="cursor-pointer hover:bg-accent transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{currentModel.label}</h4>
              <span className="text-xs text-muted-foreground">{currentModel.size}</span>
            </div>

            {showDetails && (
              <div className="space-y-2 pt-2 border-t">
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1">Velocidade</p>
                  <p>{currentModel.speed}</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1">Precisão</p>
                  <p>{currentModel.accuracy}</p>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {!showDetails ? 'Clique para ver detalhes' : 'Clique para ocultar'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/20 text-xs">
        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">💡 Recomendação</p>
        <p className="text-blue-800 dark:text-blue-200">
          {value === 'tiny' || value === 'base'
            ? 'Para melhor qualidade, considere usar "small" ou "medium".'
            : value === 'small'
              ? 'Bom equilíbrio entre velocidade e precisão.'
              : value === 'medium'
                ? 'Excelente para a maioria dos casos.'
                : 'Melhor qualidade, mas requer mais recursos.'}
        </p>
      </div>
    </div>
  );
}
