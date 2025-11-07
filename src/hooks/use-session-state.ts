'use client';

import { useState, useEffect } from 'react';

interface SessionState {
  currentJobId: string | null;
  isProcessing: boolean;
  useAsyncMode: boolean;
  fileName: string;
  audioDuration: number;
}

const SESSION_STATE_KEY = 'app_session_state';

const defaultState: SessionState = {
  currentJobId: null,
  isProcessing: false,
  useAsyncMode: false,
  fileName: '',
  audioDuration: 0,
};

/**
 * Hook para gerenciar estado da sessão que persiste entre recargas
 */
export function useSessionState() {
  const [sessionState, setSessionStateInternal] = useState<SessionState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Carregar estado salvo na montagem
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SESSION_STATE_KEY);
        console.log('🔍 Verificando localStorage:', saved);
        if (saved) {
          const parsed = JSON.parse(saved) as SessionState;
          console.log('🔄 Restaurando estado da sessão:', parsed);
          setSessionStateInternal(parsed);
        } else {
          console.log('📭 Nenhum estado salvo encontrado');
        }
      } catch (error) {
        console.error('Erro ao restaurar estado da sessão:', error);
      } finally {
        setIsHydrated(true);
        console.log('✅ Hidratação completa');
      }
    }
  }, []);

  // Salvar estado sempre que mudar
  const setSessionState = (newState: Partial<SessionState>) => {
    setSessionStateInternal((prev) => {
      const updated = { ...prev, ...newState };
      
      // Persistir no localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(updated));
          console.log('💾 Estado da sessão salvo:', updated);
        } catch (error) {
          console.error('Erro ao salvar estado da sessão:', error);
        }
      }
      
      return updated;
    });
  };

  // Limpar estado da sessão
  const clearSessionState = () => {
    console.log('🧹 Limpando estado da sessão');
    setSessionStateInternal(defaultState);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STATE_KEY);
    }
  };

  return {
    sessionState,
    setSessionState,
    clearSessionState,
    isHydrated, // Use para evitar renderizar antes de carregar o estado
  };
}
