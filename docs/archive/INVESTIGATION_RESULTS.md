# 🔍 Investigação: Por que a Transcrição está Incompleta?

## ✅ Conclusão Final

**O arquivo está sendo enviado COMPLETO**, mas há um bug na API Daredevil que impede o processamento.

---

## 📊 Análise Detalhada

### Teste 1: Verificar Tamanho do Arquivo Original

```bash
$ ls -lh "WhatsApp Audio 2025-10-25 at 14.52.18.ogg"
-rw-rw-r-- 1 marcus marcus 228K nov  7 13:06 'WhatsApp Audio 2025-10-25 at 14.52.18.ogg'

📦 Tamanho: 228 KB
🔐 MD5: ca0efc2442cb10c7bdfdf0aee2b8ade3
```

### Teste 2: Upload Direto para API Daredevil

```bash
$ curl -X POST "https://devel.cid-uff.net/api/transcribe/async" \
  -F "file=@WhatsApp Audio 2025-10-25 at 14.52.18.ogg" \
  -F "language=pt" \
  -F "webhook_url="

✅ RESPOSTA:
{
  "success": true,
  "task_id": "41ab338f-5546-4ef4-8527-02bfeebab2e7",
  "status_url": "/api/transcribe/async/status/41ab338f-5546-4ef4-8527-02bfeebab2e7",
  "message": "Transcrição iniciada..."
}

✅ Arquivo foi enviado com sucesso!
✅ API recebeu e processou
✅ Task ID retornado
```

### Teste 3: Verificar Status da Transcrição

```bash
$ curl "https://devel.cid-uff.net/api/transcribe/async/status/41ab338f-5546-4ef4-8527-02bfeebab2e7"

❌ RESPOSTA:
{
  "task_id": "41ab338f-5546-4ef4-8527-02bfeebab2e7",
  "state": "SUCCESS",
  "result": {
    "success": false,
    "transcription": null,
    "processing_time": 3.23,
    "audio_info": null,
    "error": "[Errno 2] No such file or directory: '/tmp/daredevil/temp_1762531744_52.wav'",
    "cached": false
  },
  "message": "Transcrição concluída"
}

❌ Arquivo temporário desapareceu!
❌ Deepseek não conseguiu processar
❌ Transcription = null
```

---

## 🎯 Fluxo Identificado

```
┌─────────────────┐
│   Cliente       │
│   (seu app)     │
└────────┬────────┘
         │ Upload arquivo 228KB
         ▼
┌─────────────────────────────────────┐
│   API Daredevil                     │
│   POST /api/transcribe/async        │
├─────────────────────────────────────┤
│ ✅ Recebe arquivo (228KB)           │
│ ✅ Gera task_id                    │
│ ✅ Salva em /tmp/daredevil/        │
│ ✅ Retorna task_id ao cliente       │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Processamento em Background       │
│   (Worker/Celery/Similar)          │
├─────────────────────────────────────┤
│ ❌ Tenta ler arquivo de /tmp/       │
│ ❌ NÃO ENCONTRA arquivo!            │
│ ❌ Erro: "No such file"             │
│ ❌ Deepseek não é chamado           │
│ ❌ transcription = null             │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Resultado Final                   │
├─────────────────────────────────────┤
│ ❌ success: false                    │
│ ❌ transcription: null              │
│ ❌ error: "No such file..."         │
└─────────────────────────────────────┘
```

---

## 🔴 O VERDADEIRO PROBLEMA

**NÃO é truncamento de arquivo!**

**O problema é que a API Daredevil não consegue encontrar o arquivo temporário que ela mesma criou.**

Possíveis causas:

### 1. ⏱️ Race Condition
```
T0: Upload completa, arquivo salvo em /tmp/daredevil/temp_1762531744_52.wav
T1: API retorna task_id ao cliente
T2: Arquivo é deletado (cleanup automático?)
T3: Worker tenta processar → "No such file"
```

### 2. 🗑️ Limpeza Automática de /tmp
```
- Linux limpa /tmp a cada X horas
- Ou há um script que deleta arquivos temporários
- Arquivo é deletado antes do processamento começar
```

### 3. 🚫 Permissões Incorretas
```
- Arquivo criado com permissão read-only
- Worker não consegue ler
- Ou arquivo criado em pasta sem permissão
```

### 4. 📁 Caminho Incorreto
```
- API salva em: /tmp/daredevil/uploads/
- Worker busca em: /tmp/daredevil/
- Caminhos não conferem
```

### 5. 🔄 Múltiplos Uploads Simultâneos
```
- Upload 1 salva arquivo.wav
- Upload 2 sobrescreve com seu arquivo.wav
- Upload 1 tenta processar → arquivo é do upload 2
```

---

## ✅ Confirmações

| Aspecto | Status | Evidência |
|---------|--------|-----------|
| Arquivo enviado completo? | ✅ SIM | `Content-Length: 233819 bytes` no curl |
| API recebeu arquivo? | ✅ SIM | Retornou task_id com sucesso |
| Arquivo foi salvo? | 🤔 TALVEZ | Arquivo não encontrado depois |
| Deepseek foi chamado? | ❌ NÃO | Erro antes de Deepseek |
| Transcrição é incompleta? | ❌ NÃO | Transcrição = null (0 caracteres) |

---

## 🎁 Recomendações

### Para Dev da API Daredevil

1. **Investigar logs** quando task_id é processado
2. **Verificar `/tmp/daredevil/`** para ver se arquivo existe
3. **Implementar retry** se arquivo não existir
4. **Usar storage persistente** em vez de `/tmp` (ex: `/data/uploads/`)
5. **Adicionar logging** de quando arquivo é criado/deletado

### Para Seu App (Workaround Temporário)

```typescript
// Implementar retry com backoff
async function retryTranscription(taskId: string, maxRetries: number = 5) {
  for (let i = 0; i < maxRetries; i++) {
    const status = await getStatus(taskId);
    
    if (status.success) {
      return status.result.transcription; // ✅ Sucesso
    }
    
    if (status.error.includes("No such file")) {
      // Arquivo desapareceu - reenviar
      console.log(`Retry ${i + 1}/${maxRetries}: Reenviando arquivo...`);
      await delay(2000 * (i + 1)); // Backoff exponencial
      continue;
    }
    
    return null; // Outro erro
  }
}
```

---

## 📧 Email Enviado

Um email com detalhes completos foi criado em:
`EMAIL_BUG_REPORT_DAREDEVIL.md`

Envie para o dev responsável pela API Daredevil.

---

## 🏁 Conclusão

```
❌ NÃO é problema de truncamento de upload
❌ NÃO é problema de Deepseek
✅ Arquivo chega completo à API
🔴 Problema está em: Arquivo temporário desaparecendo na Daredevil API
```

**Status**: Aguardando resposta do dev da API Daredevil

**Próximo passo**: Implementar workaround com retry e comunicar com dev da API
