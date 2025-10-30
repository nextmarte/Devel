import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_DAREDEVIL_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { error: 'Backend URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Health check proxy error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        // Fallback data
        status: 'healthy',
        supported_formats: ['opus', 'ogg', 'm4a', 'aac', 'mp3', 'wav', 'flac', 'webm', 'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'ogv', 'ts', 'mts', 'm2ts', '3gp', 'f4v', 'asf'],
        max_file_size_mb: 500,
      },
      { status: 200 }
    );
  }
}
