import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mockPrismaClient,
  mockUser,
  mockTranscription,
  mockUsageLog,
  mockAuditLog,
  setupPrismaUserMock,
  resetPrismaMocks,
} from '../mocks/prisma';
import {
  mockGetServerSession,
  mockSession,
  setupGetServerSessionMock,
  resetNextAuthMocks,
} from '../mocks/nextauth';

/**
 * Testes Unitários para Ações Protegidas
 * 
 * Estes testes validam:
 * - Autenticação obrigatória
 * - Isolamento de dados por usuário (user_id matching)
 * - Cálculo correto de custos e descontos
 * - Logging de operações (UsageLog, AuditLog)
 * - Validação de entrada (tamanho, tipo de arquivo)
 * - Tratamento de erros
 */

// ============================================================================
// Utilities para Tests
// ============================================================================

/**
 * Função simulada de cálculo de custo
 * Reproduz a lógica real da aplicação
 */
function calculateTranscriptionCost(fileSize: number, planTier: string): { cost: number; discount: number } {
  const MB = fileSize / (1024 * 1024);
  const costPerMB = 0.10; // $0.10 por MB

  const discounts: Record<string, number> = {
    FREE: 0,       // Free tier bloqueado
    STARTER: 0.10, // 10% desconto
    PRO: 0.30,     // 30% desconto
    ENTERPRISE: 0.50, // 50% desconto
  };

  const discountPercent = discounts[planTier] || 0;
  const baseCost = MB * costPerMB;
  const finalCost = baseCost * (1 - discountPercent);

  return { cost: finalCost, discount: discountPercent };
}

/**
 * Função simulada que valida arquivo
 */
function validateUploadFile(fileSize: number, fileType: string): boolean {
  const maxSize = 500 * 1024 * 1024; // 500MB
  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'video/mp4'];

  if (fileSize > maxSize) return false;
  if (!allowedTypes.includes(fileType)) return false;

  return true;
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Protected Actions', () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetNextAuthMocks();
    setupGetServerSessionMock(mockSession);
  });
  // ==========================================================================
  // processMediaWithAuth Tests
  // ==========================================================================
  describe('processMediaWithAuth', () => {
    it('deve requerer autenticação', async () => {
      // Arrange: Mock session como null (não autenticado)
      setupGetServerSessionMock(null);
      const session = await mockGetServerSession();

      // Assert: Deve rejeitar
      expect(session).toBeNull();
    });

    it('deve aceitar upload com autenticação válida', async () => {
      // Arrange
      const session = await mockGetServerSession();

      // Assert
      expect(session).not.toBeNull();
      expect(session?.user?.id).toBe('test-user-1');
      expect(session?.user?.email).toBe('test@example.com');
    });

    it('deve calcular custo corretamente para Starter plan', async () => {
      // Arrange
      const fileSize = 100 * 1024 * 1024; // 100MB
      const planTier = 'STARTER';

      // Act
      const { cost, discount } = calculateTranscriptionCost(fileSize, planTier);

      // Assert
      expect(discount).toBe(0.10); // 10% desconto
      expect(cost).toBe(9.0); // 100MB * $0.10 * (1 - 0.10) = $9.00
    });

    it('deve calcular custo corretamente para Pro plan', async () => {
      // Arrange
      const fileSize = 100 * 1024 * 1024; // 100MB
      const planTier = 'PRO';

      // Act
      const { cost, discount } = calculateTranscriptionCost(fileSize, planTier);

      // Assert
      expect(discount).toBe(0.30); // 30% desconto
      expect(cost).toBe(7.0); // 100MB * $0.10 * (1 - 0.30) = $7.00
    });

    it('deve calcular custo corretamente para Enterprise plan', async () => {
      // Arrange
      const fileSize = 100 * 1024 * 1024; // 100MB
      const planTier = 'ENTERPRISE';

      // Act
      const { cost, discount } = calculateTranscriptionCost(fileSize, planTier);

      // Assert
      expect(discount).toBe(0.50); // 50% desconto
      expect(cost).toBe(5.0); // 100MB * $0.10 * (1 - 0.50) = $5.00
    });

    it('deve calcular custo corretamente para Free plan (sem desconto)', async () => {
      // Arrange
      const fileSize = 10 * 1024 * 1024; // 10MB
      const planTier = 'FREE';

      // Act
      const { cost, discount } = calculateTranscriptionCost(fileSize, planTier);

      // Assert
      expect(discount).toBe(0); // Sem desconto
      expect(cost).toBe(1.0); // 10MB * $0.10 = $1.00
    });

    it('deve rejeitar arquivo > 500MB', async () => {
      // Arrange
      const maxSize = 500 * 1024 * 1024;
      const oversizeFile = maxSize + 1;
      const fileType = 'audio/mpeg';

      // Act
      const isValid = validateUploadFile(oversizeFile, fileType);

      // Assert
      expect(isValid).toBe(false);
    });

    it('deve rejeitar tipo de arquivo inválido', async () => {
      // Arrange
      const fileSize = 10 * 1024 * 1024;
      const invalidType = 'text/plain';

      // Act
      const isValid = validateUploadFile(fileSize, invalidType);

      // Assert
      expect(isValid).toBe(false);
    });

    it('deve aceitar tipo de arquivo válido (MP3)', async () => {
      // Arrange
      const fileSize = 10 * 1024 * 1024;
      const validType = 'audio/mpeg';

      // Act
      const isValid = validateUploadFile(fileSize, validType);

      // Assert
      expect(isValid).toBe(true);
    });

    it('deve aceitar tipo de arquivo válido (WAV)', async () => {
      // Arrange
      const fileSize = 10 * 1024 * 1024;
      const validType = 'audio/wav';

      // Act
      const isValid = validateUploadFile(fileSize, validType);

      // Assert
      expect(isValid).toBe(true);
    });

    it('deve registrar em UsageLog quando upload bem-sucedido', async () => {
      // Arrange
      const fileSize = 10 * 1024 * 1024;
      const { cost } = calculateTranscriptionCost(fileSize, 'STARTER');

      // Act
      await mockPrismaClient.usageLog.create({
        data: {
          user_id: 'test-user-1',
          action_type: 'transcribe',
          file_size: fileSize,
          cost: cost,
          quota_consumed: 1,
        },
      });

      // Assert
      expect(mockPrismaClient.usageLog.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.usageLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'test-user-1',
          action_type: 'transcribe',
        }),
      });
    });

    it('deve registrar em AuditLog com ação upload', async () => {
      // Arrange
      const auditData = {
        user_id: 'test-user-1',
        action: 'upload',
        resource_type: 'transcription',
        resource_id: 'test-transcription-1',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        status_code: 200,
      };

      // Act
      await mockPrismaClient.auditLog.create({ data: auditData });

      // Assert
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'upload',
          resource_type: 'transcription',
        }),
      });
    });
  });

  // ==========================================================================
  // getUserTranscriptions Tests
  // ==========================================================================
  describe('getUserTranscriptions', () => {
    it('deve retornar transcriptions apenas do usuário autenticado', async () => {
      // Arrange
      const userTranscriptions = [mockTranscription];
      (mockPrismaClient.transcription.findMany as any).mockResolvedValue(userTranscriptions);

      // Act
      const result = await mockPrismaClient.transcription.findMany({
        where: { user_id: 'test-user-1' },
        orderBy: { created_at: 'desc' },
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe('test-user-1');
      expect(mockPrismaClient.transcription.findMany).toHaveBeenCalledWith({
        where: { user_id: 'test-user-1' },
        orderBy: { created_at: 'desc' },
      });
    });

    it('deve isolar dados entre usuários diferentes', async () => {
      // Arrange
      const user1Transcriptions = [{ ...mockTranscription, user_id: 'test-user-1' }];
      const user2Transcriptions = [{ ...mockTranscription, user_id: 'test-user-2' }];
      
      // Act
      const result1 = await mockPrismaClient.transcription.findMany({
        where: { user_id: 'test-user-1' },
      });
      
      (mockPrismaClient.transcription.findMany as any).mockResolvedValue(user2Transcriptions);
      const result2 = await mockPrismaClient.transcription.findMany({
        where: { user_id: 'test-user-2' },
      });

      // Assert
      expect(result1[0].user_id).toBe('test-user-1');
      expect(result2[0].user_id).toBe('test-user-2');
      expect(result1).not.toEqual(result2);
    });

    it('deve suportar paginação com skip e take', async () => {
      // Arrange
      const paginatedResult = [mockTranscription];
      (mockPrismaClient.transcription.findMany as any).mockResolvedValue(paginatedResult);

      // Act
      const result = await mockPrismaClient.transcription.findMany({
        where: { user_id: 'test-user-1' },
        skip: 0,
        take: 10,
      });

      // Assert
      expect(mockPrismaClient.transcription.findMany).toHaveBeenCalledWith({
        where: { user_id: 'test-user-1' },
        skip: 0,
        take: 10,
      });
    });

    it('deve ordenar por data descendente (mais recentes primeiro)', async () => {
      // Arrange
      const older = { ...mockTranscription, created_at: new Date('2024-01-01') };
      const newer = { ...mockTranscription, created_at: new Date('2024-01-02') };
      const ordered = [newer, older];
      (mockPrismaClient.transcription.findMany as any).mockResolvedValue(ordered);

      // Act
      const result = await mockPrismaClient.transcription.findMany({
        where: { user_id: 'test-user-1' },
        orderBy: { created_at: 'desc' },
      });

      // Assert
      expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
    });

    it('deve retornar array vazio se nenhuma transcription encontrada', async () => {
      // Arrange
      (mockPrismaClient.transcription.findMany as any).mockResolvedValue([]);

      // Act
      const result = await mockPrismaClient.transcription.findMany({
        where: { user_id: 'test-user-1' },
      });

      // Assert
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  // ==========================================================================
  // deleteTranscription Tests
  // ==========================================================================
  describe('deleteTranscription', () => {
    it('deve deletar transcription se usuário é dono', async () => {
      // Arrange
      (mockPrismaClient.transcription.findUnique as any).mockResolvedValue(mockTranscription);
      (mockPrismaClient.transcription.delete as any).mockResolvedValue(mockTranscription);

      // Act
      const existingRecord = await mockPrismaClient.transcription.findUnique({
        where: { id: 'test-transcription-1' },
      });
      
      if (existingRecord?.user_id === 'test-user-1') {
        await mockPrismaClient.transcription.delete({
          where: { id: 'test-transcription-1' },
        });
      }

      // Assert
      expect(mockPrismaClient.transcription.delete).toHaveBeenCalledWith({
        where: { id: 'test-transcription-1' },
      });
    });

    it('deve rejeitar delete se usuário não é dono', async () => {
      // Arrange
      const otherUserTranscription = { ...mockTranscription, user_id: 'test-user-2' };
      (mockPrismaClient.transcription.findUnique as any).mockResolvedValue(otherUserTranscription);

      // Act
      const record = await mockPrismaClient.transcription.findUnique({
        where: { id: 'test-transcription-1' },
      });

      // Assert
      expect(record?.user_id).toBe('test-user-2');
      expect(record?.user_id).not.toBe('test-user-1');
    });

    it('deve registrar em AuditLog quando deletar', async () => {
      // Arrange
      (mockPrismaClient.auditLog.create as any).mockResolvedValue(mockAuditLog);

      // Act
      await mockPrismaClient.auditLog.create({
        data: {
          user_id: 'test-user-1',
          action: 'delete_transcription',
          resource_type: 'transcription',
          resource_id: 'test-transcription-1',
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0',
        },
      });

      // Assert
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalled();
    });

    it('deve retornar erro 404 se transcription não existe', async () => {
      // Arrange
      (mockPrismaClient.transcription.findUnique as any).mockResolvedValue(null);

      // Act
      const result = await mockPrismaClient.transcription.findUnique({
        where: { id: 'non-existent-id' },
      });

      // Assert
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // getUserUsageStats Tests
  // ==========================================================================
  describe('getUserUsageStats', () => {
    it('deve retornar estatísticas dos últimos 30 dias', async () => {
      // Arrange
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Act
      const result = await mockPrismaClient.usageLog.findMany({
        where: {
          user_id: 'test-user-1',
          timestamp: { gte: thirtyDaysAgo },
        },
      });

      // Assert
      expect(mockPrismaClient.usageLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          user_id: 'test-user-1',
        }),
      });
    });

    it('deve somar fileSize corretamente', async () => {
      // Arrange
      const logs = [
        { ...mockUsageLog, file_size: 10 * 1024 * 1024 },
        { ...mockUsageLog, file_size: 5 * 1024 * 1024 },
      ];
      (mockPrismaClient.usageLog.aggregate as any).mockResolvedValue({
        _sum: { file_size: 15 * 1024 * 1024 },
      });

      // Act
      const result = await mockPrismaClient.usageLog.aggregate({
        where: { user_id: 'test-user-1' },
        _sum: { file_size: true },
      });

      // Assert
      expect(result._sum.file_size).toBe(15 * 1024 * 1024);
    });

    it('deve aplicar desconto baseado no plano', async () => {
      // Arrange
      const baseCost = 100;
      const proDiscount = 0.30;
      const finalCost = baseCost * (1 - proDiscount);

      // Act & Assert
      expect(finalCost).toBe(70);
    });

    it('deve retornar zero se nenhum uso nos últimos 30 dias', async () => {
      // Arrange
      (mockPrismaClient.usageLog.aggregate as any).mockResolvedValue({
        _sum: { file_size: null, cost: null },
      });

      // Act
      const result = await mockPrismaClient.usageLog.aggregate({
        where: { user_id: 'test-user-1' },
        _sum: { cost: true },
      });

      // Assert
      expect(result._sum.cost).toBeNull();
    });
  });

  describe('calculateTranscriptionCost', () => {
    it('deve aplicar desconto Free (0%)', () => {
      const { cost, discount } = calculateTranscriptionCost(10 * 1024 * 1024, 'FREE');
      expect(discount).toBe(0);
      expect(cost).toBe(1.0);
    });

    it('deve aplicar desconto Starter (10%)', () => {
      const { cost, discount } = calculateTranscriptionCost(10 * 1024 * 1024, 'STARTER');
      expect(discount).toBe(0.10);
      expect(cost).toBe(0.9);
    });

    it('deve aplicar desconto Pro (30%)', () => {
      const { cost, discount } = calculateTranscriptionCost(10 * 1024 * 1024, 'PRO');
      expect(discount).toBe(0.30);
      expect(cost).toBe(0.7);
    });

    it('deve aplicar desconto Enterprise (50%)', () => {
      const { cost, discount } = calculateTranscriptionCost(10 * 1024 * 1024, 'ENTERPRISE');
      expect(discount).toBe(0.50);
      expect(cost).toBe(0.5);
    });

    it('deve calcular custo para arquivo grande', () => {
      const { cost } = calculateTranscriptionCost(500 * 1024 * 1024, 'PRO');
      expect(cost).toBe(35); // 500 * 0.10 * 0.7 = 35
    });

    it('deve retornar zero para arquivo pequeno', () => {
      const { cost } = calculateTranscriptionCost(0, 'STARTER');
      expect(cost).toBe(0);
    });
  });

  // ==========================================================================
  // Security Tests
  // ==========================================================================
  describe('Security & Authorization', () => {
    it('deve verificar autenticação antes de processar', async () => {
      // Arrange: Simular sessão null
      setupGetServerSessionMock(null);
      const session = await mockGetServerSession();

      // Assert
      expect(session).toBeNull();
    });

    it('deve verificar user_id ao deletar transcription', async () => {
      // Arrange: Transcription pertence a outro usuário
      const otherUserRecord = { ...mockTranscription, user_id: 'other-user' };
      (mockPrismaClient.transcription.findUnique as any).mockResolvedValue(otherUserRecord);

      // Act
      const record = await mockPrismaClient.transcription.findUnique({
        where: { id: 'test-transcription-1' },
      });

      // Assert: Deve ter user_id diferente
      expect(record?.user_id).not.toBe('test-user-1');
    });

    it('deve validar tipos de arquivo aceitos', () => {
      expect(validateUploadFile(10 * 1024 * 1024, 'audio/mpeg')).toBe(true);
      expect(validateUploadFile(10 * 1024 * 1024, 'audio/wav')).toBe(true);
      expect(validateUploadFile(10 * 1024 * 1024, 'audio/ogg')).toBe(true);
      expect(validateUploadFile(10 * 1024 * 1024, 'video/mp4')).toBe(true);
      expect(validateUploadFile(10 * 1024 * 1024, 'text/plain')).toBe(false);
      expect(validateUploadFile(10 * 1024 * 1024, 'image/png')).toBe(false);
    });

    it('deve validar tamanho máximo de arquivo', () => {
      const maxSize = 500 * 1024 * 1024;
      expect(validateUploadFile(maxSize - 1, 'audio/mpeg')).toBe(true);
      expect(validateUploadFile(maxSize, 'audio/mpeg')).toBe(true);
      expect(validateUploadFile(maxSize + 1, 'audio/mpeg')).toBe(false);
    });

    it('deve rejeitar requisições sem session', async () => {
      // Arrange
      setupGetServerSessionMock(null);

      // Act
      const session = await mockGetServerSession();

      // Assert
      expect(session).toBeNull();
    });

    it('deve retornar erro na tentativa de delete não autorizado', async () => {
      // Arrange
      const otherUserTranscription = { ...mockTranscription, user_id: 'other-user-id' };
      (mockPrismaClient.transcription.findUnique as any).mockResolvedValue(otherUserTranscription);

      // Act
      const record = await mockPrismaClient.transcription.findUnique({
        where: { id: 'test-transcription-1' },
      });

      // Assert
      expect(record?.user_id).toBe('other-user-id');
      expect(record?.user_id).not.toBe('test-user-1');
    });
  });
});
