import { NextRequest, NextResponse } from 'next/server';
import { asyncJobStorage } from '@/lib/async-job-storage';

/**
 * POST /api/transcribe/async
 * 
 * Envia um arquivo de áudio para a API Daredevil para transcrição assíncrona
 * A API Daredevil chamará o webhook quando a transcrição estiver pronta
 * 
 * Req:
 *   - file: FormData com arquivo de áudio
 *   - language: linguagem do áudio (ex: 'pt' para português)
 *   - webhook_url: URL para webhook (preenchida automaticamente)
 * 
 * Res:
 *   - task_id: ID único da tarefa para polling/tracking
 *   - status: 'started'
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const language = (formData.get('language') as string) || 'pt';
    
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.DAREDEVIL_API_URL || process.env.NEXT_PUBLIC_DAREDEVIL_API_URL;
    const webhookUrl = process.env.WEBHOOK_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { error: 'URL da API não configurada' },
        { status: 500 }
      );
    }

    if (!webhookUrl) {
      console.warn('⚠️ WEBHOOK_URL não configurada. Transcrição será processada mas sem callbacks.');
    }

    console.log(`📤 [ASYNC-UPLOAD] Enviando arquivo para API Daredevil: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Preparar form data para enviar à API
    const apiFormData = new FormData();
    apiFormData.append('file', file);
    apiFormData.append('language', language);
    if (webhookUrl) {
      apiFormData.append('webhook_url', webhookUrl);
    }

    // Enviar para API Daredevil
    let response;
    try {
      response = await fetch(`${apiUrl}/api/transcribe/async`, {
        method: 'POST',
        body: apiFormData,
      });
    } catch (fetchError: any) {
      console.error(`❌ [ASYNC-UPLOAD] Erro ao conectar à API: ${fetchError.message}`);
      return NextResponse.json(
        { error: `Falha ao conectar à API Daredevil: ${fetchError.message}` },
        { status: 503 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [ASYNC-UPLOAD] API retornou erro ${response.status}: ${errorText}`);
      return NextResponse.json(
        { error: `API retornou erro ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    const apiResponse = await response.json();
    const taskId = apiResponse.task_id;

    if (!taskId) {
      console.error('❌ [ASYNC-UPLOAD] Resposta inválida: sem task_id', apiResponse);
      return NextResponse.json(
        { error: 'Resposta inválida da API: sem task_id' },
        { status: 502 }
      );
    }

    console.log(`✅ [ASYNC-UPLOAD] Upload enviado com sucesso. Task ID: ${taskId}`);

    // Armazenar job localmente para rastreamento
    asyncJobStorage.createJob(taskId, file.name, file.size);
    asyncJobStorage.updateJobStatus(taskId, 'STARTED', undefined, 'Enviado para API Daredevil');

    return NextResponse.json({
      task_id: taskId,
      status: 'started',
      message: 'Transcrição iniciada. Aguardando resposta da API...',
      webhook_configured: !!webhookUrl,
    }, { status: 202 });
  } catch (error: any) {
    console.error('❌ [ASYNC-UPLOAD] Erro ao iniciar transcrição:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar upload' },
      { status: 500 }
    );
  }
}
