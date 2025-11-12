'use client';

import { useState, useEffect, useCallback } from 'react';

interface IDBConfig {
  dbName: string;
  storeName: string;
  version?: number;
}

/**
 * Hook para gerenciar IndexedDB com fallback para localStorage
 * IndexedDB é preferível em mobile por ter limite maior de armazenamento
 * Compatível com iOS/Android + Safari Private Mode
 */
export function useIndexedDB<T>(config: IDBConfig, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [isReady, setIsReady] = useState(false);
  const [useIDB, setUseIDB] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dbName = config.dbName;
  const storeName = config.storeName;
  const version = config.version || 1;
  const localStorageKey = `${dbName}:${storeName}`;

  // Inicializar IndexedDB
  const initDB = useCallback(async (): Promise<IDBDatabase | null> => {
    try {
      return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
          console.warn('⚠️ IndexedDB não disponível, usando localStorage');
          setUseIDB(false);
          resolve(null);
          return;
        }

        const request = window.indexedDB.open(dbName, version);

        request.onerror = () => {
          console.warn('⚠️ Erro ao abrir IndexedDB:', request.error);
          setUseIDB(false);
          resolve(null);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };
      });
    } catch (err) {
      console.warn('⚠️ Erro ao inicializar IndexedDB:', err);
      setUseIDB(false);
      return null;
    }
  }, [dbName, storeName, version]);

  // Salvar dados
  const save = useCallback(
    async (key: string, value: T) => {
      try {
        if (useIDB) {
          const db = await initDB();
          if (db) {
            return new Promise((resolve, reject) => {
              const transaction = db.transaction([storeName], 'readwrite');
              const store = transaction.objectStore(storeName);
              const request = store.put(value, key);

              request.onerror = () => {
                console.error('❌ Erro ao salvar em IndexedDB:', request.error);
                // Fallback para localStorage
                localStorage.setItem(localStorageKey, JSON.stringify(value));
                resolve(null);
              };

              request.onsuccess = () => {
                console.log(`✅ Dados salvos em IndexedDB: ${key}`);
                resolve(null);
              };
            });
          }
        }

        // Fallback para localStorage
        localStorage.setItem(localStorageKey, JSON.stringify(value));
        console.log(`✅ Dados salvos em localStorage: ${localStorageKey}`);
      } catch (err) {
        console.error('❌ Erro ao salvar:', err);
        setError(`Erro ao salvar: ${err}`);
      }
    },
    [useIDB, initDB, storeName, localStorageKey]
  );

  // Carregar dados
  const load = useCallback(
    async (key: string): Promise<T | null> => {
      try {
        if (useIDB) {
          const db = await initDB();
          if (db) {
            return new Promise((resolve) => {
              const transaction = db.transaction([storeName], 'readonly');
              const store = transaction.objectStore(storeName);
              const request = store.get(key);

              request.onerror = () => {
                console.warn('⚠️ Erro ao ler IndexedDB:', request.error);
                // Fallback para localStorage
                const stored = localStorage.getItem(localStorageKey);
                resolve(stored ? JSON.parse(stored) : null);
              };

              request.onsuccess = () => {
                if (request.result) {
                  console.log(`✅ Dados carregados de IndexedDB: ${key}`);
                  resolve(request.result);
                } else {
                  // Fallback para localStorage
                  const stored = localStorage.getItem(localStorageKey);
                  resolve(stored ? JSON.parse(stored) : null);
                }
              };
            });
          }
        }

        // Fallback para localStorage
        const stored = localStorage.getItem(localStorageKey);
        return stored ? JSON.parse(stored) : null;
      } catch (err) {
        console.error('❌ Erro ao carregar:', err);
        setError(`Erro ao carregar: ${err}`);
        return null;
      }
    },
    [useIDB, initDB, storeName, localStorageKey]
  );

  // Deletar dados
  const remove = useCallback(
    async (key: string) => {
      try {
        if (useIDB) {
          const db = await initDB();
          if (db) {
            return new Promise((resolve) => {
              const transaction = db.transaction([storeName], 'readwrite');
              const store = transaction.objectStore(storeName);
              const request = store.delete(key);

              request.onerror = () => {
                console.warn('⚠️ Erro ao deletar de IndexedDB');
                localStorage.removeItem(localStorageKey);
                resolve(null);
              };

              request.onsuccess = () => {
                console.log(`✅ Dados deletados de IndexedDB: ${key}`);
                localStorage.removeItem(localStorageKey);
                resolve(null);
              };
            });
          }
        }

        // Fallback para localStorage
        localStorage.removeItem(localStorageKey);
      } catch (err) {
        console.error('❌ Erro ao deletar:', err);
        setError(`Erro ao deletar: ${err}`);
      }
    },
    [useIDB, initDB, storeName, localStorageKey]
  );

  // Marcar como pronto
  useEffect(() => {
    setIsReady(true);
  }, []);

  return {
    data,
    setData,
    save,
    load,
    remove,
    isReady,
    useIDB,
    error,
  };
}
