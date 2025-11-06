import { NextRequest, NextResponse } from 'next/server';
import { asyncJobStorage } from '@/lib/async-job-storage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit deve estar entre 1 e 100' },
        { status: 400 }
      );
    }

    const jobs = asyncJobStorage.getRecentJobs(limit);

    return NextResponse.json({
      success: true,
      total: jobs.length,
      jobs,
    });
  } catch (error: any) {
    console.error('Erro ao listar jobs:', error);
    return NextResponse.json(
      { error: `Erro ao listar jobs: ${error.message}` },
      { status: 500 }
    );
  }
}
