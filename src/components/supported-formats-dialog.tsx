'use client';

import React, { useEffect, useState } from 'react';
import { FileAudio, Film, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface FormatsData {
  supported_formats: string[];
  max_file_size_mb: number;
}

export default function SupportedFormatsDialog() {
  const [formatsData, setFormatsData] = useState<FormatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Separar formatos em áudio e vídeo
  const separateFormats = (formats: string[]) => {
    const audioFormats = ['opus', 'ogg', 'm4a', 'aac', 'mp3', 'wav', 'flac', 'webm'];
    const videoFormats = ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'ogv', 'ts', 'mts', 'm2ts', '3gp', 'f4v', 'asf'];
    
    const audio: string[] = [];
    const video: string[] = [];
    
    formats.forEach(format => {
      const clean = format.toLowerCase().replace(/^\./, '');
      if (audioFormats.includes(clean)) {
        audio.push(`.${clean}`);
      } else if (videoFormats.includes(clean)) {
        video.push(`.${clean}`);
      }
    });
    
    return { audio: [...new Set(audio)], video: [...new Set(video)] };
  };

  const fetchFormats = async () => {
    setIsLoading(true);

    try {
      // Usar proxy local do Next.js para evitar CORS
      const healthUrl = '/api/health';
      console.log('[SupportedFormatsDialog] Fetching:', healthUrl);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('[SupportedFormatsDialog] Response status:', response.status);
      
      if (!response.ok) {
        console.warn('API não respondeu com status OK:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('[SupportedFormatsDialog] Data received:', data);
      
      setFormatsData({
        supported_formats: data.supported_formats || [],
        max_file_size_mb: data.max_file_size_mb || 500,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[SupportedFormatsDialog] Erro:', message);
      
      // Fallback com dados padrão
      console.warn('Usando dados padrão como fallback');
      setFormatsData({
        supported_formats: ['opus', 'ogg', 'm4a', 'aac', 'mp3', 'wav', 'flac', 'webm', 'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'ogv', 'ts', 'mts', 'm2ts', '3gp', 'f4v', 'asf'],
        max_file_size_mb: 500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFormats();
  }, []);

  if (!formatsData) {
    return null;
  }

  const { audio, video } = separateFormats(formatsData.supported_formats);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="w-4 h-4" />
          Formatos Suportados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Formatos Suportados</DialogTitle>
          <DialogDescription>
            Todos os formatos de áudio e vídeo aceitos pela API
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Limit Info */}
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <p className="text-sm">
                <span className="font-semibold">Limite de arquivo:</span>{' '}
                <span className="text-primary font-bold">
                  {formatsData.max_file_size_mb}MB
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Audio Formats */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileAudio className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Formatos de Áudio</h3>
              <Badge variant="secondary">{audio.length}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {audio.map((format) => (
                <Badge key={format} variant="outline" className="justify-center">
                  {format}
                </Badge>
              ))}
            </div>
          </div>

          {/* Video Formats */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Formatos de Vídeo</h3>
              <Badge variant="secondary">{video.length}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {video.map((format) => (
                <Badge key={format} variant="outline" className="justify-center">
                  {format}
                </Badge>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/20">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <span className="font-semibold">ℹ️ Nota:</span> Áudio de vídeos será
              automaticamente extraído em qualidade otimizada para transcrição.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin">⏳</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
