# ⏱️ Correção: Timer Contínuo na Página de Upload

## 🔴 Problema Identificado
```
Upload começado (Timer: 0:00)
    ↓
Progresso: 20% (Timer: 0:45)
    ↓
Usuário faz Reload (F5)
    ↓
❌ Timer volta para 0:00 (deveria ser ~0:45)
```

## 🎯 Causa Raiz
O `TranscriptionProgress` inicializava `elapsedTime` em `0` sempre que era remontado (após reload).
Não havia forma de restaurar o tempo real decorrido.

---

## ✅ Solução Implementada

### 1. **Adicionar `startedAt` ao props do TranscriptionProgress**
```typescript
// ANTES ❌
interface TranscriptionProgressProps {
  jobId: string;
  fileName: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

// DEPOIS ✅
interface TranscriptionProgressProps {
  jobId: string;
  fileName: string;
  startedAt?: number;  // ← NOVO! Timestamp do início do upload
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}
```

### 2. **Restaurar tempo decorrido ao montar**
```typescript
// Novo useEffect que executa apenas uma vez ao montar
useEffect(() => {
  if (startedAt) {
    const now = Date.now();
    const elapsed = Math.floor((now - startedAt) / 1000);  // Calcular segundos decorridos
    setElapsedTime(elapsed);
    console.log(`⏱️ Tempo decorrido restaurado: ${elapsed}s`);
  }
}, [startedAt]);
```

**Como funciona:**
1. `startedAt` = 1731392847229 (timestamp quando começou)
2. `now` = 1731392892500 (timestamp atual)
3. `elapsed` = (1731392892500 - 1731392847229) / 1000 = 45 segundos
4. Timer inicia em 0:45 ao invés de 0:00 ✅

### 3. **Passar `startedAt` do session state**
```typescript
// Em upload-audio-form.tsx
<TranscriptionProgress
  jobId={jobId}
  fileName={file?.name || 'arquivo'}
  startedAt={uploadSession.sessionState.startedAt}  // ← NOVO!
  onComplete={handleTranscriptionComplete}
  onError={handleTranscriptionError}
/>
```

---

## 📊 Fluxo Corrigido

```
┌─────────────────────────────────────┐
│ Upload → Processar                  │
│ uploadSession.startUpload()         │
│ └─ startedAt = Date.now()           │
│ └─ Salva em localStorage/IndexedDB  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ TranscriptionProgress renderiza     │
│ └─ Passa startedAt para prop        │
│ └─ Timer inicia de 0:00             │
│ └─ A cada 1s: elapsedTime++         │
└─────────────────────────────────────┘
              ↓
         USUÁRIO FAZ RELOAD (F5)
              ↓
┌─────────────────────────────────────┐
│ UploadAudioForm restaura do session │
│ └─ Lê startedAt do session state    │
│ └─ TranscriptionProgress remonta    │
│ └─ useEffect executa:               │
│    - Calcula tempo decorrido real   │
│    - setElapsedTime(45)             │
│    - Timer já começa em 0:45 ✅    │
└─────────────────────────────────────┘
```

---

## 🧪 Como Testar

### Teste 1: Timer Contínuo
```
1. Ir para /dashboard/upload
2. Selecionar arquivo
3. Clicar "Processar Áudio"
4. Esperar 1-2 minutos (timer deve estar em ~60-120s)
5. Fazer F5 (Reload)
6. ✅ Timer deve continuar de ~60-120s, NÃO voltar para 0:00
```

### Teste 2: Verificar Console Logs
```
F12 → Console → Procurar por:
- "⏱️ Tempo decorrido restaurado: 45s" ← Deve aparecer após reload
```

### Teste 3: Timer Fluindo Corretamente
```
Tempo na página:  0:45s
Faz reload
Tempo após reload: 0:45s (não 0:00s)
Espera 5s
Tempo agora:      0:50s ✅
```

---

## 📋 Mudanças Detalhadas

| Arquivo | Alteração |
|---------|-----------|
| `transcription-progress.tsx` | ✅ Adicionado `startedAt?` prop |
| `transcription-progress.tsx` | ✅ Novo `useEffect` para restaurar tempo |
| `transcription-progress.tsx` | ✅ Console log de restauração |
| `upload-audio-form.tsx` | ✅ Passou `startedAt` para componente |

---

## 🔍 Dados Utilizados

### Do Session State
```typescript
{
  startedAt: 1731392847229,     // ← Timestamp salvo no localStorage/IndexedDB
  jobId: "user_xxx:task_yyy",
  progress: 45,
  status: "PROCESSING",
  ...
}
```

### Cálculo do Timer
```
now = Date.now()                    // Ex: 1731392892500
startedAt = 1731392847229           // Salvo anteriormente
elapsed = (now - startedAt) / 1000  // = 45 segundos
setElapsedTime(45)                  // Timer começa de 0:45
```

---

## 🚀 Resultado Final

**Antes:**
- Upload começa
- Timer: 0:00 → 1:00 → 1:30
- Reload
- Timer volta para: 0:00 ❌

**Depois:**
- Upload começa
- Timer: 0:00 → 1:00 → 1:30
- Reload
- Timer continua de: 1:30 ✅
- Timer segue: 1:30 → 1:31 → 1:32...

---

## 💡 Por Que Funciona

1. **`startedAt` é persistido** em IndexedDB/localStorage quando `startUpload()` é chamado
2. **Ao restaurar sessão** após reload, o `sessionState` contém o `startedAt` original
3. **Componente recebe via prop** o valor de `startedAt` restaurado
4. **useEffect calcula** o tempo decorrido real: `(Date.now() - startedAt) / 1000`
5. **Timer inicia correto** já com o tempo acumulado

---

## 📊 Exemplo Real

```
Momento 1: Inicio do upload
- startedAt = 1731392847229
- elapsedTime = 0s
- Timer exibe: 0:00

Momento 2: Após 45 segundos
- startedAt = 1731392847229 (não muda)
- elapsedTime = 45s
- Timer exibe: 0:45

Momento 3: Usuário faz reload
- Restaura startedAt = 1731392847229 do localStorage
- Calcula: (1731392892500 - 1731392847229) / 1000 = 45s
- elapsedTime = 45s
- Timer exibe: 0:45 ✅ (continua de onde parou)

Momento 4: Após mais 5 segundos
- startedAt = 1731392847229 (não muda)
- elapsedTime = 50s
- Timer exibe: 0:50
```

---

**✨ Agora o timer é contínuo mesmo após reload!** 🕐
