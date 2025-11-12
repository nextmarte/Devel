import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServerAuth } from '@/lib/server-auth';

/**
 * GET /api/debug/transcriptions
 * Debug: Mostra todas as transcrições do usuário e do banco de dados
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireServerAuth();
    
    console.log(`\n🔍 [DEBUG] Usuário: ${session.user.email}`);
    console.log(`🔍 [DEBUG] User ID: ${session.user.id}`);

    // Buscar todas as transcrições do usuário
    const userTranscriptions = await prisma.transcription.findMany({
      where: { user_id: session.user.id },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    console.log(`🔍 [DEBUG] Transcrições encontradas: ${userTranscriptions.length}`);

    // Buscar TODAS as transcrições no banco (para debug)
    const allTranscriptions = await prisma.transcription.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
    });

    console.log(`🔍 [DEBUG] Total de transcrições no banco: ${allTranscriptions.length}`);
    if (allTranscriptions.length > 0) {
      console.log(`🔍 [DEBUG] Amostra de transcrições:`);
      allTranscriptions.forEach(t => {
        console.log(`  - ID: ${t.id}, user_id: ${t.user_id}, file: ${t.file_name}, created: ${t.created_at}`);
      });
    }

    return NextResponse.json(
      {
        userId: session.user.id,
        email: session.user.email,
        userTranscriptionsCount: userTranscriptions.length,
        userTranscriptions,
        allTranscriptionsCount: allTranscriptions.length,
        allTranscriptions,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ [DEBUG] Erro:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
