/**
 * Utilitários para otimizar upload de arquivos grandes
 */

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileValidation {
  isValid: boolean;
  error?: string;
  estimatedDuration?: number;
}

// Formatos de arquivo suportados e suas configurações
const SUPPORTED_FORMATS = {
  audio: {
    mimeTypes: [
      'audio/mpeg',     // mp3
      'audio/wav',      // wav
      'audio/ogg',      // ogg
      'audio/webm',     // webm
      'audio/flac',     // flac
      'audio/m4a',      // m4a
      'audio/aac',      // aac
    ],
    extensions: ['mp3', 'wav', 'ogg', 'webm', 'flac', 'm4a', 'aac', 'aiff'],
    maxSize: 500 * 1024 * 1024, // 500MB
  },
  video: {
    mimeTypes: [
      'video/mp4',
      'video/quicktime',    // mov
      'video/x-msvideo',    // avi
      'video/x-matroska',   // mkv
      'video/webm',
      'video/ogg',
    ],
    extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'ogv', 'flv'],
    maxSize: 1024 * 1024 * 1024, // 1GB
  },
};

/**
 * Valida arquivo antes do upload
 */
export function validateFile(file: File): FileValidation {
  // Verificar tamanho
  const audioFormats = SUPPORTED_FORMATS.audio;
  const videoFormats = SUPPORTED_FORMATS.video;
  
  const isAudio = audioFormats.mimeTypes.includes(file.type) ||
    audioFormats.extensions.includes(file.name.split('.').pop()?.toLowerCase() || '');
  
  const isVideo = videoFormats.mimeTypes.includes(file.type) ||
    videoFormats.extensions.includes(file.name.split('.').pop()?.toLowerCase() || '');
  
  if (!isAudio && !isVideo) {
    return {
      isValid: false,
      error: `Formato não suportado: ${file.type || file.name.split('.').pop()}`,
    };
  }

  const maxSize = isAudio ? audioFormats.maxSize : videoFormats.maxSize;
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
}

/**
 * Estima duração do áudio/vídeo
 */
export async function estimateMediaDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    
    const handleLoadedMetadata = () => {
      const duration = audio.duration;
      audio.pause();
      audio.currentTime = 0;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(0); // Retornar 0 se não conseguir obter duração
    }, { once: true });
    
    audio.src = url;
  });
}

/**
 * Faz upload do arquivo com progresso
 * Usa FormData para envio
 */
export async function uploadFileWithProgress(
  file: File,
  onProgress: (progress: UploadProgress) => void,
  apiUrl: string,
  jobId: string,
  language: string = 'pt'
): Promise<{ taskId: string; success: boolean }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    
    formData.append('file', file);
    formData.append('language', language);
    formData.append('webhook_url', '');
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage,
        });
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            taskId: response.task_id,
            success: true,
          });
        } catch (error) {
          reject(new Error('Resposta inválida do servidor'));
        }
      } else {
        reject(new Error(`Upload falhou com status ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Erro de conexão durante upload'));
    });
    
    xhr.open('POST', `${apiUrl}/api/transcribe/async`);
    xhr.send(formData);
  });
}

/**
 * Divide arquivo em chunks para upload otimizado
 * (util para arquivos muito grandes)
 */
export async function uploadFileInChunks(
  file: File,
  chunkSize: number = 10 * 1024 * 1024, // 10MB padrão
  onProgress: (progress: UploadProgress) => void,
  apiUrl: string
): Promise<string> {
  const totalChunks = Math.ceil(file.size / chunkSize);
  let uploadedSize = 0;
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    // Enviar chunk
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', String(i));
    formData.append('totalChunks', String(totalChunks));
    formData.append('fileName', file.name);
    
    await fetch(`${apiUrl}/api/upload/chunk`, {
      method: 'POST',
      body: formData,
    });
    
    uploadedSize += chunk.size;
    onProgress({
      loaded: uploadedSize,
      total: file.size,
      percentage: Math.round((uploadedSize / file.size) * 100),
    });
  }
  
  return 'success';
}

/**
 * Obtém informações detalhadas do arquivo
 */
export async function getFileInfo(file: File): Promise<{
  name: string;
  size: number;
  sizeFormatted: string;
  type: string;
  duration: number;
  durationFormatted: string;
}> {
  const duration = await estimateMediaDuration(file);
  
  const sizeFormatted = file.size > 1024 * 1024
    ? `${(file.size / (1024 * 1024)).toFixed(2)}MB`
    : `${(file.size / 1024).toFixed(2)}KB`;
  
  const durationFormatted = formatDuration(duration);
  
  return {
    name: file.name,
    size: file.size,
    sizeFormatted,
    type: file.type,
    duration,
    durationFormatted,
  };
}

/**
 * Formata duração em minutos:segundos
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '--:--';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
