import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServerAuth } from '@/lib/server-auth';

/**
 * POST /api/transcriptions/update
 * Atualiza uma transcrição com edições do usuário
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireServerAuth();
    const body = await request.json();
    const { jobId, raw_text, corrected_text, identified_text } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar transcrição no banco
    const transcription = await prisma.transcription.findFirst({
      where: { job_id: jobId, user_id: session.user.id },
    });

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcrição não encontrada' },
        { status: 404 }
      );
    }

    // Atualizar com base no que foi enviado
    const updated = await prisma.transcription.update({
      where: { id: transcription.id },
      data: {
        ...(raw_text && { raw_text }),
        ...(corrected_text && { corrected_text }),
        ...(identified_text && { identified_text }),
      },
    });

    console.log(`✅ Transcrição ${jobId} atualizada pelo usuário`);

    return NextResponse.json(
      { success: true, message: 'Transcrição atualizada', transcription: updated },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao atualizar transcrição:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar transcrição' },
      { status: 500 }
    );
  }
}
