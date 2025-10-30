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
  asyncTaskId?: string; // ID da tarefa assíncrona se ainda em processamento
}

// Tipos para transcrição assíncrona
export type AsyncTaskStatus = 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'RETRY' | 'CANCELLED';

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
}

export interface AudioInfo {
  format: string;
  duration: number;
  sample_rate: number;
  channels: number;
  file_size_mb: number;
}

export interface AsyncTranscriptionResponse {
  success: boolean;
  transcription?: TranscriptionResult;
  processing_time?: number;
  audio_info?: AudioInfo;
  error?: string;
  cached?: boolean;
}

export interface AsyncTaskResult {
  state: AsyncTaskStatus;
  result?: AsyncTranscriptionResponse;
  progress?: {
    current?: number;
    total?: number;
    percentage?: number;
  };
  error?: string;
}

export interface AsyncTranscriptionTask {
  id: string;
  taskId: string; // ID retornado pela API assíncrona
  localId: string; // ID local para gerenciamento
  fileName: string;
  fileSize: number;
  status: AsyncTaskStatus;
  progress: number; // 0-100
  createdAt: number;
  updatedAt: number;
  result?: AsyncTranscriptionResponse;
  error?: string;
  retries: number;
  maxRetries: number;
  language: string;
  generateSummary: boolean;
  webhookUrl?: string;
  // Dados processados pelos fluxos de AI
  correctedTranscription?: string;
  identifiedTranscription?: string;
  summary?: string;
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

// ============================================
// API Health & Status Types
// ============================================

export interface HealthResponse {
  status: string;
  whisper_model: string;
  supported_formats: string[];
  max_file_size_mb: number;
  temp_dir: string;
}

export interface GPUInfo {
  index: number;
  name: string;
  driver_version?: string;
  compute_capability?: string;
}

export interface GPUMemory {
  gpu: GPUInfo;
  total_memory_mb: number;
  used_memory_mb: number;
  free_memory_mb: number;
  utilization_percent: number;
  temperature_c?: number;
}

export interface GPUStatus {
  gpus: GPUMemory[];
  timestamp: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hit_rate: number;
  total_items: number;
  cache_size_mb: number;
  cache_size_bytes: number;
  timestamp: number;
}

export interface FormatsInfo {
  audio_formats: string[];
  video_formats: string[];
  max_file_size_mb: number;
  special_formats: {
    whatsapp?: string[];
    instagram?: string[];
    social_media?: string[];
  };
}

// ============================================
// Transcription Response Types
// ============================================

export interface TranscribeResponse {
  success: boolean;
  transcription?: TranscriptionResult;
  processing_time?: number;
  audio_info?: AudioInfo;
  error?: string;
  cached?: boolean;
}

export interface AsyncTranscribeResponse {
  success: boolean;
  task_id: string;
  status_url: string;
  message: string;
  submission_time: number;
}

export interface AsyncStatusResponse {
  task_id: string;
  state: AsyncTaskStatus;
  message?: string;
  result?: TranscribeResponse;
  progress?: {
    current?: number;
    total?: number;
    percentage?: number;
  };
}

export interface BatchTranscriptionResponse {
  total_files: number;
  successful: number;
  failed: number;
  results: TranscribeResponse[];
  total_processing_time: number;
}

// ============================================
// Whisper Model Types
// ============================================

export type WhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large';

export type SupportedLanguage = 'pt' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'zh' | 'ko';

export interface WhisperModelInfo {
  name: WhisperModel;
  size_mb: number;
  relative_speed: string;
  accuracy_percent: number;
  description: string;
}

// ============================================
// Request Validation Types
// ============================================

export interface TranscribeRequestParams {
  language?: SupportedLanguage;
  model?: WhisperModel;
}

// ============================================
// Pydantic-aligned Types
// ============================================

/**
 * Segmento individual da transcrição com timestamps
 * Alinhado com: TranscriptionSegment (Pydantic)
 */
export interface TranscriptionSegmentPydantic {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

/**
 * Informações sobre o arquivo de áudio processado
 * Alinhado com: AudioInfo (Pydantic)
 */
export interface AudioInfoPydantic {
  format: string;
  duration: number;
  sample_rate: number;
  channels: number;
  file_size_mb: number;
}

/**
 * Resultado detalhado da transcrição
 * Alinhado com: TranscriptionResult (Pydantic)
 */
export interface TranscriptionResultPydantic {
  text: string;
  segments: TranscriptionSegmentPydantic[];
  language: SupportedLanguage;
  duration: number;
}

/**
 * Resposta completa da API de transcrição
 * Alinhado com: TranscriptionResponse (Pydantic)
 */
export interface TranscriptionResponsePydantic {
  success: boolean;
  transcription?: TranscriptionResultPydantic;
  processing_time: number;
  audio_info?: AudioInfoPydantic;
  error?: string;
  cached: boolean;
}

/**
 * Resposta do endpoint de health check
 * Alinhado com: HealthResponse (Pydantic)
 */
export interface HealthResponsePydantic {
  status: string;
  whisper_model: WhisperModel;
  supported_formats: string[];
  max_file_size_mb: number;
  temp_dir: string;
}

/**
 * Resposta para processamento em lote
 * Alinhado com: BatchTranscriptionResponse (Pydantic)
 */
export interface BatchTranscriptionResponsePydantic {
  total_files: number;
  successful: number;
  failed: number;
  results: TranscriptionResponsePydantic[];
  total_processing_time: number;
}
