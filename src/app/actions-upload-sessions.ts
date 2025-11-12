'use server';

import { requireServerAuth } from '@/lib/server-auth';
import { prisma } from '@/lib/prisma';

/**
 * Criar uma nova sessão de upload
 * Persiste o estado no servidor para que possa ser restaurado
 */
export async function createUploadSession(
  jobId: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  generateSummary: boolean
) {
  try {
    const session = await requireServerAuth();

    const uploadSession = await prisma.uploadSession.create({
      data: {
        user_id: session.user.id,
        job_id: jobId,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        generate_summary: generateSummary,
        status: 'STARTED',
        progress: 0,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
    });

    console.log(`✅ Upload session criada: ${uploadSession.id} para jobId: ${jobId}`);
    return { success: true, sessionId: uploadSession.id };
  } catch (error: any) {
    console.error('❌ Erro ao criar upload session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Atualizar progresso da sessão de upload
 */
export async function updateUploadSessionProgress(
  jobId: string,
  progress: number,
  status?: string
) {
  try {
    const session = await requireServerAuth();

    const uploadSession = await prisma.uploadSession.updateMany({
      where: {
        job_id: jobId,
        user_id: session.user.id,
      },
      data: {
        progress: Math.min(100, progress),
        ...(status && { status }),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao atualizar upload session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obter sessão de upload ativa do usuário
 * Restaura o estado se a página foi recarregada ou abandonada
 */
export async function getActiveUploadSession() {
  try {
    const session = await requireServerAuth();

    const uploadSession = await prisma.uploadSession.findFirst({
      where: {
        user_id: session.user.id,
        status: {
          in: ['STARTED', 'PROCESSING'],
        },
        expires_at: {
          gt: new Date(), // Não expirou ainda
        },
      },
      orderBy: {
        started_at: 'desc',
      },
    });

    if (uploadSession) {
      console.log(`📋 Upload session restaurada: ${uploadSession.job_id}`);
      return {
        success: true,
        session: uploadSession,
      };
    }

    return { success: false, session: null };
  } catch (error: any) {
    console.error('❌ Erro ao obter upload session:', error);
    return { success: false, session: null, error: error.message };
  }
}

/**
 * Marcar sessão como completa
 */
export async function completeUploadSession(jobId: string) {
  try {
    const session = await requireServerAuth();

    await prisma.uploadSession.updateMany({
      where: {
        job_id: jobId,
        user_id: session.user.id,
      },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
        progress: 100,
      },
    });

    console.log(`✅ Upload session concluída: ${jobId}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao completar upload session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancelar sessão de upload
 */
export async function cancelUploadSession(jobId: string) {
  try {
    const session = await requireServerAuth();

    await prisma.uploadSession.updateMany({
      where: {
        job_id: jobId,
        user_id: session.user.id,
      },
      data: {
        status: 'FAILED',
        completed_at: new Date(),
      },
    });

    console.log(`❌ Upload session cancelada: ${jobId}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao cancelar upload session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Limpar sessões expiradas (cleanup automático)
 * Deve ser chamado periodicamente
 */
export async function cleanupExpiredUploadSessions() {
  try {
    const result = await prisma.uploadSession.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });

    console.log(`🧹 Removidas ${result.count} upload sessions expiradas`);
    return { success: true, deleted: result.count };
  } catch (error: any) {
    console.error('❌ Erro ao limpar upload sessions:', error);
    return { success: false, error: error.message };
  }
}
