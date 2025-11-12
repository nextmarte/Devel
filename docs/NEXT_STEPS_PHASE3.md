# 🎯 Próximos Passos - Fase 3

## Status Atual
- ✅ **Fase 1:** Setup Base + Docker - 100% Completa
- ✅ **Fase 2:** NextAuth.js Authentication - 100% Completa
- ⏳ **Fase 3:** Integração do Sistema Existente - **Próximo**

---

## 📋 O que Precisa Ser Feito na Fase 3

### 1. Dependências Adicionais

Instale pacotes necessários para integração e billing:

```bash
cd /home/marcus/desenvolvimento/Devel

# Validação de dados
bun add zod

# Stripe para billing (opcional para esta fase)
bun add stripe @stripe/stripe-js

# Email para notificações
bun add nodemailer

# Tipos
bun add -D @types/nodemailer
```

### 2. Integração do Sistema Existente

#### A. Migrar Endpoints de Transcrição

**Arquivo:** `src/app/actions.ts` (ou onde estão suas server actions)

Adicione autenticação a cada ação:

```typescript
import { requireServerAuth } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function uploadTranscription(formData: FormData) {
  // 1. Exigir autenticação
  const session = await requireServerAuth();
  
  // 2. Obter file
  const file = formData.get("file") as File;
  
  // 3. Verificar permissão
  const hasPermission = /* sua lógica */;
  if (!hasPermission) {
    throw new Error("Sem permissão");
  }
  
  // 4. Registrar UsageLog
  await prisma.usageLog.create({
    data: {
      user_id: session.user.id,
      action_type: "transcription_upload",
      file_size: file.size,
      cost: calculateCost(file.size),
    },
  });
  
  // 5. Processar upload (sua lógica existente)
  // ...
}
```

#### B. Adicionar user_id a Transcriptions

Seu modelo `Transcription` já tem `user_id`, apenas garanta que está sendo populado:

```prisma
model Transcription {
  id            String   @id @default(cuid())
  user_id       String   @db.Uuid  // ← Garanta que está aqui
  user          User     @relation(fields: [user_id], references: [id])
  // ... resto dos campos
}
```

#### C. Proteger Rotas API

```typescript
// src/app/api/transcriptions/upload/route.ts
import { requireServerAuth } from "@/lib/server-auth";

export async function POST(request: Request) {
  const session = await requireServerAuth();
  
  // Seu código de upload
  // ...
  
  // Importante: sempre associar a user_id
  const transcription = await prisma.transcription.create({
    data: {
      user_id: session.user.id,
      // ... resto dos dados
    },
  });
  
  return Response.json(transcription);
}
```

### 3. Criar Componentes de Dashboard

#### A. Listar Transcrições

```typescript
// src/components/transcriptions-list.tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

export function TranscriptionsList() {
  const { user } = useAuth();
  const [transcriptions, setTranscriptions] = useState([]);
  
  useEffect(() => {
    // Buscar transcrições do usuário
    fetch(`/api/transcriptions?user_id=${user?.id}`)
      .then(r => r.json())
      .then(setTranscriptions);
  }, [user?.id]);
  
  return (
    <div>
      {transcriptions.map(t => (
        <div key={t.id}>
          <h3>{t.file_name}</h3>
          <p>{t.status}</p>
        </div>
      ))}
    </div>
  );
}
```

#### B. Upload com Progresso

```typescript
// src/components/upload-audio.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export function UploadAudio() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener("progress", (e) => {
      const percent = (e.loaded / e.total) * 100;
      setProgress(percent);
    });
    
    xhr.addEventListener("load", () => {
      // Upload completo
      console.log("Upload completo!");
    });
    
    xhr.open("POST", "/api/transcriptions/upload");
    xhr.send(formData);
  };
  
  return (
    <input 
      type="file" 
      onChange={handleUpload}
    />
  );
}
```

### 4. Páginas Adicionais

#### A. Settings (`/settings`)

```typescript
// src/app/settings/page.tsx
import { requireServerAuth } from "@/lib/server-auth";

export default async function SettingsPage() {
  const session = await requireServerAuth();
  
  return (
    <div>
      <h1>Configurações</h1>
      <p>Email: {session.user.email}</p>
      <p>Nome: {session.user.name}</p>
      {/* Formulário para atualizar dados */}
    </div>
  );
}
```

#### B. Billing (`/billing`)

```typescript
// src/app/billing/page.tsx
import { requireServerAuth } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export default async function BillingPage() {
  const session = await requireServerAuth();
  
  const subscription = await prisma.subscription.findUnique({
    where: { user_id: session.user.id },
    include: { plan: true },
  });
  
  return (
    <div>
      <h1>Faturamento</h1>
      <p>Plano atual: {subscription?.plan.name}</p>
      <p>Preço: ${subscription?.plan.price}/mês</p>
      {/* Opções para mudar plano */}
    </div>
  );
}
```

#### C. Admin Dashboard (`/admin`)

```typescript
// src/app/admin/page.tsx
import { requireAdminAuth } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await requireAdminAuth();
  
  const users = await prisma.user.findMany({
    include: { subscription: { include: { plan: true } } },
  });
  
  return (
    <div>
      <h1>Painel de Administração</h1>
      <h2>Usuários</h2>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Plano</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.role?.name}</td>
              <td>{user.subscription?.plan.name}</td>
              <td>{/* Ações */}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 5. Implementar UsageLog

Registre todas as ações do usuário:

```typescript
// src/lib/usage-tracker.ts
import { prisma } from "@/lib/prisma";

export async function trackUsage(
  userId: string,
  actionType: string,
  metadata?: any
) {
  await prisma.usageLog.create({
    data: {
      user_id: userId,
      action_type: actionType,
      file_size: metadata?.fileSize || 0,
      duration: metadata?.duration || 0,
      cost: calculateCost(metadata),
    },
  });
}

function calculateCost(metadata?: any): number {
  // Sua lógica de cálculo de custo
  // Baseado em file_size, duration, plano do usuário, etc
  return 0;
}
```

### 6. Implementar Rate Limiting

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.REDIS_URL!,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 por hora
});

export async function checkRateLimit(userId: string) {
  const { success } = await ratelimit.limit(userId);
  return success;
}
```

---

## 🔧 Checklist para Fase 3

- [ ] Instalar dependências adicionais (zod, stripe, nodemailer)
- [ ] Migrar todos os endpoints para usar `requireServerAuth()`
- [ ] Adicionar `user_id` a todas as criações de transcrição
- [ ] Registrar `UsageLog` para cada ação
- [ ] Criar componente `TranscriptionsList`
- [ ] Criar componente `UploadAudio` com progresso
- [ ] Criar página `/settings`
- [ ] Criar página `/billing`
- [ ] Criar página `/admin` com gerenciamento de usuários
- [ ] Implementar rate limiting
- [ ] Implementar notificações por email
- [ ] Testes end-to-end

---

## 📊 Timing Estimado

- **Instalação de dependências**: 15 minutos
- **Migração de endpoints**: 1-2 horas
- **Componentes de dashboard**: 2-3 horas
- **Páginas adicionais**: 2-3 horas
- **Testes e debugging**: 1-2 horas

**Total estimado: 6-12 horas (1-2 dias de trabalho)**

---

## 🚀 Começando

1. Leia a documentação criada:
   - `docs/PHASE2_NEXTAUTH.md` - Entender a autenticação
   - `docs/QUICK_START_AUTH.md` - Testar o login

2. Teste a autenticação funcionando:
   ```bash
   bun dev
   # Abra http://localhost:3000/auth/signin
   ```

3. Comece a integração:
   - Comece pelos endpoints simples
   - Depois migre para os mais complexos
   - Sempre teste após cada mudança

4. Acompanhe o progresso:
   - Atualize `IMPLEMENTATION_CHECKLIST.md`
   - Crie commits com cada funcionalidade
   - Documente problemas encontrados

---

## 📝 Notas Importantes

- ✅ Autenticação está pronta e testada
- ✅ Database schema está pronto
- ⚠️ OAuth (Google/GitHub) precisa de configuração
- ⚠️ Stripe está como placeholder para Fase 6
- ✅ Rate limiting pode usar Redis já disponível

---

## 📞 Suporte

Problemas encontrados durante Fase 3? Verifique:

1. Está autenticado? Use `requireServerAuth()`
2. Está registrando no UsageLog?
3. Está adicionando user_id?
4. Está tratando erros adequadamente?

---

## 🎓 Próximas Documentações a Criar

Na Fase 3, criar:
- `docs/PHASE3_INTEGRATION.md` - Guia completo
- `docs/API_MIGRATION_GUIDE.md` - Como migrar endpoints
- `docs/USAGE_TRACKING.md` - Sistema de rastreamento

---

**Boa sorte na Fase 3! 🚀**
