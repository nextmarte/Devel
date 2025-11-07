import { NextRequest, NextResponse } from 'next/server';
import { asyncJobStorage } from '@/lib/async-job-storage';

/**
 * Extrai sessionId do header X-Session-Id ou retorna null
 */
function getSessionIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('X-Session-Id');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sessionId = getSessionIdFromRequest(request);

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit deve estar entre 1 e 100' },
        { status: 400 }
      );
    }

    const jobs = asyncJobStorage.getRecentJobs(limit);

    // Filtrar jobs apenas do sessionId atual
    const filteredJobs = sessionId
      ? jobs.filter((job) => job.jobId.startsWith(`${sessionId}:`))
      : jobs;

    return NextResponse.json({
      success: true,
      total: filteredJobs.length,
      jobs: filteredJobs,
    });
  } catch (error: any) {
    console.error('Erro ao listar jobs:', error);
    return NextResponse.json(
      { error: `Erro ao listar jobs: ${error.message}` },
      { status: 500 }
    );
  }
}
