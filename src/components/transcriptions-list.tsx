'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getUserTranscriptions, deleteTranscription } from '@/app/actions-protected';

interface Transcription {
  id: string;
  file_name: string;
  status: string;
  created_at: Date;
  summary: string | null;
}

export function TranscriptionsList() {
  const { user } = useAuth();
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTranscriptions();
  }, []);

  async function fetchTranscriptions() {
    try {
      setLoading(true);
      const result = await getUserTranscriptions(10, 0);
      if (result.error) {
        setError(result.error);
      } else {
        setTranscriptions(result.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar transcrições');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Tem certeza que deseja deletar esta transcrição?')) {
      return;
    }

    try {
      setDeleting(id);
      const result = await deleteTranscription(id);
      if (result.success) {
        setTranscriptions(transcriptions.filter(t => t.id !== id));
      } else {
        setError(result.error || 'Erro ao deletar transcrição');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar transcrição');
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (transcriptions.length === 0) {
    return (
      <div className="text-center py-12">
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
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm0 0V6m12 3v13m0 0c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
          />
        </svg>
        <p className="mt-4 text-slate-400">Nenhuma transcrição ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transcriptions.map((transcription) => (
        <div
          key={transcription.id}
          className="bg-slate-700/50 hover:bg-slate-700 rounded-lg p-4 transition-colors group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-white font-semibold truncate">
                {transcription.file_name}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                <span>Status: {transcription.status}</span>
                <span>
                  {new Date(transcription.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              {transcription.summary && (
                <p className="mt-3 text-slate-300 text-sm line-clamp-2">
                  {transcription.summary}
                </p>
              )}
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                Ver
              </button>
              <button
                onClick={() => handleDelete(transcription.id)}
                disabled={deleting === transcription.id}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white text-sm rounded transition-colors"
              >
                {deleting === transcription.id ? '...' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
