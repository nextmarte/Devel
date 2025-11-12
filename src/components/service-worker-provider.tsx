'use client';

import { useEffect, ReactNode } from 'react';

interface ServiceWorkerProviderProps {
  children: ReactNode;
}

/**
 * Provider para registrar e gerenciar Service Worker
 * Permite sincronização em background no mobile
 */
export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      // Verificar se é mobile/PWA
      const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent
      );

      console.log('📝 Tentando registrar Service Worker...');
      console.log('   URL: /service-worker.js');
      console.log('   Escopo: /');

      // Registrar Service Worker
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      console.log('✅ Service Worker registrado com sucesso');
      console.log('   Estado:', registration.active ? 'ATIVO' : 'AGUARDANDO');

      // Verificar se há atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 Nova versão do Service Worker disponível');
              // Notificar usuário sobre atualização (opcional)
            }
          });
        }
      });

      // Solicitar sincronização em background se estiver online
      if (isMobile && 'sync' in registration) {
        try {
          await (registration as any).sync.register('sync-upload-session');
          console.log('📤 Background Sync registrado');
        } catch (err) {
          console.warn('⚠️ Background Sync não disponível:', err);
        }
      }

      // Ouvir mensagens do Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_UPDATE') {
          console.log('📬 Sincronização recebida:', event.data);
          // Disparar event personalizado para componentes atualizarem
          window.dispatchEvent(
            new CustomEvent('sw:sync-update', { detail: event.data })
          );
        }
      });

      // Registrar periodic sync se disponível (Android)
      if ('periodicSync' in registration) {
        try {
          await (registration as any).periodicSync.register('check-upload-status', {
            minInterval: 60000, // 1 minuto
          });
          console.log('⏰ Sincronização periódica registrada');
        } catch (err) {
          console.warn('⚠️ Sincronização periódica não disponível:', err);
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao registrar Service Worker:');
      console.error('   Message:', error?.message);
      console.error('   Stack:', error?.stack);
      console.error('   Objeto completo:', error);
      
      // Feedback mais detalhado
      if (error?.message?.includes('404')) {
        console.error('   ⚠️ Arquivo service-worker.js não encontrado em /public');
      } else if (error?.message?.includes('insecure')) {
        console.warn('   ℹ️ Service Workers requerem HTTPS em produção');
      }
    }

  };

  return children;
}
