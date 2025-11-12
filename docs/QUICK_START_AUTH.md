# 🚀 Quick Start - Testar Autenticação

## Pré-requisitos ✅

- Docker rodando
- Containers `devel-postgres` e `devel-redis` ativos
- Node.js/Bun instalado

## 1️⃣ Iniciar Servidor

```bash
cd /home/marcus/desenvolvimento/Devel

# Instalar dependências (se não fez ainda)
bun install

# Iniciar servidor de desenvolvimento
bun dev
```

Abra em seu navegador: **http://localhost:3000**

---

## 2️⃣ Testar Login

### Opção A: Admin
```
URL: http://localhost:3000/auth/signin
Email: admin@devel.local
Senha: admin123
```

### Opção B: Usuário Free
```
URL: http://localhost:3000/auth/signin
Email: user@free.local
Senha: password123
```

### Opção C: Usuário Pro
```
URL: http://localhost:3000/auth/signin
Email: user@pro.local
Senha: password123
```

---

## 3️⃣ Após Login

✅ Você será redirecionado para **`/dashboard`**

Você verá:
- Seu nome e email
- Sua role (admin, free, etc)
- Seu plano (Free, Pro, Enterprise, etc)
- Cards com links para:
  - Transcrições
  - Upload de Áudio
  - Configurações
  - Faturamento
  - Painel Admin (se for admin)

---

## 4️⃣ Testar Proteção de Rotas

### Teste 1: Dashboard Protegido
```
1. Saia da aplicação (botão Logout)
2. Tente acessar: http://localhost:3000/dashboard
3. ❌ Será redirecionado para /auth/signin
```

### Teste 2: Admin Restrito
```
1. Faça login com user@free.local
2. Tente acessar: http://localhost:3000/admin
3. ❌ Será redirecionado para /auth/error?error=AccessDenied
```

### Teste 3: Admin Permitido
```
1. Faça login com admin@devel.local
2. Tente acessar: http://localhost:3000/admin
3. ✅ Acesso permitido (página ainda em construção)
```

---

## 5️⃣ Testar Criação de Conta

```
URL: http://localhost:3000/auth/signup

Preencha com:
  Nome: Seu Nome
  Email: novo@email.com
  Senha: MinhaPassword123 (mín 8 caracteres)
  Confirmar: MinhaPassword123
```

✅ Novo usuário criado com:
- Role: "free"
- Plano: "Free"
- Assinatura ativa por 30 dias

---

## 6️⃣ Testar Erro de Autenticação

```
URL: http://localhost:3000/auth/signin

Tente login com:
  Email: admin@devel.local
  Senha: senhaerrada
```

❌ Verá mensagem: "Email ou senha inválidos"

---

## 7️⃣ Verificar Dados no Banco

### Usar PgAdmin
```
URL: http://localhost:5050
Email: admin@devel.local
Senha: admin
```

Procure por:
- `public.User` - Usuários criados
- `public.Subscription` - Assinaturas ativas
- `public.AuditLog` - Histórico de logins/logouts

---

## 🐛 Troubleshooting

### Problema: "Não consigo fazer login"
```bash
# Verificar se o banco está de pé
make health

# Verificar logs do container
docker logs devel-postgres

# Resetar banco (CUIDADO!)
bunx prisma migrate reset --force
bunx prisma db seed
```

### Problema: "Página em branco"
```bash
# Verificar console do navegador (F12)
# Verificar logs do servidor
# npm/bun dev mostra os logs

# Limpar cache do navegador (Ctrl+Shift+Delete)
```

### Problema: "Erro 500"
```bash
# Verificar variáveis de ambiente
cat .env.local

# Verificar se DATABASE_URL está correto
# Deve ser: postgresql://devel_user:devel_password@localhost:5433/devel_db
```

---

## 📊 Fluxo Resumido

```
ACESSO
  ↓
[/auth/signin ou /auth/signup]
  ↓
LOGIN SUCESSO
  ↓
[Token JWT criado]
  ↓
[Sessão criada]
  ↓
→ /dashboard
  ↓
[Dados do usuário disponíveis]
  ↓
useAuth() hook → session.user.email, .role, .subscriptionPlan
```

---

## 🔐 Verificar Token JWT

Abra DevTools (F12) → Console e rode:

```javascript
// Verificar a sessão atual
fetch('/api/auth/session')
  .then(r => r.json())
  .then(console.log)
```

---

## ✅ Checklist de Teste

- [ ] Login com email/senha funciona
- [ ] Logout funciona
- [ ] Dashboard carrega após login
- [ ] Dashboard redireciona se não autenticado
- [ ] Criação de conta funciona
- [ ] Admin pode acessar /admin
- [ ] Usuário free não pode acessar /admin
- [ ] Erro de autenticação mostra mensagem
- [ ] Dados aparecem corretamente no dashboard

---

## 🎓 Recursos

- **NextAuth Docs:** https://next-auth.js.org
- **Prisma Docs:** https://www.prisma.io/docs
- **Meu Dashboard:** http://localhost:3000/dashboard

**Divirta-se testando!** 🎉
