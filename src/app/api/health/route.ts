import { NextResponse } from 'next/server';

/**
 * Health check endpoint
 * Verifica se a aplicação está rodando
 * 
 * Uso pelo Docker: curl http://localhost:8565/api/health
 */
export async function GET() {
  try {
    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Application is running',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Health Check Error]', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
