# Guia de Teste - Fase 3 ✅

## Pré-requisitos

1. **Containers Rodando**
   ```bash
   # Verifique se estão rodando
   docker ps
   
   # Esperado:
   # - postgres:15 na porta 5433
   # - redis:7 na porta 6380
   ```

2. **Database Sincronizado**
   ```bash
   # Verifique se as migrations foram aplicadas
   bunx prisma db push
   
   # Popule dados de seed (se não foi feito ainda)
   bunx prisma db seed
   ```

3. **Aplicação Iniciada**
   ```bash
   bun dev
   # Acesse: http://localhost:3000
   ```

## Teste 1: Autenticação (Prerequisito)

### Passo 1: Acessar Login
1. Vá para `http://localhost:3000/auth/signin`
2. Use credenciais:
   - **Email**: `admin@devel.local`
   - **Password**: `admin123`
3. Verifique se redireciona para `/dashboard`

**Resultado Esperado**: ✅ Logado com sucesso

---

## Teste 2: Upload de Arquivo

### Passo 1: Acessar Página de Upload
1. No dashboard, clique em "Upload de Áudio" ou vá para `http://localhost:3000/dashboard/upload`
2. Veja as instruções sobre formatos suportados

### Passo 2: Preparar Arquivo
```bash
# Crie um arquivo de teste (se não tiver)
# Pode usar um arquivo MP3, WAV, OGG ou MP4 existente
# Ou baixar um arquivo de teste

# Exemplo com ffmpeg (se tiver instalado):
ffmpeg -f lavfi -i sine=f=1000:d=5 -q:a 9 -acodec libmp3lame test.mp3
```

### Passo 3: Fazer Upload
1. Selecione o arquivo (ou arraste para a área)
2. (Opcional) Marque "Gerar Sumário"
3. Clique "Fazer Upload"
4. Observe a barra de progresso

**Resultado Esperado**: 
- ✅ Arquivo selecionado com sucesso
- ✅ Progresso mostrado
- ✅ Mensagem de sucesso

---

## Teste 3: Ver Histórico de Transcrições

### Passo 1: Acessar Histórico
1. No dashboard, clique em "Minhas Transcrições"
2. Ou vá para `http://localhost:3000/dashboard/transcriptions`

### Passo 2: Verificar Lista
1. Você deve ver o arquivo que fez upload
2. Clique no arquivo para ver detalhes
3. Teste o botão "Deletar" (aparece ao passar o mouse)

**Resultado Esperado**:
- ✅ Arquivo aparece na lista
- ✅ Informações exibidas corretamente
- ✅ Botão delete funciona (com confirmação)

---

## Teste 4: Estatísticas de Uso

### Passo 1: Acessar Estatísticas
1. No dashboard, clique em "Estatísticas"
2. Ou vá para `http://localhost:3000/dashboard/stats`

### Passo 2: Verificar Métricas
1. Verifique que "Transcrições Processadas" mostra o upload
2. Verifique "Custo Total" (deve aparecer valor > 0)
3. Verifique "Tamanho Processado" em GB
4. Verifique "Tempo de Áudio" em horas

**Resultado Esperado**:
- ✅ Números refletem o upload realizado
- ✅ Cálculo de custo correto
- ✅ Dicas de economia aparecem

---

## Teste 5: Configurações

### Passo 1: Acessar Página de Configurações
1. No dashboard, clique em "Configurações"
2. Ou vá para `http://localhost:3000/settings`

### Passo 2: Testar Abas
1. **Perfil**: Vê seu nome e email (ler-apenas)
2. **Senha**: Tente mudar senha (pode ser simulado)
3. **Preferências**: Marque/desmarque notificações
4. **Privacidade**: Veja opções de segurança

**Resultado Esperado**:
- ✅ Todos os formulários aparecem
- ✅ Validações funcionam
- ✅ Mensagens de sucesso/erro aparecem

---

## Teste 6: Faturamento

### Passo 1: Acessar Página de Faturamento
1. No dashboard, clique em "Faturamento"
2. Ou vá para `http://localhost:3000/billing`

### Passo 2: Verificar Informações
1. Seu plano atual deve ser exibido
2. Estatísticas de uso do mês aparecem
3. Todos os planos são listados com preços

### Passo 3: Verificar Histórico
1. Role para baixo até "Histórico de Faturamento"
2. Deve mostrar transações (se houver)

**Resultado Esperado**:
- ✅ Plano atual correto
- ✅ Custos e limite refletem o uso
- ✅ Histórico aparece

---

## Teste 7: Painel de Administração

### Passo 1: Acessar Admin (Seu usuário é admin)
1. No dashboard, clique em "Painel de Administração" (ao final da página)
2. Ou vá para `http://localhost:3000/admin`

### Passo 2: Verificar Seções
1. **Dashboard**: Estatísticas gerais aparecem
2. **Usuários**: Lista de usuários do sistema
3. **Planos**: Planos disponíveis listados
4. **Sistema**: Status de DB, Cache, API

### Passo 3: Testar Acesso Negado
1. (Em outro navegador ou sessão privada)
2. Faça login com `user@devel.local` / `user123`
3. Tente acessar `/admin`
4. Deve mostrar "Acesso Negado"

**Resultado Esperado**:
- ✅ Admin vê tudo
- ✅ User comum vê "Acesso Negado"
- ✅ Proteção funciona

---

## Teste 8: Isolamento de Dados

### Passo 1: Criar 2 Sessões
1. Sessão 1: Logado como `admin@devel.local`
2. Sessão 2: (Nova janela incógnita) `user@devel.local`

### Passo 2: Fazer Upload em Sessão 1
1. Faça upload de um arquivo como admin
2. Veja em `/dashboard/transcriptions`

### Passo 3: Verificar em Sessão 2
1. Na sessão 2 (user), vá para `/dashboard/transcriptions`
2. **Não deve ver** o arquivo do admin

### Passo 4: Fazer Upload em Sessão 2
1. Faça upload de um arquivo como user
2. Veja em `/dashboard/transcriptions`

### Passo 5: Voltar para Sessão 1
1. Atualize `/dashboard/transcriptions`
2. **Não deve ver** o arquivo do user

**Resultado Esperado**:
- ✅ Cada usuário vê apenas seus próprios arquivos
- ✅ Isolamento funciona perfeitamente

---

## Teste 9: Banco de Dados

### Passo 1: Conectar ao PostgreSQL
```bash
# Use DBeaver, pgAdmin, ou psql
# Conexão:
# - Host: localhost
# - Port: 5433
# - Database: devel_db
# - User: devel_user
# - Password: devel_password
```

### Passo 2: Verificar Tabelas
1. Abra a tabela `Transcription`
2. Veja os registros do upload
3. Confirme que têm `user_id` correto

### Passo 3: Verificar Logs
1. Abra a tabela `UsageLog`
2. Procure por registros do seu upload
3. Verifique `file_size` e `cost`

### Passo 4: Verificar Auditoria
1. Abra a tabela `AuditLog`
2. Procure por ações do seu usuário
3. Veja `ip_address`, `user_agent`, `action`

**Resultado Esperado**:
- ✅ Dados aparecem nas tabelas corretas
- ✅ `user_id` está sempre preenchido
- ✅ Logs mostram todas as operações

---

## Teste 10: Segurança

### Passo 1: Tentar Acessar Sem Autenticação
1. Tente acessar `http://localhost:3000/dashboard/upload` sem estar logado
2. Deve redirecionar para login

### Passo 2: Tentar Acessar Admin Sem Permissão
1. Faça login como `user@devel.local`
2. Tente acessar `/admin`
3. Deve mostrar "Acesso Negado"

### Passo 3: Tentar Deletar Arquivo de Outro Usuário
1. (Avançado) Use DevTools para chamar ação `deleteTranscription()`
2. Com ID de arquivo de outro usuário
3. Deve retornar erro de autorização

**Resultado Esperado**:
- ✅ Sem autenticação = redireção
- ✅ Sem role = acesso negado
- ✅ Sem permissão = erro

---

## Checklist Final ✅

- [ ] Login funciona com credenciais corretas
- [ ] Dashboard mostra todos os cards
- [ ] Upload de arquivo funciona
- [ ] Arquivo aparece no histórico
- [ ] Deletar arquivo funciona
- [ ] Estatísticas mostram números corretos
- [ ] Configurações abrem sem erros
- [ ] Faturamento mostra plano atual
- [ ] Admin acessa o painel (user não)
- [ ] Isolamento de dados funciona
- [ ] Dados aparecem no banco de dados
- [ ] Segurança está funcionando

---

## Problemas Comuns

### "Acesso Negado" em `/dashboard`
- **Causa**: Não autenticado
- **Solução**: Vá para `/auth/signin` primeiro

### "Arquivo não aparece" após upload
- **Causa**: Backend não processou
- **Solução**: Verifique se o container de transcrição está rodando
- **Log**: `docker logs daredevil-api` (ou nome do container)

### "Erro ao deletar arquivo"
- **Causa**: Arquivo de outro usuário ou ID inválido
- **Solução**: Refresque a página e tente novamente

### "Custo mostra 0"
- **Causa**: Arquivo não foi registrado como "SUCCESS"
- **Solução**: Verifique status em `/admin` > Sistema

### Números não atualizam em `/dashboard/stats`
- **Causa**: Cache desatualizado
- **Solução**: 
  ```bash
  # Limpe o cache
  docker exec -it redis-container redis-cli FLUSHALL
  ```

---

## Próximas Etapas

Após confirmar que todos os testes passam:

1. **Fase 4**: Otimizações de performance
2. **Fase 5**: Rate limiting e features adicionais
3. **Fase 6**: Integração com Stripe

---

**Última Atualização**: [Data]
**Status**: ✅ Pronto para testes
