'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const FONT_SIZE_KEY = 'transcription_font_size';
const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;

export default function SettingsPanel() {
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load font size from localStorage
    const savedSize = localStorage.getItem(FONT_SIZE_KEY);
    if (savedSize) {
      const size = parseInt(savedSize, 10);
      setFontSize(size);
      applyFontSize(size);
    }
  }, []);

  const applyFontSize = (size: number) => {
    document.documentElement.style.setProperty('--transcription-font-size', `${size}px`);
  };

  const handleFontSizeChange = (values: number[]) => {
    const newSize = values[0];
    setFontSize(newSize);
    applyFontSize(newSize);
    localStorage.setItem(FONT_SIZE_KEY, newSize.toString());
  };

  const resetFontSize = () => {
    setFontSize(DEFAULT_FONT_SIZE);
    applyFontSize(DEFAULT_FONT_SIZE);
    localStorage.setItem(FONT_SIZE_KEY, DEFAULT_FONT_SIZE.toString());
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          title="Configurações"
        >
          <Settings className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Configurações</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Tamanho da Fonte
              </Label>
              <span className="text-sm text-muted-foreground">{fontSize}px</span>
            </div>
            
            <Slider
              value={[fontSize]}
              onValueChange={handleFontSizeChange}
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              step={1}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pequeno</span>
              <span>Grande</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetFontSize}
              className="w-full"
            >
              Restaurar Padrão
            </Button>
          </div>

          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              As configurações são salvas automaticamente no seu navegador.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
