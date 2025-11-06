import { NextRequest, NextResponse } from 'next/server';
import { asyncJobStorage } from '@/lib/async-job-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId é obrigatório' },
        { status: 400 }
      );
    }

    const job = asyncJobStorage.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: `Job ${jobId} não encontrado` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error: any) {
    console.error('Erro ao buscar status do job:', error);
    return NextResponse.json(
      { error: `Erro ao buscar status: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId é obrigatório' },
        { status: 400 }
      );
    }

    const deleted = asyncJobStorage.deleteJob(jobId);

    if (!deleted) {
      return NextResponse.json(
        { error: `Job ${jobId} não encontrado` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Job ${jobId} deletado`,
    });
  } catch (error: any) {
    console.error('Erro ao deletar job:', error);
    return NextResponse.json(
      { error: `Erro ao deletar: ${error.message}` },
      { status: 500 }
    );
  }
}
