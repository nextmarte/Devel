'use server';

import { requireServerAuth } from '@/lib/server-auth';
import { prisma } from '@/lib/prisma';
import { startAsyncTranscription, getAsyncTranscriptionStatus, processTranscriptionFlows } from '@/app/actions';
import { asyncJobStorage } from '@/lib/async-job-storage';

/**
 * Processa mídia com autenticação usando fluxo assíncrono
 * Requer que o usuário esteja logado
 * Registra a ação em UsageLog
 * Retorna jobId para polling via getAsyncTranscriptionStatus
 */
export async function processMediaWithAuth(formData: FormData): Promise<{ 
  jobId: string | null;
  error: string | null; 
}> {
  try {
    // 1. Exigir autenticação
    const session = await requireServerAuth();
    
    const file = formData.get('file') as File;
    const generateSummary = formData.get('generateSummary') === 'true';

    if (!file) {
      return { jobId: null, error: 'Nenhum arquivo foi fornecido.' };
    }

    // 2. Registrar início do upload em UsageLog
    await prisma.usageLog.create({
      data: {
        user_id: session.user.id,
        action_type: 'transcription_start',
        file_size: file.size,
        duration: 0,
        cost: 0,
      },
    });

    // 3. Usar fluxo assíncrono existente
    // Gera um sessionId baseado no user_id
    const sessionId = `user_${session.user.id}`;
    
    const result = await startAsyncTranscription(formData, sessionId);
    
    if (!result.jobId) {
      // Registrar erro
      await prisma.usageLog.create({
        data: {
          user_id: session.user.id,
          action_type: 'transcription_error',
          file_size: file.size,
          duration: 0,
          cost: 0,
        },
      });
      return { jobId: null, error: result.error || 'Falha ao iniciar transcrição' };
    }

    console.log(`✅ Transcrição iniciada para usuário ${session.user.email}: ${result.jobId}`);

    return { jobId: result.jobId, error: null };
  } catch (error: any) {
    console.error('❌ Erro ao processar mídia:', error);
    return {
      jobId: null,
      error: error.message || 'Falha ao processar mídia.',
    };
  }
}

/**
 * Obter histórico de transcrições do usuário
 */
export async function getUserTranscriptions(limit: number = 10, offset: number = 0) {
  try {
    const session = await requireServerAuth();
    
    const transcriptions = await prisma.transcription.findMany({
      where: { user_id: session.user.id },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });
    
    const total = await prisma.transcription.count({
      where: { user_id: session.user.id },
    });
    
    return { 
      data: transcriptions, 
      total,
      error: null 
    };
  } catch (error: any) {
    console.error("Error fetching transcriptions:", error);
    return { 
      data: null, 
      total: 0,
      error: error.message || "Falha ao buscar transcrições." 
    };
  }
}

/**
 * Deletar transcrição (apenas o próprio usuário ou admin)
 */
export async function deleteTranscription(transcriptionId: string) {
  try {
    const session = await requireServerAuth();
    
    // Verificar se transcrição pertence ao usuário ou é admin
    const transcription = await prisma.transcription.findUnique({
      where: { id: transcriptionId },
    });
    
    if (!transcription) {
      return { success: false, error: "Transcrição não encontrada." };
    }
    
    if (transcription.user_id !== session.user.id && session.user.role !== 'admin') {
      return { success: false, error: "Você não tem permissão para deletar esta transcrição." };
    }
    
    // Deletar transcrição
    await prisma.transcription.delete({
      where: { id: transcriptionId },
    });
    
    // Registrar auditoria
    await prisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: 'TRANSCRIPTION_DELETED',
        resource_type: 'transcription',
        resource_id: transcriptionId,
        ip_address: 'unknown',
        user_agent: 'unknown',
      },
    });
    
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error deleting transcription:", error);
    return { 
      success: false, 
      error: error.message || "Falha ao deletar transcrição." 
    };
  }
}

/**
 * Obter uso do usuário (quantas transcrições, quanto custou, etc)
 */
export async function getUserUsageStats() {
  try {
    const session = await requireServerAuth();
    
    // Últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const usageLogs = await prisma.usageLog.findMany({
      where: {
        user_id: session.user.id,
        timestamp: { gte: thirtyDaysAgo },
      },
    });
    
    const stats = {
      totalTranscriptions: usageLogs.filter(log => 
        log.action_type.includes('transcription_process_success')
      ).length,
      totalCost: usageLogs.reduce((sum, log) => sum + (log.cost || 0), 0),
      totalFileSize: usageLogs.reduce((sum, log) => sum + (log.file_size || 0), 0),
      totalDuration: usageLogs.reduce((sum, log) => sum + (log.duration || 0), 0),
    };
    
    return { 
      data: stats, 
      error: null 
    };
  } catch (error: any) {
    console.error("Error fetching usage stats:", error);
    return { 
      data: null, 
      error: error.message || "Falha ao buscar estatísticas." 
    };
  }
}
