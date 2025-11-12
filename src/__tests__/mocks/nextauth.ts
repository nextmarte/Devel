import { vi } from 'vitest';

/**
 * Mock completo do NextAuth para testes unitários
 */

interface MockSession {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
  };
  expires: string;
}

export const mockSession: MockSession = {
  user: {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    role: 'USER',
    subscriptionPlan: 'FREE',
    subscriptionStatus: 'ACTIVE',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h from now
};

export const mockAdminSession: MockSession = {
  user: {
    id: 'test-admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    image: null,
    role: 'ADMIN',
    subscriptionPlan: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockExpiredSession: MockSession = {
  user: {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    role: 'USER',
    subscriptionPlan: 'FREE',
    subscriptionStatus: 'ACTIVE',
  },
  expires: new Date(Date.now() - 1000).toISOString(), // 1 second ago
};

/**
 * Mock do getServerSession do NextAuth
 */
export const mockGetServerSession = vi.fn();

/**
 * Configura o mock de getServerSession para retornar uma sessão
 */
export function setupGetServerSessionMock(session: MockSession | null = mockSession) {
  mockGetServerSession.mockResolvedValue(session);
  return session;
}

/**
 * Configura o mock de getServerSession para retornar erro
 */
export function setupGetServerSessionErrorMock(error: Error) {
  mockGetServerSession.mockRejectedValue(error);
}

/**
 * Mock customizado para requireServerAuth
 * Simula uma função que verifica se o usuário está autenticado
 */
export async function mockRequireServerAuth() {
  const session = await mockGetServerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

/**
 * Mock customizado para requireServerAuthAdmin
 * Simula uma função que verifica se o usuário é admin
 */
export async function mockRequireServerAuthAdmin() {
  const session = await mockGetServerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  // Aqui você poderia verificar se o usuário é admin
  return session;
}

/**
 * Função helper para resetar mocks de NextAuth
 */
export function resetNextAuthMocks() {
  mockGetServerSession.mockReset();
  mockGetServerSession.mockResolvedValue(mockSession);
}

/**
 * Mock do NextAuth Auth Function (usado em auth.ts)
 */
export const mockAuthConfig = {
  providers: [],
  adapter: null,
  callbacks: {
    async jwt({ token }: any) {
      return token;
    },
    async session({ session }: any) {
      return session;
    },
  },
};

/**
 * Simula diferentes tipos de usuários para testes
 */
export function createMockSessionForUser(userId: string, email: string, role: string = 'USER') {
  return {
    user: {
      id: userId,
      email,
      name: `User ${userId}`,
      image: null,
      role, // campo customizado se necessário
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Mock para verificar autorização por user_id
 */
export async function mockVerifyUserAuthorization(userId: string, resourceOwnerId: string) {
  if (userId !== resourceOwnerId) {
    throw new Error('Forbidden');
  }
  return true;
}

/**
 * Mock para verificar se sessão é válida
 */
export function mockIsValidSession(session: MockSession | null): boolean {
  if (!session) return false;
  if (!session.user?.email) return false;
  
  const expiresAt = new Date(session.expires);
  return expiresAt > new Date();
}

/**
 * Reset all NextAuth mocks
 */
export function resetAllNextAuthMocks() {
  resetNextAuthMocks();
}
