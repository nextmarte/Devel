# 🧪 Guia de Teste - Rastreamento Deepseek

## 1. Preparação do Ambiente

### 1.1 Verificar variáveis de ambiente
```bash
# Deve estar configurado em .env.local
NEXT_PUBLIC_DAREDEVIL_API_URL=https://devel.cid-uff.net
GOOGLE_GENKIT_API_KEY=seu_genkit_key
```

### 1.2 Iniciar servidor
```bash
npm run dev
# ou
bun run dev
```

### 1.3 Abrir browser
- URL: http://localhost:3000
- Abrir DevTools: F12
- Ir para aba Console

## 2. Teste Passo-a-Passo

### 2.1 Ativar Modo Assíncrono
1. Na página inicial, veja o switch "Modo Assíncrono (Beta)"
2. Clique para ativar (deve ficar azul)

### 2.2 Fazer Upload de Arquivo
1. Clique em "Enviar Mídia"
2. Selecione um arquivo de áudio (MP3, WAV, etc.)
3. A página deve mostrar "📡 Processando em Background..."

### 2.3 Observar Logs no Browser (DevTools Console)

#### Esperar por logs como:
```
[POLLING] 📊 Eventos de processamento: 3
  1. [correcting] Enviando para Deepseek - Correção de erros (30%)
     └─ ⏱️ 1234ms
  2. [identifying] Enviando para Deepseek - Identificação de locutores (50%)
     └─ ⏱️ 987ms
  3. [summarizing] Enviando para Deepseek - Geração de resumo (70%)
     └─ ⏱️ 1456ms
```

### 2.4 Observar Logs no Server (Terminal)

#### Na primeira requisição (criação):
```
✅ Transcrição iniciada: jobId=session_...:uuid
[STORAGE] 📝 Criando job: session_...:uuid
[STORAGE] ✅ Job criado. Total de jobs: 1
```

#### Nas requisições de polling:
```
[GET /api/jobs/session_...:uuid] Recebido
[STORAGE] ✅ Job encontrado no Map com status: STARTED
[GET /api/jobs/session_...:uuid] ✅ Retornando job com status: STARTED
[GET /api/jobs/session_...:uuid] 📊 Eventos de processamento: 0
```

ou se sincronizar:
```
[SYNC] 🔄 Tentando sincronizar com API
[SYNC] 📡 API response status: 200
[SYNC] 📊 API data state: STARTED
[SYNC] ✅ Job sincronizado: STARTED
[GET /api/jobs/session_...:uuid] 📊 Eventos de processamento: 3
```

## 3. Checklist de Resultado Esperado

### ✅ O que deveria acontecer:

- [ ] Modo async ativado com sucesso
- [ ] Upload inicia job (vê "Job ID: session_...")
- [ ] Status muda para STARTED
- [ ] Componente `ProcessingProgressDetail` aparece na tela (com card gradiente)
- [ ] Card exibe "📊 Progresso de Processamento"
- [ ] Eventos aparecem na lista (correcting, identifying, summarizing)
- [ ] Cada evento mostra ícone, label, percentual, modelo Deepseek, tempo
- [ ] Console exibe `[POLLING] 📊 Eventos de processamento:`
- [ ] Trabalho completa com SUCCESS
- [ ] Transcrição final aparece na tela

### ❌ Possíveis problemas:

| Sintoma | Causa Provável | Solução |
|---------|----------------|---------|
| Component não aparece | import faltando ou renderização condicional errada | Verificar se `asyncJob?.processingEvents` não é undefined |
| Nenhum evento na tela | Flows não chamados ou tracker não registrando | Adicionar console.log nos flows |
| Eventos vazios na API | Map vazio entre requisições | Verificar se createJob sendo chamado para cada requisição |
| Job não encontrado | Primeiro polling antes de job ser criado | Aumentar delay antes de iniciar polling |

## 4. Debug Avançado

### 4.1 Verificar se Job foi criado
```javascript
// No console do browser
// Verificar localStorage
Object.keys(localStorage).filter(k => k.startsWith('job_'))
```

### 4.2 Verificar resposta da API
```javascript
// No console do browser
fetch('/api/jobs/session_...:uuid', {
  headers: { 'X-Session-Id': 'session_...' }
}).then(r => r.json()).then(console.log)
```

### 4.3 Logs importantes no server

Filtrar por tags:
- `[STORAGE]` - operações com job storage
- `[SYNC]` - sincronização com Daredevil API
- `[TRACKER]` - eventos do tracker
- `[DEEPSEEK]` - chamadas ao Deepseek
- `[POLLING]` - polling do cliente
- `[GET /api/jobs/` - requisições ao endpoint

### 4.4 Monitorar Map em tempo real
```bash
# No server, procure por:
[STORAGE] 📊 Jobs disponíveis: ['session_...:uuid']
```

## 5. Próximos Passos se Falhar

1. **Map vazio**: Implementar persistência com banco de dados
2. **Eventos vazios**: Verificar se flows recebem jobId corretamente
3. **Deepseek não retorna**: Verificar credenciais Genkit/Deepseek
4. **Timeout no polling**: Aumentar intervalo de polling no hook

---

**Última atualização**: 6 de novembro de 2025
**Status**: 🟡 Aguardando teste com Deepseek real
