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

// Types para processamento assíncrono
export type AsyncJobStatus = 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'RETRY' | 'CANCELLED';

export interface AsyncJob {
  jobId: string;
  status: AsyncJobStatus;
  fileName: string;
  fileSize: number;
  createdAt: number;
  updatedAt: number;
  result?: {
    rawTranscription: string;
    correctedTranscription: string;
    identifiedTranscription: string;
    summary: string | null;
    processingTime: number;
    audioInfo: {
      format: string;
      duration: number;
      sampleRate: number;
      channels: number;
      fileSizeMb: number;
    };
  };
  error?: string;
  progress?: {
    stage: 'transcribing' | 'correcting' | 'identifying' | 'summarizing' | 'completed';
    percentage: number;
  };
}
