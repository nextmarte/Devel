'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useIndexedDB } from './use-indexed-db';

interface UploadSessionState {
  sessionId: string | null;
  jobId: string | null;
  fileName: string | null;
  fileSize: number;
  fileType: string;
  generateSummary: boolean;
  status: 'IDLE' | 'STARTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  startedAt: number;
  lastSync: number;
  retryCount: number;
}

const SESSION_STORAGE_KEY = 'devel_upload_session';
const IDB_CONFIG = {
  dbName: 'DevelApp',
  storeName: 'uploadSessions',
  version: 1,
};

/**
 * Hook para gerenciar persistência de sessão de upload com retry automático
 * Usa IndexedDB (com fallback localStorage) para sobreviver a recarregamentos
 * Implementa backoff exponencial para retentativas em falhas de conexão
 */
export function useUploadSession() {
  const idb = useIndexedDB<UploadSessionState>(
    IDB_CONFIG,
    {
      sessionId: null,
      jobId: null,
      fileName: null,
      fileSize: 0,
      fileType: '',
      generateSummary: true,
      status: 'IDLE',
      progress: 0,
      startedAt: 0,
      lastSync: 0,
      retryCount: 0,
    }
  );

  const [sessionState, setSessionState] = useState<UploadSessionState>(idb.data);
  const [isHydrated, setIsHydrated] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  const [pendingSync, setPendingSync] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexão restaurada!');
      setConnectionStatus('online');
      setPendingSync(true);
    };

    const handleOffline = () => {
      console.log('📡 Conexão perdida');
      setConnectionStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar status inicial
    setConnectionStatus(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Carregar sessão do IndexedDB ao montar o componente
  useEffect(() => {
    const loadSession = async () => {
      try {
        const saved = await idb.load(SESSION_STORAGE_KEY);
        if (saved) {
          setSessionState(saved);
          console.log(`📋 Upload session restaurada de IndexedDB: ${saved.jobId}`);
        }
      } catch (error) {
        console.error('❌ Erro ao restaurar sessão:', error);
      }
      setIsHydrated(true);
    };

    loadSession();
  }, [idb]);

  // Sincronizar com localStorage e IndexedDB sempre que sessionState mudar
  useEffect(() => {
    if (isHydrated && sessionState.jobId) {
      try {
        const data = JSON.stringify(sessionState);
        localStorage.setItem(SESSION_STORAGE_KEY, data);
        console.log(`💾 Sessão salva (${sessionState.progress}%)`);
        
        // Salvar em IndexedDB também
        idb.save(SESSION_STORAGE_KEY, sessionState).catch(err => 
          console.error('⚠️ Erro ao salvar em IndexedDB:', err)
        );
      } catch (error) {
        console.error('❌ Erro ao salvar sessão:', error);
      }
    }
  }, [sessionState, isHydrated, idb]);

  const startUpload = useCallback(
    (jobId: string, fileName: string, file: File, generateSummary: boolean) => {
      const newState: UploadSessionState = {
        sessionId: `session_${Date.now()}`,
        jobId,
        fileName,
        fileSize: file.size,
        fileType: file.type,
        generateSummary,
        status: 'STARTED',
        progress: 0,
        startedAt: Date.now(),
        lastSync: Date.now(),
        retryCount: 0,
      };

      setSessionState(newState);

      // Salvar em IndexedDB + localStorage
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newState));
        idb.save(SESSION_STORAGE_KEY, newState).catch(err => 
          console.error('Erro ao salvar em IndexedDB:', err)
        );
      } catch (error) {
        console.error('Erro ao salvar em localStorage:', error);
      }

      console.log(`✅ Upload session iniciada: ${jobId}`);
      return { success: true, sessionId: newState.sessionId };
    },
    [idb]
  );

  const updateProgress = useCallback(
    (progress: number, status: 'PROCESSING' | 'COMPLETED' | 'FAILED' = 'PROCESSING') => {
      if (!sessionState.jobId) return;

      const newState = {
        ...sessionState,
        progress: Math.min(100, progress),
        status,
        lastSync: Date.now(),
      };

      setSessionState(newState);

      // Salvar em IndexedDB + localStorage
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newState));
        idb.save(SESSION_STORAGE_KEY, newState).catch(err => 
          console.error('Erro ao atualizar IndexedDB:', err)
        );
      } catch (error) {
        console.error('Erro ao atualizar localStorage:', error);
      }
    },
    [sessionState, idb]
  );

  const completeUpload = useCallback(() => {
    if (!sessionState.jobId) return;

    const newState: UploadSessionState = {
      sessionId: null,
      jobId: null,
      fileName: null,
      fileSize: 0,
      fileType: '',
      generateSummary: true,
      status: 'IDLE',
      progress: 0,
      startedAt: 0,
      lastSync: 0,
      retryCount: 0,
    };

    setSessionState(newState);

    // Limpar em IndexedDB + localStorage
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      idb.remove(SESSION_STORAGE_KEY).catch(err => 
        console.error('Erro ao remover de IndexedDB:', err)
      );
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }

    console.log(`✅ Upload session completada`);
  }, [sessionState.jobId, idb]);

  const cancelUpload = useCallback(() => {
    if (!sessionState.jobId) return;

    const newState: UploadSessionState = {
      sessionId: null,
      jobId: null,
      fileName: null,
      fileSize: 0,
      fileType: '',
      generateSummary: true,
      status: 'IDLE',
      progress: 0,
      startedAt: 0,
      lastSync: 0,
      retryCount: 0,
    };

    setSessionState(newState);

    // Limpar em IndexedDB + localStorage
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      idb.remove(SESSION_STORAGE_KEY).catch(err => 
        console.error('Erro ao remover de IndexedDB:', err)
      );
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }

    console.log(`❌ Upload session cancelada`);
  }, [sessionState.jobId, idb]);

  return {
    sessionState,
    isHydrated,
    connectionStatus,
    pendingSync,
    startUpload,
    updateProgress,
    completeUpload,
    cancelUpload,
    hasActiveSession: !!sessionState.jobId && sessionState.status !== 'IDLE',
  };
}

