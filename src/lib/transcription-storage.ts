// Utilities for managing transcription history in localStorage

import { TranscriptionData, TranscriptionHistory } from './transcription-types';

const STORAGE_KEY = 'transcription_history';
const MAX_ITEMS = 20;

export function getTranscriptionHistory(): TranscriptionData[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history: TranscriptionHistory = JSON.parse(stored);
    return history.transcriptions || [];
  } catch (error) {
    console.error('Error loading transcription history:', error);
    return [];
  }
}

export function saveTranscription(transcription: TranscriptionData): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getTranscriptionHistory();
    
    // Add new transcription at the beginning
    const updatedHistory = [transcription, ...history];
    
    // Keep only the last MAX_ITEMS
    const trimmedHistory = updatedHistory.slice(0, MAX_ITEMS);
    
    const historyData: TranscriptionHistory = {
      transcriptions: trimmedHistory,
      maxItems: MAX_ITEMS,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historyData));
  } catch (error) {
    console.error('Error saving transcription:', error);
  }
}

export function deleteTranscription(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getTranscriptionHistory();
    const filtered = history.filter(t => t.id !== id);
    
    const historyData: TranscriptionHistory = {
      transcriptions: filtered,
      maxItems: MAX_ITEMS,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historyData));
  } catch (error) {
    console.error('Error deleting transcription:', error);
  }
}

export function getTranscription(id: string): TranscriptionData | null {
  const history = getTranscriptionHistory();
  return history.find(t => t.id === id) || null;
}

export function updateTranscription(id: string, updates: Partial<TranscriptionData>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getTranscriptionHistory();
    const index = history.findIndex(t => t.id === id);
    
    if (index === -1) return;
    
    history[index] = { ...history[index], ...updates };
    
    const historyData: TranscriptionHistory = {
      transcriptions: history,
      maxItems: MAX_ITEMS,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historyData));
  } catch (error) {
    console.error('Error updating transcription:', error);
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}
