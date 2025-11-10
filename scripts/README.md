# Scripts de Teste e Debug

Esta pasta contém scripts para testar e depurar funcionalidades específicas do projeto.

## 🧪 Scripts de Teste

### Testes de Funcionalidades
- **test-simple.sh** - Teste simples do fluxo assíncrono
- **test-multi-user-isolation.sh** - Teste de isolamento multi-usuário
- **test-polling-fix.sh** - Validação do fix de polling infinito

### Testes de Upload
- **test-upload.sh** - Teste básico de upload
- **test-upload-completeness.sh** - Teste para validar que arquivos são enviados completos

### Testes de Deepseek
- **test-deepseek-optimization.sh** - Validação das otimizações do Deepseek
- **test-deepseek-tracking.sh** - Teste do sistema de rastreamento do Deepseek

### Testes de Tracking
- **test-flow-tracking.sh** - Teste do fluxo de tracking de eventos

## 🔍 Scripts de Análise e Debug

- **analyze-flow.sh** - Análise do fluxo de execução
- **analyze-truncation.sh** - Análise de problemas de truncamento
- **debug-flow.sh** - Script de debug do fluxo

## 📝 Como Usar

A maioria dos scripts pode ser executada diretamente:

```bash
cd /caminho/para/projeto
bash scripts/test-simple.sh
```

Alguns scripts podem requerer:
- O servidor rodando (`npm run dev`)
- Arquivos de áudio de teste específicos
- Variáveis de ambiente configuradas

Consulte cada script individualmente para requisitos específicos.

## ⚠️ Nota

Estes scripts foram criados para testes manuais e debugging durante o desenvolvimento.
Eles não são parte do pipeline de CI/CD e podem conter referências a caminhos locais específicos.
