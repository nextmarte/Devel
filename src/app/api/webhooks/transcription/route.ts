import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncJobStorage } from '@/lib/async-job-storage';
import { processTranscriptionFlows } from '@/app/actions';
import { transcriptionEvents } from '@/lib/transcription-events';

/**
 * POST /api/webhooks/transcription
 * 
 * Webhook que recebe a resposta de transcrição da API Daredevil
 * Chamado automaticamente quando a transcrição está pronta
 * 
 * Payload esperado:
 * {
 *   task_id: string,
 *   status: "completed" | "failed",
 *   transcription: {
 *     text: string,
 *     language: string,
 *     duration: number,
 *     segments: [...],
 *     confidence: number
 *   },
 *   processing_time: number,
 *   audio_info: {...},
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task_id, status, transcription, processing_time, audio_info, error } = body;

    if (!task_id) {
      console.error(`❌ [WEBHOOK] task_id obrigatório não recebido`);
      return NextResponse.json(
        { error: 'task_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 [WEBHOOK] ✅ WEBHOOK RECEBIDO DO DAREDEVIL`);
    console.log(`📦 task_id: ${task_id}`);
    console.log(`📊 status: ${status}`);
    console.log(`⏱️  processing_time: ${processing_time}ms`);
    console.log(`📝 transcription.text length: ${transcription?.text?.length || 0} chars`);
    console.log(`🎤 audio_info: ${audio_info ? 'SIM' : 'NÃO'}`);
    console.log(`❌ error: ${error || 'NÃO'}`);
    console.log(`${'='.repeat(60)}\n`);

    // Buscar job no armazenamento local
    const job = asyncJobStorage.getJob(task_id);
    if (!job) {
      console.warn(`⚠️ [WEBHOOK] Job ${task_id} não encontrado no storage local`);
      console.log(`[WEBHOOK] 🔍 Procurando por prefixo...`);
      
      // Procurar por task_id sem prefix (pode vir com "user_xxx:" na frente)
      const allJobs = asyncJobStorage.getRecentJobs(1000);
      console.log(`[WEBHOOK] 📋 Total de jobs no storage: ${allJobs.length}`);
      
      const matchingJob = allJobs.find(j => {
        const match = j.jobId.endsWith(`:${task_id}`) || j.jobId === task_id;
        if (match) console.log(`[WEBHOOK] ✅ Encontrado match: ${j.jobId}`);
        return match;
      });
      
      if (!matchingJob) {
        console.error(`❌ [WEBHOOK] Job não encontrado em nenhum formato: ${task_id}`);
        console.log(`[WEBHOOK] 📝 Primeiros 5 jobs no storage:`, allJobs.slice(0, 5).map(j => j.jobId));
        return NextResponse.json(
          { error: 'Job não encontrado', taskId: task_id },
          { status: 404 }
        );
      }
      
      console.log(`[WEBHOOK] ✅ Job encontrado com prefixo: ${matchingJob.jobId}`);
      // Usar job encontrado
      return handleWebhook(matchingJob.jobId, status, transcription, processing_time, audio_info, error);

    }

    return handleWebhook(task_id, status, transcription, processing_time, audio_info, error);

  } catch (error: any) {
    console.error('❌ [WEBHOOK] Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

/**
 * Processa o webhook recebido
 */
async function handleWebhook(
  jobId: string,
  status: string,
  transcription: any,
  processing_time: number,
  audio_info: any,
  error: string | null
) {
  const job = asyncJobStorage.getJob(jobId);

  if (status === 'completed' && transcription?.text) {
    console.log(`✅ [WEBHOOK] Transcrição concluída: ${jobId}`);
    console.log(`📊 [WEBHOOK] Texto: ${transcription.text.substring(0, 100)}...`);

    // Atualizar job com os dados de transcrição
    const result = {
      rawTranscription: transcription.text,
      correctedTranscription: '', // Será preenchido pelos flows
      identifiedTranscription: '',
      summary: null,
      processingTime: processing_time || 0,
      audioInfo: audio_info || {
        format: 'unknown',
        duration: transcription.duration || 0,
        sampleRate: audio_info?.sample_rate || 0,
        channels: audio_info?.channels || 1,
        fileSizeMb: audio_info?.file_size_mb || 0,
      },
      transcriptionMetadata: {
        language: transcription.language || 'pt',
        confidence: transcription.confidence || 0,
        segments: transcription.segments || [],
      },
    };

    asyncJobStorage.updateJobStatus(jobId, 'SUCCESS', result);
    console.log(`📝 [WEBHOOK] Job ${jobId} atualizado com resultado`);

    // Extrair userId do jobId (formato: user_XXX:task_YYY)
    const parts = jobId.split(':');
    const userIdPrefix = parts[0]; // "user_XXX" ou task_id direto
    let userId = null;

    if (userIdPrefix.startsWith('user_')) {
      userId = userIdPrefix.substring(5); // Remove "user_" prefix
    }

    // Se encontrou userId, salvar transcrição no banco de dados
    if (userId) {
      try {
        const savedTranscription = await prisma.transcription.create({
          data: {
            user_id: userId,
            job_id: jobId,
            file_name: job?.fileName || 'transcrição.ogg',
            status: 'TRANSCRIBED',
            raw_text: transcription.text,
            file_size: job?.fileSize || 0,
          },
        });

        console.log(`💾 [DATABASE] Transcrição salva no banco: ${savedTranscription.id}`);

        // Agora processar os flows de IA (correção, identificação, sumário)
        console.log(`🚀 [FLOWS] Iniciando processamento de flows para jobId: ${jobId}`);
        const flowsResult = await processTranscriptionFlows(jobId, transcription.text, true);

        if (flowsResult.success) {
          console.log(`✅ [FLOWS] Flows processados com sucesso`);
          
          // Atualizar o job.result com os resultados dos flows
          const updatedResult = {
            ...result,
            correctedTranscription: flowsResult.correctedTranscription || transcription.text,
            identifiedTranscription: flowsResult.identifiedTranscription || transcription.text,
            summary: flowsResult.summary || null,
          };
          asyncJobStorage.updateJobStatus(jobId, 'SUCCESS', updatedResult);
          console.log(`📝 [JOB] Job atualizado com resultados dos flows`);

          // Atualizar transcrição com resultados dos flows
          await prisma.transcription.update({
            where: { id: savedTranscription.id },
            data: {
              corrected_text: flowsResult.correctedTranscription || transcription.text,
              identified_text: flowsResult.identifiedTranscription || transcription.text,
              summary: flowsResult.summary || null,
              status: 'COMPLETED',
            },
          });

          console.log(`✅ [DATABASE] Transcrição finalizada com flows: ${savedTranscription.id}`);

          // Registrar sucesso em UsageLog
          await prisma.usageLog.create({
            data: {
              user_id: userId,
              action_type: 'transcription_completed',
              file_size: job?.fileSize || 0,
              duration: audio_info?.duration || 0,
              cost: calculateTranscriptionCost(job?.fileSize || 0),
            },
          });
        } else {
          console.error(`❌ [FLOWS] Erro ao processar flows: ${flowsResult.error}`);
          // Salvar transcrição mesmo com erro nos flows
          await prisma.transcription.update({
            where: { id: savedTranscription.id },
            data: {
              corrected_text: transcription.text,
              identified_text: transcription.text,
              status: 'COMPLETED_WITH_ERRORS',
            },
          });
        }
      } catch (dbError: any) {
        console.error(`❌ [DATABASE] Erro ao salvar transcrição: ${dbError.message}`);
      }
    } else {
      console.warn(`⚠️ [WEBHOOK] Não foi possível extrair userId de jobId: ${jobId}`);
    }

    // 📡 Emitir evento de conclusão para listeners (ex: TranscriptionProgress)
    try {
      transcriptionEvents.emitComplete(jobId, {
        text: transcription.text,
        correctedText: result.correctedTranscription,
        identifiedText: result.identifiedTranscription,
        summary: result.summary,
        processingTime: result.processingTime,
        audioInfo: result.audioInfo,
      });
      console.log(`📡 [EVENT] Evento de conclusão emitido para ${jobId}`);
    } catch (eventError) {
      console.warn(`⚠️ [EVENT] Erro ao emitir evento: ${eventError}`);
    }

    return NextResponse.json(
      { success: true, message: 'Webhook processado com sucesso', jobId },
      { status: 200 }
    );
  } else if (status === 'failed') {
    console.error(`❌ [WEBHOOK] Falha na transcrição: ${error}`);
    asyncJobStorage.updateJobStatus(jobId, 'FAILURE', undefined, error || 'Falha desconhecida');

    // 📡 Emitir evento de erro
    try {
      transcriptionEvents.emitError(jobId, error || 'Falha desconhecida');
      console.log(`📡 [EVENT] Evento de erro emitido para ${jobId}`);
    } catch (eventError) {
      console.warn(`⚠️ [EVENT] Erro ao emitir evento: ${eventError}`);
    }

    return NextResponse.json(
      { success: false, error: error || 'Falha na transcrição' },
      { status: 200 }
    );
  } else {
    console.warn(`⚠️ [WEBHOOK] Status desconhecido: ${status}`);
    return NextResponse.json(
      { success: false, error: `Status desconhecido: ${status}` },
      { status: 400 }
    );
  }
}

/**
 * Calcula o custo da transcrição baseado no tamanho do arquivo
 */
function calculateTranscriptionCost(fileSizeBytes: number): number {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  // Preço base: $0.10 por MB
  const baseCost = fileSizeMB * 0.10;
  return Math.round(baseCost * 100) / 100;
}
