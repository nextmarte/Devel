// Utilities for managing async transcription tasks in localStorage

import { AsyncTranscriptionTask, AsyncTaskStatus } from './transcription-types';

const STORAGE_KEY = 'async_transcription_tasks';
const MAX_ITEMS = 50;

export function getAsyncTasks(): AsyncTranscriptionTask[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const tasks: AsyncTranscriptionTask[] = JSON.parse(stored);
    return tasks || [];
  } catch (error) {
    console.error('Error loading async tasks:', error);
    return [];
  }
}

export function saveAsyncTask(task: AsyncTranscriptionTask): void {
  if (typeof window === 'undefined') return;
  
  try {
    const tasks = getAsyncTasks();
    
    // Remove task anterior se existir com mesmo localId
    const filteredTasks = tasks.filter(t => t.localId !== task.localId);
    
    // Adicionar nova tarefa no início
    const updatedTasks = [task, ...filteredTasks];
    
    // Manter apenas os últimos MAX_ITEMS
    const trimmedTasks = updatedTasks.slice(0, MAX_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedTasks));
  } catch (error) {
    console.error('Error saving async task:', error);
  }
}

export function deleteAsyncTask(localId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const tasks = getAsyncTasks();
    const filtered = tasks.filter(t => t.localId !== localId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting async task:', error);
  }
}

export function getAsyncTask(localId: string): AsyncTranscriptionTask | null {
  const tasks = getAsyncTasks();
  return tasks.find(t => t.localId === localId) || null;
}

export function updateAsyncTask(localId: string, updates: Partial<AsyncTranscriptionTask>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const tasks = getAsyncTasks();
    const index = tasks.findIndex(t => t.localId === localId);
    
    if (index === -1) return;
    
    const updatedTask = { 
      ...tasks[index], 
      ...updates,
      updatedAt: Date.now()
    };
    
    tasks[index] = updatedTask;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error updating async task:', error);
  }
}

export function clearCompletedTasks(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const tasks = getAsyncTasks();
    const filtered = tasks.filter(t => t.status !== 'SUCCESS' && t.status !== 'FAILURE');
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error clearing completed tasks:', error);
  }
}

export function getActiveTasks(): AsyncTranscriptionTask[] {
  const tasks = getAsyncTasks();
  return tasks.filter(t => 
    t.status === 'PENDING' || t.status === 'STARTED' || t.status === 'RETRY'
  );
}

export function getFailedTasks(): AsyncTranscriptionTask[] {
  const tasks = getAsyncTasks();
  return tasks.filter(t => t.status === 'FAILURE');
}

export function getCompletedTasks(): AsyncTranscriptionTask[] {
  const tasks = getAsyncTasks();
  return tasks.filter(t => t.status === 'SUCCESS');
}

// Limpar tarefas antigas (mais de 7 dias)
export function cleanupOldTasks(daysOld: number = 7): void {
  if (typeof window === 'undefined') return;
  
  try {
    const tasks = getAsyncTasks();
    const sevenDaysAgo = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    const filtered = tasks.filter(t => t.createdAt > sevenDaysAgo);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error cleaning up old tasks:', error);
  }
}
