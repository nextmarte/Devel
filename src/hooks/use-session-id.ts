'use client';

import { useEffect, useState } from 'react';

/**
 * Hook para gerenciar Session ID do usuário
 * Garante isolamento entre usuários/navegadores
 */
export function useSessionId() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Gerar ou recuperar Session ID
    let id = localStorage.getItem('sessionId');

    if (!id) {
      // Gerar novo Session ID único
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sessionId', id);
    }

    setSessionId(id);
  }, []);

  return sessionId;
}

/**
 * Prefixar jobId com sessionId para isolamento
 */
export function prefixJobId(sessionId: string | null, jobId: string): string {
  if (!sessionId) return jobId;
  return `${sessionId}:${jobId}`;
}

/**
 * Remover prefix do jobId
 */
export function unprefixJobId(prefixedId: string): string {
  const parts = prefixedId.split(':');
  return parts.length > 1 ? parts.slice(1).join(':') : prefixedId;
}
