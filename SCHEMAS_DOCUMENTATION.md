# Schemas e Tipos - Documentação

## 📋 Visão Geral

Este documento mapeia os schemas Pydantic do backend com os tipos TypeScript do frontend, garantindo type-safety e validação consistente.

## 🔄 Mapeamento de Tipos

### TranscriptionSegment / TranscriptionSegmentPydantic

**Descrição:** Segmento individual da transcrição com timestamps

**Backend (Pydantic):**
```python
class TranscriptionSegment(BaseModel):
    start: float  # Tempo de início em segundos
    end: float  # Tempo de fim em segundos
    text: str  # Texto transcrito do segmento
    confidence: Optional[float]  # Confiança da transcrição (0-1)
```

**Frontend (TypeScript):**
```typescript
interface TranscriptionSegmentPydantic {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}
```

---

### AudioInfo / AudioInfoPydantic

**Descrição:** Informações sobre o arquivo de áudio processado

**Backend:**
```python
class AudioInfo(BaseModel):
    format: str  # Formato do arquivo de áudio
    duration: float  # Duração em segundos
    sample_rate: int  # Taxa de amostragem em Hz
    channels: int  # Número de canais (1=mono, 2=stereo)
    file_size_mb: float  # Tamanho do arquivo em MB
```

**Frontend:**
```typescript
interface AudioInfoPydantic {
  format: string;
  duration: number;
  sample_rate: number;
  channels: number;
  file_size_mb: number;
}
```

---

### TranscriptionResult / TranscriptionResultPydantic

**Descrição:** Resultado detalhado da transcrição

**Backend:**
```python
class TranscriptionResult(BaseModel):
    text: str  # Texto completo da transcrição
    segments: List[TranscriptionSegment]  # Lista com timestamps
    language: str  # Idioma detectado ou configurado
    duration: float  # Duração total em segundos
```

**Frontend:**
```typescript
interface TranscriptionResultPydantic {
  text: string;
  segments: TranscriptionSegmentPydantic[];
  language: SupportedLanguage;  // 'pt' | 'en' | 'es' | etc
  duration: number;
}
```

---

### TranscriptionResponse / TranscriptionResponsePydantic

**Descrição:** Resposta completa da API de transcrição

**Backend:**
```python
class TranscriptionResponse(BaseModel):
    success: bool  # Sucesso da operação
    transcription: Optional[TranscriptionResult]  # Resultado
    processing_time: float  # Tempo em segundos
    audio_info: Optional[AudioInfo]  # Info do áudio
    error: Optional[str]  # Mensagem de erro
    cached: bool  # Veio do cache?
```

**Frontend:**
```typescript
interface TranscriptionResponsePydantic {
  success: boolean;
  transcription?: TranscriptionResultPydantic;
  processing_time: number;
  audio_info?: AudioInfoPydantic;
  error?: string;
  cached: boolean;
}
```

---

### HealthResponse / HealthResponsePydantic

**Descrição:** Resposta do endpoint de health check

**Backend:**
```python
class HealthResponse(BaseModel):
    status: str  # Status do serviço
    whisper_model: str  # Modelo carregado
    supported_formats: List[str]  # Formatos suportados
    max_file_size_mb: int  # Tamanho máximo
    temp_dir: str  # Diretório temporário
```

**Frontend:**
```typescript
interface HealthResponsePydantic {
  status: string;
  whisper_model: WhisperModel;  // 'tiny' | 'base' | etc
  supported_formats: string[];
  max_file_size_mb: number;
  temp_dir: string;
}
```

---

### BatchTranscriptionResponse / BatchTranscriptionResponsePydantic

**Descrição:** Resposta para processamento em lote

**Backend:**
```python
class BatchTranscriptionResponse(BaseModel):
    total_files: int  # Total processado
    successful: int  # Sucesso
    failed: int  # Falhas
    results: List[TranscriptionResponse]  # Resultados individuais
    total_processing_time: float  # Tempo total
```

**Frontend:**
```typescript
interface BatchTranscriptionResponsePydantic {
  total_files: number;
  successful: number;
  failed: number;
  results: TranscriptionResponsePydantic[];
  total_processing_time: number;
}
```

---

## ✅ Validação

### Idiomas Suportados

```typescript
type SupportedLanguage = 'pt' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'zh' | 'ko';
```

**Funções de Validação:**
```typescript
validateLanguage(language: string): language is SupportedLanguage
normalizeTranscribeParams(language?: string, model?: string)
```

### Modelos Whisper

```typescript
type WhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large';
```

**Funções de Validação:**
```typescript
validateModel(model: string): model is WhisperModel
```

### Formatos de Mídia

**Áudio Suportado:**
```
.mp3, .wav, .flac, .webm, .opus, .ogg, .aac
```

**Vídeo Suportado:**
```
.mp4, .avi, .mov, .mkv, .flv, .wmv, .webm, .ogv, .ts, .mts, .m2ts, .3gp, .f4v, .asf
```

**Funções de Validação:**
```typescript
validateMediaFormat(format: string): boolean
validateAudioFormat(format: string): boolean
validateVideoFormat(format: string): boolean
validateMediaFile(file: File, maxSizeMb?: number): { valid: boolean; errors: string[] }
```

---

## 📝 Boas Práticas

### 1. Validar Antes de Enviar

```typescript
import { validateTranscribeRequest, validateMediaFile } from '@/lib/api-validators';

// Validar parâmetros
const validation = validateTranscribeRequest('pt', 'small');
if (!validation.valid) {
  console.error('Erros:', validation.errors);
}

// Validar arquivo
const fileValidation = validateMediaFile(file, 500);
if (!fileValidation.valid) {
  toast({ variant: 'destructive', description: fileValidation.errors[0] });
}
```

### 2. Usar Tipos Corretos

```typescript
import type { 
  TranscriptionResponsePydantic,
  HealthResponsePydantic,
  SupportedLanguage 
} from '@/lib/transcription-types';

const response: TranscriptionResponsePydantic = await fetch(url).then(r => r.json());
const language: SupportedLanguage = 'pt';
```

### 3. Normalizar Parâmetros

```typescript
import { normalizeTranscribeParams } from '@/lib/api-validators';

const params = normalizeTranscribeParams(userLanguage, userModel);
// Garante que tem valores válidos ou padrões
```

---

## 🔗 Referências

- **Backend:** Documentação Pydantic em `schemas.py`
- **Frontend:** Tipos em `src/lib/transcription-types.ts`
- **Validação:** Funções em `src/lib/api-validators.ts`
- **Uso:** Componentes em `src/components/`

---

**Última Atualização:** 30 de outubro de 2025
