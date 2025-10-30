'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, RefreshCw, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { CacheStats } from '@/lib/transcription-types';

export default function CacheStatsDashboard() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const fetchCacheStats = async () => {
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_DAREDEVIL_API_URL;
      if (!apiUrl) {
        console.warn('URL da API não configurada');
        return;
      }

      const response = await fetch(`${apiUrl}/api/cache-stats`);
      if (!response.ok) throw new Error('Falha ao obter estatísticas de cache');

      const stats = await response.json();
      setCacheStats(stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao atualizar cache:', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_DAREDEVIL_API_URL;
      if (!apiUrl) {
        console.warn('URL da API não configurada');
        return;
      }

      const response = await fetch(`${apiUrl}/api/cache/clear`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Falha ao limpar cache');

      toast({
        title: 'Cache limpo',
        description: 'Cache foi limpo com sucesso',
      });

      // Atualizar estatísticas
      await fetchCacheStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        variant: 'destructive',
        title: 'Erro ao limpar cache',
        description: message,
      });
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    fetchCacheStats();
  }, []);

  if (!cacheStats) {
    return null;
  }

  const hitRatePercentage = Math.round(cacheStats.hit_rate * 100);
  const cacheSizeMb = cacheStats.cache_size_mb || cacheStats.cache_size_bytes / 1024 / 1024;

  const getHitRateColor = () => {
    if (hitRatePercentage >= 80) return 'text-green-600';
    if (hitRatePercentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Estatísticas de Cache
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchCacheStats}
              disabled={isLoading}
              className="gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="gap-1">
                  <Trash2 className="w-3 h-3" />
                  Limpar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar cache?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso removerá todas as transcrições em cache ({cacheStats.total_items} itens,{' '}
                    {cacheSizeMb.toFixed(2)}MB). Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearCache} disabled={isClearing}>
                  {isClearing ? 'Limpando...' : 'Limpar'}
                </AlertDialogAction>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hit Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Taxa de Acertos (Hit Rate)</span>
            <Badge className={`${getHitRateColor()} bg-transparent`}>
              {hitRatePercentage}%
            </Badge>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                hitRatePercentage >= 80
                  ? 'bg-green-500'
                  : hitRatePercentage >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${hitRatePercentage}%` }}
            />
          </div>
        </div>

        {/* Grid de Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs text-muted-foreground mb-1">Acertos</p>
            <p className="text-2xl font-bold text-primary">{cacheStats.hits}</p>
          </div>

          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
            <p className="text-xs text-muted-foreground mb-1">Erros</p>
            <p className="text-2xl font-bold text-destructive">{cacheStats.misses}</p>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Tamanho do Cache</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-blue-600">
                {cacheSizeMb.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">MB</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10 col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Itens em Cache</p>
            <p className="text-2xl font-bold text-violet-600">{cacheStats.total_items}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/20">
          <p className="text-xs font-medium text-amber-900 dark:text-amber-100 mb-1">
            💡 Dica
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Uma taxa de acertos acima de 80% indica que a cache está funcionando bem e reduzindo
            processamento desnecessário.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
