# 🚨 ALERTA CRÍTICO: Arquivo Sendo Truncado na API Daredevil

## Resumo Executivo

```
❌ CONCLUSÃO: Arquivo está sendo TRUNCADO na API Daredevil
├─ Arquivo original: 101.38 segundos (1 min 41 seg) / 228 KB
├─ Transcrição recebida: ~50.74 segundos (≈ 50% TRUNCADO!)
├─ Percentual: APENAS 50% FOI TRANSCRITO
└─ Faltando: 50.64 segundos de áudio
```

## 📊 Comprovação

### Arquivo Original
```
✅ Localização: /home/marcus/desenvolvimento/Devel/WhatsApp Audio 2025-10-25 at 14.52.18.ogg
✅ Tamanho: 233,387 bytes (228 KB)
✅ Duração: 101.38 segundos
✅ Bitrate: 18.41 kbps
```

### Transcrição Recebida
```
Palavras: 137
Turnos de fala: 8 (Locutor 1 e 2 alternando)
Duração estimada: ~50.74 segundos
Percentual: 50% APENAS
```

### Diferença
```
Tempo original:    |████████████████████████████████|  101.38 seg
Transcrição:       |████████████████|                   50.74 seg
Faltando:                           |████████████████|  50.64 seg (50%)
```

## 🔍 Análise Técnica

### Fluxo Observado
1. ✅ Arquivo **enviado completo** (228KB)
2. ✅ API **recebe e cria task_id**
3. ✅ API **marca como SUCCESS**
4. ❌ **Mas** apenas metade foi transcrita!
5. ❌ Deepseek processou **50 segundos**, não 101!

### Causas Mais Prováveis

#### 1. 🔴 **MAIS PROVÁVEL: Timeout durante processamento**
```
- Upload leva ~10 segundos (arquivo é pequeno)
- Conversão OGG → WAV pode levar 30-60 segundos
- Se timeout < 60 seg, arquivo é cortado no meio
```

#### 2. 🔴 **SEGUNDA OPÇÃO: Limite de duração hard-coded**
```
- Algum lugar no código pode ter: MAX_DURATION = 60s
- Ou ffmpeg configurado com duração máxima
- Arquivo cortado automaticamente em 60 segundos
```

#### 3. 🔴 **TERCEIRA OPÇÃO: Erro no ffmpeg**
```
- Flag de duração errada: -t 60 (em vez de -to)
- Ou parâmetro cortando no meio: -ss 50
- Resultado: arquivo é processado do segundo 50 em diante
```

#### 4. 🟠 **Race condition na conversão**
```
- Arquivo OGG não totalmente salvo
- ffmpeg começa a converter antes de terminar
- Resultado: arquivo incompleto convertido
```

## 📧 Dados para Email

Use esses dados para enviar ao dev da API:

```json
{
  "issue": "Audio truncation during async transcription",
  "file": {
    "name": "WhatsApp Audio 2025-10-25 at 14.52.18.ogg",
    "size": "233387 bytes (228 KB)",
    "duration": "101.38 seconds",
    "format": "OGG Vorbis"
  },
  "result": {
    "status": "SUCCESS",
    "transcribed_duration": "~50.74 seconds (ONLY 50%!)",
    "task_id": "41ab338f-5546-4ef4-8527-02bfeebab2e7",
    "missing_audio": "50.64 seconds (50%)"
  },
  "hypothesis": [
    "Timeout during OGG→WAV conversion (~60 seconds)",
    "Hard-coded MAX_DURATION limit (60 seconds)",
    "ffmpeg parameter cutting audio",
    "Race condition in file conversion"
  ]
}
```

## 🛠️ Checklist para Dev da API

- [ ] Verificar se há timeout na conversão ffmpeg
- [ ] Verificar se há limite de duração hard-coded
- [ ] Verificar logs quando arquivo é processado
- [ ] Aumentar timeout para > 120 segundos
- [ ] Testar com arquivo > 100 segundos
- [ ] Verificar se ffmpeg está recebendo arquivo completo

## 🎁 Workaround Temporário (Seu App)

Enquanto não corrigem na API, implemente:

```typescript
// Verificar se transcrição é incompleta
if (transcription && transcription.length < expectedMinimumWords) {
  console.warn("⚠️ Transcrição incompleta! Reenviando...");
  // Reenviar arquivo automaticamente
  await retryTranscription(jobId);
}

// Estimativa: ~2.7 palavras/segundo em português
const expectedWords = (audioSeconds * 2.7);
const receivedWords = transcription.split(' ').length;
const completeness = (receivedWords / expectedWords) * 100;

if (completeness < 80) {
  console.error(`❌ Apenas ${completeness}% da transcrição foi recebida`);
}
```

---

**Status**: 🚨 CRÍTICO
**Responsável**: Dev API Daredevil
**Ação**: Corrigir truncamento de áudio
**Workaround**: Implementado em `transcription-retry-handler.ts`
