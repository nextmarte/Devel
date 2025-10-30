'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle2, Zap, HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { HealthResponse, GPUStatus } from '@/lib/transcription-types';

export default function APIHealthMonitor() {
  const [healthInfo, setHealthInfo] = useState<HealthResponse | null>(null);
  const [gpuStatus, setGPUStatus] = useState<GPUStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Usar proxy local do Next.js para evitar CORS
      // Fetch health info
      const healthResponse = await fetch('/api/health');
      if (!healthResponse.ok) throw new Error('Falha ao obter status de saúde');
      const health = await healthResponse.json();
      setHealthInfo(health);

      // Fetch GPU status
      const gpuResponse = await fetch('/api/gpu-status');
      if (!gpuResponse.ok) throw new Error('Falha ao obter status da GPU');
      const gpu = await gpuResponse.json();
      setGPUStatus(gpu);

      toast({
        title: 'Status atualizado',
        description: 'Informações da API foram atualizadas',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('Erro ao atualizar status:', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Health Status Card */}
      {healthInfo && (
        <Card className="shadow-md">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Status da API
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchHealth}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium text-green-600">{healthInfo.status}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Modelo Whisper</p>
                <p className="font-medium">{healthInfo.whisper_model}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tamanho Máx. de Arquivo</p>
                <p className="font-medium">{healthInfo.max_file_size_mb}MB</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Formatos</p>
                <p className="font-medium">{healthInfo.supported_formats.length}+</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GPU Status Card */}
      {gpuStatus && gpuStatus.gpus.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              Status da GPU
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gpuStatus.gpus.map((gpu, idx) => (
              <div key={idx} className="space-y-2 pb-3 last:pb-0 border-b last:border-b-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{gpu.gpu.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(gpu.utilization_percent)}% Util.
                  </Badge>
                </div>

                {/* Memory Usage */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Memória</span>
                    <span>
                      {Math.round(gpu.used_memory_mb)}MB / {gpu.total_memory_mb}MB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(gpu.used_memory_mb / gpu.total_memory_mb) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Temperature */}
                {gpu.temperature_c !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    Temperatura:{' '}
                    <span className="font-medium">{Math.round(gpu.temperature_c)}°C</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6 flex gap-2">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
