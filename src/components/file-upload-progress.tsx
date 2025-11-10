import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileUploadProgressProps {
  fileName: string;
  fileSize: string;
  duration: string;
  uploadProgress: number; // 0-100
  isUploading: boolean;
  error?: string;
  onCancel?: () => void;
}

export default function FileUploadProgress({
  fileName,
  fileSize,
  duration,
  uploadProgress,
  isUploading,
  error,
  onCancel,
}: FileUploadProgressProps) {
  return (
    <Card className="shadow-lg shadow-primary/10 border-border">
      <CardHeader>
        <CardTitle className="text-lg font-headline flex items-center gap-2">
          {error ? (
            <AlertCircle className="w-5 h-5 text-destructive" />
          ) : uploadProgress === 100 ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <Upload className="w-5 h-5 text-primary animate-pulse" />
          )}
          {error ? 'Erro no Upload' : uploadProgress === 100 ? 'Upload Completo' : 'Enviando Arquivo'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="font-medium text-sm">{fileName}</p>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{fileSize}</span>
            <span>Duração: {duration}</span>
          </div>
        </div>

        {!error && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Progresso</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>

            {isUploading && (
              <div className="flex gap-2">
                {onCancel && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onCancel}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
