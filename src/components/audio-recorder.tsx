'use client';

import { useState, useRef } from 'react';
import { Mic, Square } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onRecordingComplete, onError, disabled = false }: AudioRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleStartRecording = async () => {
    try {
      // Limpar estado anterior
      audioChunksRef.current = [];
      setRecordingTime(0);

      // Solicitar acesso ao microfone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Parar stream
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        // Chamar callback
        onRecordingComplete(audioFile);
        
        // Limpar timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setRecordingTime(0);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Erro ao acessar microfone:', err);
      onError(err.message || 'Não foi possível acessar o microfone');
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Limpar timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={disabled}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-600/50'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-5 h-5" />
              Parar Gravação
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Gravar Áudio
            </>
          )}
        </button>

        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
            <span className="text-slate-300 font-mono">
              {formatTime(recordingTime)}
            </span>
          </div>
        )}
      </div>

      {isRecording && (
        <div className="text-sm text-slate-400">
          🎤 Microfone ativo - Clique em "Parar Gravação" quando terminar
        </div>
      )}
    </div>
  );
}
