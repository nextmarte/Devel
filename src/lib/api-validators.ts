/**
 * Validadores para requisições da API
 * Espelham os validadores Pydantic do backend
 */

import type { SupportedLanguage, WhisperModel } from './transcription-types';

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  'pt', 'en', 'es', 'fr', 'de', 'it', 'ja', 'zh', 'ko'
] as const;

export const SUPPORTED_MODELS: readonly WhisperModel[] = [
  'tiny', 'base', 'small', 'medium', 'large'
] as const;

export const SUPPORTED_AUDIO_FORMATS = [
  '.mp3', '.wav', '.flac', '.webm', '.opus', '.ogg', '.aac'
] as const;

export const SUPPORTED_VIDEO_FORMATS = [
  '.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm', '.ogv',
  '.ts', '.mts', '.m2ts', '.3gp', '.f4v', '.asf'
] as const;

/**
 * Valida código de idioma
 * @param language - Código do idioma a validar
 * @returns true se válido, false caso contrário
 */
export function validateLanguage(language: string): language is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
}

/**
 * Valida modelo Whisper
 * @param model - Modelo a validar
 * @returns true se válido, false caso contrário
 */
export function validateModel(model: string): model is WhisperModel {
  return SUPPORTED_MODELS.includes(model as WhisperModel);
}

/**
 * Valida formato de áudio
 * @param format - Formato do arquivo
 * @returns true se válido, false caso contrário
 */
export function validateAudioFormat(format: string): boolean {
  const normalizedFormat = format.toLowerCase().startsWith('.') 
    ? format.toLowerCase() 
    : `.${format.toLowerCase()}`;
  return SUPPORTED_AUDIO_FORMATS.includes(normalizedFormat as any);
}

/**
 * Valida formato de vídeo
 * @param format - Formato do arquivo
 * @returns true se válido, false caso contrário
 */
export function validateVideoFormat(format: string): boolean {
  const normalizedFormat = format.toLowerCase().startsWith('.') 
    ? format.toLowerCase() 
    : `.${format.toLowerCase()}`;
  return SUPPORTED_VIDEO_FORMATS.includes(normalizedFormat as any);
}

/**
 * Valida se o formato é áudio ou vídeo
 * @param format - Formato do arquivo
 * @returns true se válido, false caso contrário
 */
export function validateMediaFormat(format: string): boolean {
  return validateAudioFormat(format) || validateVideoFormat(format);
}

/**
 * Obtém extensão do arquivo
 * @param filename - Nome do arquivo
 * @returns Extensão com ponto (ex: '.mp3')
 */
export function getFileExtension(filename: string): string {
  const match = filename.match(/\.[^/.]+$/);
  return match ? match[0].toLowerCase() : '';
}

/**
 * Valida requisição de transcrição
 * @param language - Código do idioma
 * @param model - Modelo Whisper
 * @returns Objeto com status de validação e mensagens de erro
 */
export function validateTranscribeRequest(
  language?: string,
  model?: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (language && !validateLanguage(language)) {
    errors.push(`Idioma '${language}' não suportado. Use: ${SUPPORTED_LANGUAGES.join(', ')}`);
  }

  if (model && !validateModel(model)) {
    errors.push(`Modelo '${model}' não suportado. Use: ${SUPPORTED_MODELS.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida arquivo de mídia antes do upload
 * @param file - Arquivo a validar
 * @param maxSizeMb - Tamanho máximo em MB
 * @returns Objeto com status de validação e mensagens de erro
 */
export function validateMediaFile(
  file: File,
  maxSizeMb: number = 500
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const fileSizeMb = file.size / (1024 * 1024);
  const fileExtension = getFileExtension(file.name);

  // Validar tamanho
  if (fileSizeMb > maxSizeMb) {
    errors.push(`Arquivo muito grande (${fileSizeMb.toFixed(2)}MB). Máximo: ${maxSizeMb}MB`);
  }

  // Validar formato
  if (!validateMediaFormat(fileExtension)) {
    errors.push(
      `Formato '${fileExtension}' não suportado. Áudio: ${SUPPORTED_AUDIO_FORMATS.join(', ')} | Vídeo: ${SUPPORTED_VIDEO_FORMATS.join(', ')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normaliza parâmetros de requisição
 * @param language - Código do idioma (padrão: 'pt')
 * @param model - Modelo Whisper (opcional)
 * @returns Parâmetros normalizados
 */
export function normalizeTranscribeParams(
  language: string = 'pt',
  model?: string
): { language: SupportedLanguage; model?: WhisperModel } {
  const normalizedLanguage = validateLanguage(language) ? language : 'pt';
  const normalizedModel = model && validateModel(model) ? model : undefined;

  return {
    language: normalizedLanguage,
    model: normalizedModel,
  };
}
