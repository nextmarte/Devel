import { vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

/**
 * Mock completo do Prisma Client para testes unitários
 * Fornece mocks para todos os modelos usados em testes
 */

export const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed-password',
  role: 'USER',
  plan: 'FREE',
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
};

export const mockTranscription = {
  id: 'test-transcription-1',
  user_id: 'test-user-1',
  file_name: 'audio.mp3',
  file_path: '/uploads/audio.mp3',
  file_size: 5000000, // 5MB
  file_type: 'audio/mpeg',
  duration: 300, // 5 minutos
  status: 'COMPLETED',
  transcription_text: 'This is a test transcription.',
  summary: 'Test summary',
  cost: 0.50,
  processing_time_ms: 1000,
  created_at: new Date('2024-01-01T10:00:00'),
  updated_at: new Date('2024-01-01T10:00:00'),
  deleted_at: null,
};

export const mockUsageLog = {
  id: 'test-usage-1',
  user_id: 'test-user-1',
  action_type: 'transcribe',
  file_size: 5000000,
  duration: 300,
  cost: 0.50,
  quota_consumed: 1,
  metadata: null,
  timestamp: new Date('2024-01-01T10:00:00'),
};

export const mockAuditLog = {
  id: 'test-audit-1',
  user_id: 'test-user-1',
  action: 'upload',
  resource_type: 'transcription',
  resource_id: 'test-transcription-1',
  ip_address: '127.0.0.1',
  user_agent: 'Mozilla/5.0',
  status_code: 200,
  metadata: null,
  timestamp: new Date('2024-01-01T10:00:00'),
};

export const mockPrismaClient = {
  // User Model
  user: {
    create: vi.fn().mockResolvedValue(mockUser),
    findUnique: vi.fn().mockResolvedValue(mockUser),
    findFirst: vi.fn().mockResolvedValue(mockUser),
    findMany: vi.fn().mockResolvedValue([mockUser]),
    update: vi.fn().mockResolvedValue(mockUser),
    delete: vi.fn().mockResolvedValue(mockUser),
    count: vi.fn().mockResolvedValue(1),
  },

  // Transcription Model
  transcription: {
    create: vi.fn().mockResolvedValue(mockTranscription),
    findUnique: vi.fn().mockResolvedValue(mockTranscription),
    findFirst: vi.fn().mockResolvedValue(mockTranscription),
    findMany: vi.fn().mockResolvedValue([mockTranscription]),
    update: vi.fn().mockResolvedValue(mockTranscription),
    delete: vi.fn().mockResolvedValue(mockTranscription),
    count: vi.fn().mockResolvedValue(1),
    aggregate: vi.fn().mockResolvedValue({ _sum: { file_size: 5000000, cost: 0.50 } }),
    groupBy: vi.fn().mockResolvedValue([{ user_id: 'test-user-1', _sum: { cost: 0.50 } }]),
  },

  // UsageLog Model
  usageLog: {
    create: vi.fn().mockResolvedValue(mockUsageLog),
    findUnique: vi.fn().mockResolvedValue(mockUsageLog),
    findFirst: vi.fn().mockResolvedValue(mockUsageLog),
    findMany: vi.fn().mockResolvedValue([mockUsageLog]),
    update: vi.fn().mockResolvedValue(mockUsageLog),
    delete: vi.fn().mockResolvedValue(mockUsageLog),
    count: vi.fn().mockResolvedValue(1),
    aggregate: vi.fn().mockResolvedValue({ _sum: { cost_usd: 0.50 } }),
  },

  // AuditLog Model
  auditLog: {
    create: vi.fn().mockResolvedValue(mockAuditLog),
    findUnique: vi.fn().mockResolvedValue(mockAuditLog),
    findFirst: vi.fn().mockResolvedValue(mockAuditLog),
    findMany: vi.fn().mockResolvedValue([mockAuditLog]),
    update: vi.fn().mockResolvedValue(mockAuditLog),
    delete: vi.fn().mockResolvedValue(mockAuditLog),
    count: vi.fn().mockResolvedValue(1),
  },

  // Subscription Model (para testes de planos)
  subscription: {
    create: vi.fn().mockResolvedValue({
      id: 'test-sub-1',
      user_id: 'test-user-1',
      plan: 'STARTER',
      status: 'ACTIVE',
      current_period_start: new Date('2024-01-01'),
      current_period_end: new Date('2024-02-01'),
      created_at: new Date('2024-01-01'),
    }),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },

  // Role Model (para testes de autorização)
  role: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
} as unknown as PrismaClient;

/**
 * Função helper para resetar mocks do Prisma
 */
export function resetPrismaMocks() {
  vi.clearAllMocks();
  Object.values(mockPrismaClient).forEach((model: any) => {
    if (model && typeof model === 'object') {
      Object.values(model).forEach((method: any) => {
        if (typeof method === 'function' && method.mockClear) {
          method.mockClear();
        }
      });
    }
  });
}

/**
 * Função helper para configurar mock específico
 */
export function setupPrismaUserMock(overrides = {}) {
  const user = { ...mockUser, ...overrides };
  (mockPrismaClient.user.findUnique as any).mockResolvedValue(user);
  (mockPrismaClient.user.findFirst as any).mockResolvedValue(user);
  return user;
}

/**
 * Função helper para configurar mock de múltiplos usuários
 */
export function setupPrismaMultipleUsersMock(users = [mockUser]) {
  (mockPrismaClient.user.findMany as any).mockResolvedValue(users);
  (mockPrismaClient.user.count as any).mockResolvedValue(users.length);
  return users;
}

/**
 * Função helper para simular erro no Prisma
 */
export function setupPrismaErrorMock(model: keyof typeof mockPrismaClient, method: string, error: Error) {
  const modelMocks = mockPrismaClient[model] as any;
  if (modelMocks && modelMocks[method]) {
    modelMocks[method].mockRejectedValue(error);
  }
}

/**
 * Função helper para resetar um modelo específico
 */
export function resetPrismaModelMocks(model: keyof typeof mockPrismaClient) {
  const modelMocks = mockPrismaClient[model] as any;
  if (modelMocks) {
    Object.values(modelMocks).forEach((method: any) => {
      if (typeof method === 'function' && method.mockClear) {
        method.mockClear();
      }
    });
  }
}
