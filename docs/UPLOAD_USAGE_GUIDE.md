# 📊 Guia de Uso - Otimizações de Upload

## Exemplo de Fluxo Otimizado

### Antes (Lento ❌)
```
Usuário clica em Upload
    ↓ (sem feedback)
Arquivo sendo enviado... (sem progresso)
    ↓ (demora 30s+)
"Erro: Arquivo muito grande" ← APENAS AGORA descobre o problema
Banda desperdiçada ❌
```

### Depois (Rápido ✅)
```
Usuário clica em Upload
    ↓
Validação instantânea
    ├─ Formato: ✅ MP3
    ├─ Tamanho: ✅ 250MB (< 500MB)
    ├─ Duração: ✅ 45 minutos
    ✓ Arquivo OK!
    ↓
Upload com Progresso Visual
    ├─ 0% → 10% → 25% → 50% → 100%
    ├─ Pode cancelar a qualquer momento
    ✓ Upload Completo
    ↓
Processamento no servidor (polling com status)
    ✓ Resultado final
```

## Componentes Disponíveis

### `<FileUploadProgress />`

Mostra progresso visual durante upload:

```tsx
<FileUploadProgress
  fileName="meeting-2025-11-07.mp3"
  fileSize="250.45 MB"
  duration="45:32"
  uploadProgress={65}           // 0-100
  isUploading={true}
  error={null}                  // ou mensagem de erro
  onCancel={() => console.log('Cancelado')}
/>
```

### Utilities

#### `validateFile(file: File)`
```typescript
const validation = validateFile(file);
// ✅ { isValid: true }
// ❌ { isValid: false, error: "Arquivo muito grande..." }
```

#### `getFileInfo(file: File)`
```typescript
const info = await getFileInfo(file);
// {
//   name: "audio.mp3",
//   size: 262144000,
//   sizeFormatted: "250.00MB",
//   type: "audio/mpeg",
//   duration: 2732,
//   durationFormatted: "45:32"
// }
```

#### `uploadFileWithProgress(file, onProgress, apiUrl, jobId)`
```typescript
await uploadFileWithProgress(
  file,
  (progress) => {
    console.log(`${progress.percentage}% - ${progress.loaded}/${progress.total}`);
  },
  apiUrl,
  jobId
);
```

## Checklist de Implementação

- ✅ Validação prévia de arquivo
- ✅ Progresso visual em tempo real
- ✅ Estimativa de duração
- ✅ Informações do arquivo (tamanho, formato, duração)
- ✅ Componente visual FileUploadProgress
- ✅ Suporte a múltiplos formatos (audio/video)
- ⏳ Chunking para arquivos > 100MB (implementado, aguardando ativação)
- ⏳ Compressão automática
- ⏳ Conversão de formatos

## Performance esperada

### Conexão 10 Mbps
- Arquivo 100MB: ~80 segundos
- Arquivo 500MB: ~400 segundos (com progresso visual a cada 1%)

### Validação
- Instantânea (< 100ms)
- Antes de começar qualquer upload

### Economia de Banda
- ~15-30% em arquivos rejeitados (pré-validação)
- ~50% em reconexões (chunking, quando ativado)

## Troubleshooting

### "Arquivo muito grande"
→ Máximo 500MB para áudio, 1GB para vídeo

### "Formato não suportado"
→ Use: MP3, WAV, OGG, FLAC, M4A, AAC (áudio) ou MP4, MOV, AVI, MKV (vídeo)

### Upload travado em 99%
→ Verifique conexão, pode ser timeout do servidor. Use "Cancelar" e tente novamente.

### Duração mostrando "--:--"
→ Arquivo pode estar corrompido ou formato não reconhecido pelo navegador.

