Subject: 🔴 BUG CRÍTICO: Arquivo de áudio temporário desaparecendo na API Daredevil

---

Olá,

Estou relatando um bug crítico na API Daredevil que está impedindo transcrições assíncronas de funcionar.

## 📋 Resumo do Problema

Ao fazer upload de arquivos de áudio via `/api/transcribe/async`, a API retorna um erro indicando que o arquivo temporário não existe:

```json
{
  "error": "[Errno 2] No such file or directory: '/tmp/daredevil/temp_1762531802_52.wav'",
  "state": "SUCCESS",
  "success": false,
  "transcription": null
}
```

## 🔍 Fluxo Observado

1. ✅ Cliente faz upload do arquivo (228KB de áudio .ogg)
2. ✅ API recebe o arquivo e retorna `task_id` com sucesso  
3. ✅ API marca estado como `SUCCESS`
4. ❌ **Mas** o arquivo temporário em `/tmp/daredevil/temp_*.wav` não existe
5. ❌ Deepseek recebe erro "No such file or directory"

**ATUALIZAÇÃO CRÍTICA**: Após análise da transcrição retornada, descobrimos que o problema é **ainda mais grave**:

```
📁 Arquivo original: 101.38 segundos (1 min 41 seg) / 228 KB
📝 Transcrição: ~50.74 segundos APENAS
❌ TRUNCAMENTO: Apenas 50% do áudio foi transcrito!
❌ Faltando: 50.64 segundos
```

Exemplo da transcrição incompleta:
```
Locutor 1: Bom, o Aurélio chegou agora...
Locutor 2: Obrigado. Bom dia a todos...
Locutor 1: Sim, eu tenho. Você acha que o prazo é realista?...
Locutor 2: Entendo a preocupação. Mas a gente já conversou...
[FALTAM ~51 SEGUNDOS AQUI - arquivo foi cortado no meio!]
```

## 📊 Exemplos de task_ids com erro

- `41ab338f-5546-4ef4-8527-02bfeebab2e7` → erro: `/tmp/daredevil/temp_1762531744_52.wav`
- `106c0e21-4adb-4e39-9670-4512d2072f36` → erro: `/tmp/daredevil/temp_1762531802_52.wav`

## 🧪 Teste Realizado

```bash
curl -X POST "https://devel.cid-uff.net/api/transcribe/async" \
  -F "file=@WhatsApp Audio 2025-10-25 at 14.52.18.ogg" \
  -F "language=pt" \
  -F "webhook_url="

# Resposta:
# {"task_id": "41ab338f-5546-4ef4-8527-02bfeebab2e7", "success": true, ...}

# Verificando status:
curl "https://devel.cid-uff.net/api/transcribe/async/status/41ab338f-5546-4ef4-8527-02bfeebab2e7"

# Resposta:
# {"error": "[Errno 2] No such file or directory: '/tmp/daredevil/temp_1762531744_52.wav'", ...}
```

## 🔴 ATUALIZAÇÃO CRÍTICA: Arquivo está sendo TRUNCADO!

Após análise da transcrição recebida, descobrimos que o problema é **ainda mais grave**:

- **Arquivo original**: 101.38 segundos (1 min 41 seg) / 228KB
- **Transcrição recebida**: ~50.74 segundos (≈50% do áudio)
- **Status**: ⚠️ **ARQUIVO SENDO TRUNCADO NO MEIO**

### Exemplo:
```
Áudio original tem 101 segundos
Mas transcrição tem apenas 50 segundos
→ FALTAM 51 SEGUNDOS (50% do arquivo)
```

## ❓ Causa RAIZ Identificada nos Logs

```
❌ Erro de conexão com servidor remoto: HTTPConnectionPool(host='ultron.local', port=8591)
❌ Failed to resolve 'ultron.local' ([Errno -3] Temporary failure in name resolution)
❌ Falha na conversão remota - arquivo não existe: None
```

**O PROBLEMA REAL:**
1. ❌ **Falha de DNS**: Não consegue resolver `ultron.local`
2. ❌ **Máquina remota inacessível**: `192.168.1.29:8591` não responde
3. ❌ **FFmpeg remoto não respondendo**: Não consegue converter OGG → WAV
4. ❌ **Arquivo não convertido**: Fica em formato OGG
5. ❌ **Deepseek recebe OGG**: Não consegue processar, trunca ou retorna vazio

**Checklist para Dev:**
1. Máquina remota (192.168.1.29) está ligada?
2. API FFmpeg em 192.168.1.29:8591 está rodando?
3. DNS resolve 'ultron.local' corretamente?
4. Firewall bloqueando acesso?
5. Credenciais de acesso corretas?

## 🔧 Solicitação

Poderia verificar:

1. Os logs da API quando essa task é processada
2. Se o arquivo está sendo salvo em `/tmp/daredevil/` corretamente
3. Se há permissões corretas para leitura/escrita nessa pasta
4. Se há algum cleanup/garbage collection deletando arquivos temporários prematuramente
5. Se o caminho completo está sendo passado corretamente para o Deepseek

## 📞 Informações do Cliente

- **URL API**: https://devel.cid-uff.net
- **Endpoint**: /api/transcribe/async
- **Arquivo de teste**: WhatsApp Audio 2025-10-25 at 14.52.18.ogg (228KB)
- **Formato**: .ogg (Ogg Vorbis)
- **Idioma**: pt (Português)

Fico no aguardo de uma resposta!

---

Atenciosamente,
Marcus
Desenvolvedor - DareDevil.AI
