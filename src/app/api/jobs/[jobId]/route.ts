import { NextRequest, NextResponse } from 'next/server';
import { asyncJobStorage } from '@/lib/async-job-storage';
import { globalProcessingTracker } from '@/lib/processing-tracker';
import { correctTranscriptionErrors } from '@/ai/flows/correct-transcription-errors';
import { identifySpeakers } from '@/ai/flows/identify-speakers-in-text';
import { summarizeText } from '@/ai/flows/summarize-text';

/**
 * Extrai sessionId do header X-Session-Id ou retorna null
 */
function getSessionIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('X-Session-Id');
}

/**
 * Valida se o jobId pertence ao sessionId fornecido
 */
function validateJobAccess(jobId: string, sessionId: string | null): boolean {
  if (!sessionId) return true; // Sem sessionId, aceitar
  return jobId.startsWith(`${sessionId}:`);
}

/**
 * Processa os flows de IA no servidor (correção, identificação, sumário)
 * Roda automaticamente quando a transcrição chega da API
 */
async function processFlowsServer(jobId: string, rawTranscription: string, generateSummary: boolean = false) {
  try {
    console.log(`[FLOWS-SERVER] 🚀 Iniciando processamento de flows para jobId: ${jobId}`);
    
    // Step 1: Corrigir erros gramaticais
    console.log(`[FLOWS-SERVER] 📝 Iniciando correção...`);
    const correctedResult = await correctTranscriptionErrors({
      transcription: rawTranscription,
      jobId,
    });
    console.log(`[FLOWS-SERVER] ✅ Correção completa`);

    // Step 2: Identificar speakers
    console.log(`[FLOWS-SERVER] 🎤 Iniciando identificação de speakers...`);
    const speakersResult = await identifySpeakers({
      text: correctedResult.correctedTranscription,
      jobId,
    });
    console.log(`[FLOWS-SERVER] ✅ Identificação de speakers completa`);

    let summary: string | null = null;
    if (generateSummary) {
      // Step 3: Gerar sumário
      console.log(`[FLOWS-SERVER] 📊 Iniciando geração de sumário...`);
      const summaryResult = await summarizeText({
        text: speakersResult.identifiedText,
        jobId,
      });
      summary = summaryResult.summary;
      console.log(`[FLOWS-SERVER] ✅ Sumário gerado`);
    }

    console.log(`[FLOWS-SERVER] 🎉 Todos os flows completados`);

    return {
      correctedTranscription: correctedResult.correctedTranscription,
      identifiedTranscription: speakersResult.identifiedText,
      summary,
    };
  } catch (error: any) {
    console.error(`[FLOWS-SERVER] ❌ Erro ao processar flows:`, error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = await params;
    const sessionId = getSessionIdFromRequest(request);

    console.log(`[GET /api/jobs/${jobId}] Recebido - sessionId:`, sessionId);

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId é obrigatório' },
        { status: 400 }
      );
    }

    // Validar acesso ao job
    if (!validateJobAccess(jobId, sessionId)) {
      console.log(`[GET /api/jobs/${jobId}] ❌ Acesso negado`);
      return NextResponse.json(
        { error: 'Acesso negado a este job' },
        { status: 403 }
      );
    }

    let job = asyncJobStorage.getJob(jobId);
    console.log(`[GET /api/jobs/${jobId}] Job local:`, job ? 'ENCONTRADO' : 'NÃO ENCONTRADO');

    // Sincronizar com Daredevil API se:
    // 1. Job não foi encontrado localmente, OU
    // 2. Job está em STARTED (pode ter completado na API)
    const shouldSync = !job || (job && job.status === 'STARTED');
    
    if (shouldSync && process.env.NEXT_PUBLIC_DAREDEVIL_API_URL) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_DAREDEVIL_API_URL;
        // Extrair task_id do jobId prefixado (remover "sessionId:" se presente)
        const taskId = jobId.includes(':') ? jobId.split(':')[1] : jobId;
        console.log(`[SYNC] 🔄 Sincronizando com API: ${apiUrl}/api/transcribe/async/status/${taskId}`);
        
        const apiResponse = await fetch(`${apiUrl}/api/transcribe/async/status/${taskId}`);
        console.log(`[SYNC] 📡 API response status: ${apiResponse.status}`);
        
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          console.log(`[SYNC] 📊 API data state: ${apiData.state}`);
          
          // Mapear resposta da API para nosso formato
          let status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'RETRY' | 'CANCELLED' = 'PENDING';
          
          if (apiData.state === 'PENDING') status = 'PENDING';
          else if (apiData.state === 'STARTED') status = 'STARTED';
          else if (apiData.state === 'SUCCESS') status = 'SUCCESS';
          else if (apiData.state === 'FAILURE') status = 'FAILURE';
          else if (apiData.state === 'RETRY') status = 'RETRY';
          
          console.log(`[SYNC] 🔍 Verificando se job existe...`);
          let existingJob = asyncJobStorage.getJob(jobId);
          
          if (existingJob) {
            console.log(`[SYNC] ♻️ Job já existe, atualizando status`);
          } else {
            console.log(`[SYNC] ✨ Criando novo job`);
            // Criar job localmente com dados da API
            asyncJobStorage.createJob(jobId, `task-${taskId.slice(0, 8)}`, 0);
          }
          
          if (status === 'SUCCESS' && apiData.result) {
            console.log(`[SYNC] ✅ Atualizando job com SUCCESS`);
            console.log(`[SYNC] 📝 Texto recebido (primeiros 50 chars):`, apiData.result.transcription?.text?.substring(0, 50));
            
            const rawTranscription = apiData.result.transcription?.text || '';
            
            // Processar flows automaticamente no servidor
            console.log(`[SYNC] 🚀 Processando flows de IA no servidor...`);
            const flowsResult = await processFlowsServer(jobId, rawTranscription, true);
            
            const resultData = {
              rawTranscription: rawTranscription,
              correctedTranscription: flowsResult?.correctedTranscription || rawTranscription,
              identifiedTranscription: flowsResult?.identifiedTranscription || rawTranscription,
              summary: flowsResult?.summary || null,
              processingTime: apiData.result.processing_time || 0,
              audioInfo: {
                format: apiData.result.audio_info?.format || '',
                duration: apiData.result.audio_info?.duration || 0,
                sampleRate: apiData.result.audio_info?.sample_rate || 0,
                channels: apiData.result.audio_info?.channels || 0,
                fileSizeMb: apiData.result.audio_info?.file_size_mb || 0,
              },
            };
            
            console.log(`[SYNC] 💾 Salvando result com ${resultData.rawTranscription.length} caracteres (corrigido: ${resultData.correctedTranscription.length}, identificado: ${resultData.identifiedTranscription.length})`);
            asyncJobStorage.updateJobStatus(jobId, 'SUCCESS', resultData);
            console.log(`[SYNC] ✅ Job atualizado com sucesso`);
          } else if (status === 'FAILURE') {
            console.log(`[SYNC] ❌ Atualizando job com FAILURE`);
            asyncJobStorage.updateJobStatus(jobId, 'FAILURE', undefined, apiData.error || 'Erro desconhecido');
          } else {
            console.log(`[SYNC] ⏳ Atualizando job com status ${status}`);
            asyncJobStorage.updateJobStatus(jobId, status);
          }
          
          job = asyncJobStorage.getJob(jobId);
          console.log(`[SYNC] ✅ Job sincronizado:`, job?.status);
        } else {
          console.log(`[SYNC] ⚠️ API retornou status ${apiResponse.status}`);
        }
      } catch (syncError) {
        console.error(`[SYNC ERROR] ❌ Erro ao sincronizar com API:`, syncError);
        // Continuar mesmo se falhar a sincronização
      }
    }

    if (!job) {
      console.log(`[GET /api/jobs/${jobId}] ❌ Job ${jobId} não encontrado`);
      return NextResponse.json(
        { error: `Job ${jobId} não encontrado` },
        { status: 404 }
      );
    }

    console.log(`[GET /api/jobs/${jobId}] ✅ Retornando job com status:`, job.status);
    console.log(`[GET /api/jobs/${jobId}] 📦 Job result:`, job.result ? 'EXISTE' : 'VAZIO');
    if (job.result?.rawTranscription) {
      console.log(`[GET /api/jobs/${jobId}] 📝 Transcrição (primeiros 50 chars):`, job.result.rawTranscription.substring(0, 50));
    }
    
    // Incluir eventos de processamento
    const processingEvents = globalProcessingTracker.getEventsForJob(jobId);
    console.log(`[GET /api/jobs/${jobId}] 🔍 Buscando eventos do tracker - jobId: ${jobId}`);
    console.log(`[GET /api/jobs/${jobId}] 📊 Eventos encontrados: ${processingEvents.length}`);
    if (processingEvents.length > 0) {
      console.log(`[GET /api/jobs/${jobId}] ✅ Adicionando ${processingEvents.length} eventos ao job`);
      job.processingEvents = processingEvents;
      console.log(`[GET /api/jobs/${jobId}] 📝 Eventos:`, JSON.stringify(processingEvents, null, 2));
    } else {
      console.log(`[GET /api/jobs/${jobId}] 📭 Nenhum evento registrado - isso pode significar que os flows não foram chamados`);
    }
    
    // ✅ Limpar eventos do tracker quando job completar (SUCCESS ou FAILURE)
    if (job.status === 'SUCCESS' || job.status === 'FAILURE') {
      console.log(`[GET /api/jobs/${jobId}] 🧹 Limpando eventos do tracker (job em estado final)`);
      globalProcessingTracker.clearJob(jobId);
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
    const { jobId } = await params;
    const sessionId = getSessionIdFromRequest(request);

    console.log(`[DELETE /api/jobs/${jobId}] Recebido - sessionId:`, sessionId);

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId é obrigatório' },
        { status: 400 }
      );
    }

    // Validar acesso ao job
    if (!validateJobAccess(jobId, sessionId)) {
      console.log(`[DELETE /api/jobs/${jobId}] ❌ Acesso negado`);
      return NextResponse.json(
        { error: 'Acesso negado a este job' },
        { status: 403 }
      );
    }

    console.log(`[DELETE /api/jobs/${jobId}] Tentando deletar job...`);
    const deleted = asyncJobStorage.deleteJob(jobId);

    if (!deleted) {
      console.log(`[DELETE /api/jobs/${jobId}] ❌ Job não encontrado para deletar`);
      return NextResponse.json(
        { error: `Job ${jobId} não encontrado` },
        { status: 404 }
      );
    }

    console.log(`[DELETE /api/jobs/${jobId}] ✅ Job deletado com sucesso`);
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
