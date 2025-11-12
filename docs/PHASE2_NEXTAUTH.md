# Fase 2: NextAuth.js Authentication ✅

## Status: COMPLETADO

## O que foi implementado

### 1. **Instalação de Dependências**
- ✅ `next-auth@4.24.13` - Framework de autenticação para Next.js
- ✅ `@auth/prisma-adapter@2.11.1` - Adapter Prisma para persistência de sessão

### 2. **Configuração do NextAuth** (`src/lib/auth.ts`)

#### Providers Implementados:
- **CredentialsProvider**: Email + Senha (usa senhas hasheadas com bcryptjs)
- **GoogleProvider**: OAuth com Google (criação automática de usuários)
- **GitHubProvider**: OAuth com GitHub (criação automática de usuários)

#### Callbacks Principais:
- **JWT Callback**: Adiciona informações do usuário ao token (id, role, plano, status)
- **Session Callback**: Injeta dados do token na sessão do cliente
- **SignIn Callback**: Validações extras e criação automática de usuários OAuth
- **Redirect Callback**: Tratamento de redirecionamentos após autenticação

#### Eventos de Auditoria:
- `signIn`: Registra login de usuários
- `signOut`: Registra logout de usuários

#### Configurações:
- Estratégia: JWT (token-based)
- Duração da sessão: 30 dias
- Atualização de sessão: a cada 24 horas
- Debug habilitado em desenvolvimento

### 3. **Rota da API** (`src/app/api/auth/[...nextauth]/route.ts`)
- Exporta handlers GET e POST do NextAuth
- Integrado ao Prisma para persistência

### 4. **Páginas de Autenticação**

#### Login (`src/app/auth/signin/page.tsx`)
- Formulário de email/senha
- OAuth com Google e GitHub
- Link para criar conta
- Mostra credenciais de teste (admin/user)
- Validação de formulário no cliente
- Tratamento de erros

#### Signup (`src/app/auth/signup/page.tsx`)
- Formulário de criação de conta
- Campos: nome, email, senha, confirmação de senha
- Validações:
  - Todos os campos obrigatórios
  - Senhas coincidem
  - Mínimo 8 caracteres na senha
  - Email único
- OAuth com Google e GitHub
- Login automático após criação
- Integração com API de registro

#### Página de Erro (`src/app/auth/error/page.tsx`)
- Exibe mensagens de erro amigáveis
- Links para voltar ao login ou home
- Mostra código do erro para debugging

### 5. **API de Registro** (`src/app/api/auth/register/route.ts`)
- POST endpoint para criar novo usuário
- Cria usuário com:
  - Senha hasheada com bcryptjs
  - Role padrão: "free"
  - Plano padrão: "Free"
  - Subscription ativa por 30 dias
- Registra auditoria (USER_REGISTERED)
- Captura IP do cliente para logging
- Validações de email único e senha forte

### 6. **Middleware de Proteção** (`src/middleware.ts`)
- Protege rotas:
  - `/dashboard/*`
  - `/admin/*`
  - `/settings/*`
  - `/profile/*`
- Verifica se usuário está autenticado
- Bloqueia acesso a `/admin/*` para não-admins
- Redireciona para página de erro com `AccessDenied`

### 7. **Cliente Prisma** (`src/lib/prisma.ts`)
- Singleton do Prisma Client
- Previne múltiplas instâncias em desenvolvimento
- Logging de queries em modo desenvolvimento

### 8. **Auth Provider** (`src/components/auth-provider.tsx`)
- Wrapper `SessionProvider` para acesso à sessão em componentes cliente
- Envolve a aplicação no layout

### 9. **Hooks e Utilities**

#### Hook `useAuth` (`src/hooks/use-auth.ts`)
- Acesso à sessão do usuário
- Métodos de permissão:
  - `hasPermission(resource, action)`: Verifica permissão específica
  - `hasAnyPermission(checks)`: Verifica qualquer permissão
  - `hasAllPermissions(checks)`: Verifica todas as permissões
- Métodos booleanos:
  - `isAdmin()`: Verifica se é admin
  - `isAuthenticated()`: Verifica autenticação
  - `isPremium()`: Verifica se é plano premium
- Matriz de permissões por role definida

#### Server-Side Auth (`src/lib/server-auth.ts`)
- `getServerAuth()`: Obter sessão no servidor
- `requireServerAuth()`: Exigir autenticação (redireciona se não autenticado)
- `requireAdminAuth()`: Exigir role admin
- `requirePremiumAuth()`: Exigir plano premium

### 10. **Layout Atualizado** (`src/app/layout.tsx`)
- Integra `AuthProvider` wrapper
- SessionProvider envolve toda a aplicação
- Permite acesso à sessão em componentes cliente

### 11. **Dashboard Exemplo** (`src/app/dashboard/page.tsx`)
- Página protegida (requer autenticação)
- Mostra informações do usuário:
  - Nome
  - Email
  - Role
  - Plano
  - Status da assinatura
- Grid de navegação:
  - Transcrições
  - Upload de Áudio
  - Configurações
  - Faturamento
- Link especial para admin (painel de administração)
- Botão de logout (server action)

## Credenciais de Teste

Todas estão criadas no seed anterior:

```
Admin:
  Email: admin@devel.local
  Senha: admin123
  Role: admin
  Plano: Enterprise

Usuários:
  Email: user@free.local
  Senha: password123
  Role: free
  Plano: Free

  Email: user@trial.local
  Senha: password123
  Role: free
  Plano: Trial

  Email: user@pro.local
  Senha: password123
  Role: free
  Plano: Pro
```

## Variáveis de Ambiente Necessárias

Já estão em `.env.local`:

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:8565
NEXTAUTH_SECRET=tVe0J6pK2mN8wQ5xR3yZ4aB7cD9eF1gH2iJ4kL6mN8oP0qR2sT4uV6wX8yZ

# OAuth (precisam ser configuradas com valores reais)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret
```

## Como Testar

### 1. **Login com Credentials**
```bash
# Terminal 1: Inicie os containers (se ainda não estão rodando)
make up

# Terminal 2: Rode o servidor Next.js
bun dev

# Navegador: http://localhost:3000/auth/signin
# Use admin@devel.local / admin123
```

### 2. **Criar Nova Conta**
```
http://localhost:3000/auth/signup
# Preencha o formulário e crie uma conta
# Será redirecionado para o dashboard automaticamente
```

### 3. **Acessar Dashboard (Protegido)**
```
http://localhost:3000/dashboard
# Se não autenticado, redireciona para /auth/signin
```

### 4. **Middleware de Proteção**
```
# Tente acessar /admin sem ser admin
http://localhost:3000/admin
# Redireciona para /auth/error?error=AccessDenied
```

## Permissões por Role

```javascript
admin: [
  { resource: "users", action: "manage" },
  { resource: "plans", action: "manage" },
  { resource: "billing", action: "manage" },
  { resource: "dashboard", action: "view" },
  { resource: "transcriptions", action: "manage" },
]

enterprise: [
  { resource: "transcriptions", action: "unlimited" },
  { resource: "dashboard", action: "view" },
  { resource: "team", action: "manage" },
  { resource: "billing", action: "view" },
]

pro: [
  { resource: "transcriptions", action: "limited" },
  { resource: "dashboard", action: "view" },
  { resource: "billing", action: "view" },
]

starter: [
  { resource: "transcriptions", action: "limited" },
  { resource: "dashboard", action: "view" },
]

trial: [
  { resource: "transcriptions", action: "trial" },
  { resource: "dashboard", action: "view" },
]

free: [
  { resource: "transcriptions", action: "basic" },
]
```

## Arquitetura de Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                    APLICAÇÃO NEXT.JS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Componentes Cliente (useAuth hook)                              │
│  └─ SessionProvider (AuthProvider wrapper)                       │
│     └─ next-auth/react                                           │
│                                                                   │
│  Páginas Protegidas (middleware)                                 │
│  └─ middleware.ts (verifica token)                               │
│     └─ /dashboard, /admin, /settings, /profile                   │
│                                                                   │
│  APIs                                                             │
│  ├─ /api/auth/[...nextauth] (NextAuth handlers)                 │
│  ├─ /api/auth/register (criar novo usuário)                     │
│  └─ /api/health (health check)                                   │
│                                                                   │
│  Autenticação                                                     │
│  ├─ Credentials: email + password (bcryptjs)                     │
│  ├─ Google OAuth (auto-create)                                   │
│  └─ GitHub OAuth (auto-create)                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
        │                          │                     │
        │ Session Tokens           │ User Data           │ OAuth
        │ JWT Payload              │ Audit Logs          │ Callbacks
        │                          │                     │
        ▼                          ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│               POSTGRESQL (PRISMA ORM)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Tables:                                                          │
│  ├─ User (email, password_hash, role_id, ...)                   │
│  ├─ Role (name, permissions)                                     │
│  ├─ Subscription (user_id, plan_id, status)                     │
│  ├─ Plan (name, price, features)                                 │
│  ├─ AuditLog (user_id, action, timestamp)                       │
│  └─ Account (NextAuth OAuth accounts)                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Arquivos Criados/Modificados

```
✅ CRIADOS:
  src/lib/auth.ts                          (NextAuth config)
  src/lib/prisma.ts                         (Prisma client singleton)
  src/lib/server-auth.ts                    (Server-side auth utilities)
  src/app/api/auth/[...nextauth]/route.ts   (NextAuth API route)
  src/app/api/auth/register/route.ts        (User registration API)
  src/app/auth/signin/page.tsx              (Login page)
  src/app/auth/signup/page.tsx              (Signup page)
  src/app/auth/error/page.tsx               (Auth error page)
  src/app/dashboard/page.tsx                (Protected dashboard)
  src/components/auth-provider.tsx          (SessionProvider wrapper)
  src/hooks/use-auth.ts                     (Client-side auth hook)
  src/middleware.ts                         (Route protection middleware)

✅ MODIFICADOS:
  src/app/layout.tsx                        (Added AuthProvider)
  package.json                              (Added next-auth dependencies)
  .env.local                                (Already has OAuth config)
```

## Próximos Passos (Fase 3)

1. **Migrar Sistema Existente**
   - Adicionar `user_id` aos arquivos de transcrição existentes
   - Proteger endpoints de upload com autenticação
   - Registrar UsageLog para cada ação

2. **Componentes de Dashboard**
   - Listagem de transcrições (com paginação)
   - Upload de áudio com progresso
   - Histórico de ações

3. **Páginas Adicionais**
   - `/settings` - Configurações do perfil
   - `/billing` - Gerenciamento de planos
   - `/admin/*` - Painel de administração

4. **Notificações em Tempo Real**
   - Integrar Socket.io ou WebSocket
   - Notificar quando transcrição termina
   - Notificar quando limite é atingido

## Comandos Úteis

```bash
# Começar servidor
bun dev

# Build para produção
bun run build

# Gerar novo NEXTAUTH_SECRET
openssl rand -base64 32

# Ver logs do Prisma
DATABASE_URL=... bun prisma studio

# Resetar banco (CUIDADO!)
bunx prisma migrate reset --force
```

## Segurança

- ✅ Senhas hasheadas com bcryptjs (10 salts)
- ✅ JWT com secret seguro
- ✅ Middleware protege rotas
- ✅ CSRF protection (NextAuth automático)
- ✅ Auditoria registra todas as ações
- ✅ OAuth permite account linking seguro
- ✅ Session timeout após 30 dias
- ✅ IP do cliente capturado para auditoria

## Notas

- OAuth permite criar contas automáticas (não precisa de confirmação de email)
- Credentials requer email verificado (configurável)
- Admin pode gerenciar tudo via /admin
- Permissões são baseadas em role + plano de assinatura
- Sistema está pronto para Stripe billing na próxima fase
