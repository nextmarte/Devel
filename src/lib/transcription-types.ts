// Types for transcription management

export interface TranscriptionData {
  id: string;
  timestamp: number;
  duration: number;
  rawTranscription: string;
  correctedTranscription: string;
  identifiedTranscription: string;
  summary: string | null;
  audioUrl?: string;
  fileName?: string;
  edits?: TranscriptionEdit[];
  bookmarks?: Bookmark[];
  notes?: Note[];
}

export interface TranscriptionEdit {
  timestamp: number;
  originalText: string;
  editedText: string;
  position: number;
}

export interface Bookmark {
  id: string;
  timestamp: number;
  position: number;
  label: string;
  color?: string;
}

export interface Note {
  id: string;
  position: number;
  text: string;
  timestamp: number;
}

export interface TranscriptionHistory {
  transcriptions: TranscriptionData[];
  maxItems: number;
}
