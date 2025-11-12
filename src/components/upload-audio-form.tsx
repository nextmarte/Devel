'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { processMediaWithAuth } from '@/app/actions-protected';
import { useUploadSession } from '@/hooks/use-upload-session';
import TranscriptionProgress from './transcription-progress';
import EditableTranscriptionView from './editable-transcription-view';
import { AudioRecorder } from './audio-recorder';

export function UploadAudioForm() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado de sessão persistente
  const uploadSession = useUploadSession();
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generateSummary, setGenerateSummary] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null);

  // Restaurar sessão ativa ao carregar
  useEffect(() => {
    if (uploadSession.isHydrated && uploadSession.hasActiveSession) {
      setJobId(uploadSession.sessionState.jobId);
      setFile(null); // Não temos o File original, mas temos o jobId
      setProgress(uploadSession.sessionState.progress);
      
      // Mostrar toast de restauração
      console.log(`📋 Sessão de upload restaurada: ${uploadSession.sessionState.jobId}`);
    }
  }, [uploadSession.isHydrated, uploadSession.hasActiveSession]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar tipo de arquivo - Todos os formatos suportados pela Daredevil API
    const allowedAudioTypes = [
      // WhatsApp
      'audio/opus',
      'audio/ogg',
      // Instagram/Redes Sociais
      'audio/mp4',
      'audio/mp4a-latm',
      'audio/m4a',
      'audio/aac',
      // Padrão
      'audio/mpeg',
      'audio/wav',
      'audio/flac',
      'audio/webm',
      // Video formatos (áudio será extraído)
      'video/mp4',
      'video/x-msvideo',
      'video/quicktime',
      'video/x-matroska',
      'video/x-flv',
      'video/x-ms-wmv',
      'video/ogg',
      'video/x-mts',
      'video/3gpp',
      'video/x-f4v',
      'video/x-ms-asf',
    ];

    if (!allowedAudioTypes.includes(selectedFile.type) && !selectedFile.type.startsWith('audio/') && !selectedFile.type.startsWith('video/')) {
      setError('Tipo de arquivo não suportado. Veja os formatos aceitos acima.');
      return;
    }

    // Validar tamanho (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('Arquivo muito grande. Máximo: 500MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(null);
  }

  function handleRecordingComplete(recordedFile: File) {
    setFile(recordedFile);
    setError(null);
    setSuccess(null);
  }

  function handleRecorderError(error: string) {
    setError(error);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setProgress(0);
      setJobId(null);
      setTranscriptionResult(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('generateSummary', generateSummary.toString());

      const result = await processMediaWithAuth(formData);

      if (result.error) {
        setError(result.error);
        await uploadSession.cancelUpload();
        setLoading(false);
      } else if (result.jobId) {
        // Criar sessão persistente
        await uploadSession.startUpload(result.jobId, file.name, file, generateSummary);
        
        // Job criado com sucesso - mostrar componente de progresso
        setJobId(result.jobId);
        setLoading(false);
      } else {
        setError('Resposta inesperada do servidor');
        await uploadSession.cancelUpload();
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar arquivo');
      setProgress(0);
      setLoading(false);
      await uploadSession.cancelUpload();
    }
  }

  function handleTranscriptionComplete(result: any) {
    setTranscriptionResult(result);
    setSuccess('Transcrição concluída com sucesso!');
  }

  function handleTranscriptionError(error: string) {
    setError(error);
    setJobId(null);
  }

  function handleReset() {
    setFile(null);
    setJobId(null);
    setTranscriptionResult(null);
    setError(null);
    setSuccess(null);
    setProgress(0);
    uploadSession.completeUpload();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : '0';

  // Se há um jobId em progresso, mostrar o componente de progresso
  if (jobId) {
    return (
      <div className="bg-slate-800 rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Processando Transcrição</h2>
        
        <TranscriptionProgress
          jobId={jobId}
          fileName={file?.name || 'arquivo'}
          startedAt={uploadSession.sessionState.startedAt}
          onComplete={handleTranscriptionComplete}
          onError={handleTranscriptionError}
        />

        {/* Resultado da transcrição com editor */}
        {transcriptionResult && (
          <div className="mt-8">
            <EditableTranscriptionView
              jobId={jobId}
              fileName={file?.name || 'arquivo'}
              result={transcriptionResult}
              onReset={handleReset}
            />
          </div>
        )}

        {/* Mensagens de erro */}
        {error && !transcriptionResult && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
            <button
              onClick={handleReset}
              className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-xl p-8">
      {/* Badge de Status de Conexão */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Upload de Áudio</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
          uploadSession.connectionStatus === 'online' 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            uploadSession.connectionStatus === 'online' 
              ? 'bg-green-400 animate-pulse' 
              : 'bg-yellow-400'
          }`}></span>
          {uploadSession.connectionStatus === 'online' ? '🌐 Online' : '📡 Offline'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção de Gravação */}
        <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-4">🎤 Gravar Áudio em Tempo Real</h3>
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            onError={handleRecorderError}
            disabled={loading}
          />
        </div>

        {/* Separador */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-800 text-slate-400">ou</span>
          </div>
        </div>

        {/* File Input */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="audio/*,video/*"
            disabled={loading}
            className="hidden"
            id="file-input"
          />
          
          <label
            htmlFor="file-input"
            className="flex items-center justify-center w-full px-6 py-8 border-2 border-dashed border-slate-600 rounded-lg hover:border-blue-500 hover:bg-slate-700/50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mt-2 text-slate-300">
                {file ? (
                  <span>
                    <strong>{file.name}</strong> ({fileSizeMB}MB)
                  </span>
                ) : (
                  <>
                    <strong>Clique para enviar</strong> ou arraste o arquivo aqui
                  </>
                )}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Áudio: MP3, WAV, OGG, FLAC, WebM, M4A, AAC, OPUS<br/>
                Vídeo: MP4, MOV, AVI, MKV, WebM, FLV, WMV, e outros (máx 500MB)
              </p>
            </div>
          </label>
        </div>

        {/* Checkbox para gerar sumário */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="generate-summary"
            checked={generateSummary}
            onChange={(e) => setGenerateSummary(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600"
          />
          <label htmlFor="generate-summary" className="text-slate-300 cursor-pointer">
            Gerar resumo/ata de reunião automaticamente
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!file || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Processando...' : 'Processar Áudio'}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
        <p className="text-sm text-slate-300">
          <strong>💡 Dica:</strong> Arquivos maiores levam mais tempo para processar.
          Para arquivos &gt; 50MB, o upload será feito em pedaços automaticamente.
        </p>
      </div>
    </div>
  );
}
