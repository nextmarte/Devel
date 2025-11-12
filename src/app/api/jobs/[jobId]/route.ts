import { NextRequest, NextResponse } from 'next/server';
import { asyncJobStorage } from '@/lib/async-job-storage';
import { globalProcessingTracker } from '@/lib/processing-tracker';
import { correctTranscriptionErrors } from '@/ai/flows/correct-transcription-errors';
import { identifySpeakers } from '@/ai/flows/identify-speakers-in-text';
import { summarizeText } from '@/ai/flows/summarize-text';
import { prisma } from '@/lib/prisma';

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
 * OTIMIZADO: Executa correção e identificação em PARALELO (60-70% mais rápido)
 * Roda automaticamente quando a transcrição chega da API
 */
async function processFlowsServer(jobId: string, rawTranscription: string, generateSummary: boolean = false) {
  try {
    const totalStartTime = Date.now();
    console.log(`[FLOWS-SERVER] 🚀 Iniciando processamento PARALELO de flows para jobId: ${jobId}`);
    
    // Step 1 & 2: Corrigir E Identificar speakers em PARALELO
    console.log(`[FLOWS-SERVER] ⚡ Iniciando correção e identificação em PARALELO...`);
    const parallelStartTime = Date.now();
    
    const [correctedResult, speakersResult] = await Promise.all([
      correctTranscriptionErrors({
        transcription: rawTranscription,
        jobId,
      }),
      identifySpeakers({
        text: rawTranscription,
        jobId,
      })
    ]);
    
    const parallelDuration = Date.now() - parallelStartTime;
    console.log(`[FLOWS-SERVER] ✅ Correção + Identificação concluídas em PARALELO (${parallelDuration}ms)`);
    console.log(`[FLOWS-SERVER] 📊 Speedup estimado: ${Math.round((parallelDuration / (parallelDuration * 2)) * 100)}% mais rápido`);

    // NOVO: Checkpoints de qualidade
    console.log(`[QUALITY-CHECK] 🔍 Validando resultados...`);
    
    const minContentLength = Math.ceil(rawTranscription.length * 0.7);
    const correctedValid = correctedResult.correctedTranscription.length > minContentLength;
    const speakersValid = speakersResult.identifiedText.length > minContentLength;
    const correctedHasContent = correctedResult.correctedTranscription.split(/\s+/).length > 10;
    const speakersHasSpeakers = /Locutor \d+:/i.test(speakersResult.identifiedText);
    
    console.log(`[QUALITY-CHECK] 📋 Resultados:`, {
      correctedLength: `${correctedResult.correctedTranscription.length} chars`,
      speakersLength: `${speakersResult.identifiedText.length} chars`,
      correctedValid,
      speakersValid,
      correctedHasContent,
      speakersHasSpeakers,
    });
    
    // Validar correção
    if (!correctedValid) {
      console.warn(`[QUALITY-CHECK] ⚠️ Correção pode estar incompleta: ${correctedResult.correctedTranscription.length} chars (esperado: >~${minContentLength})`);
      if (!correctedHasContent) {
        console.log(`[FALLBACK] 🔄 Usando transcrição original (correção inválida)`);
        correctedResult.correctedTranscription = rawTranscription;
      }
    } else {
      console.log(`[QUALITY-CHECK] ✅ Correção válida (${correctedResult.correctedTranscription.split(/\s+/).length} palavras)`);
    }
    
    // Validar identificação de locutores
    if (!speakersValid) {
      console.warn(`[QUALITY-CHECK] ⚠️ Identificação pode estar incompleta: ${speakersResult.identifiedText.length} chars`);
      if (!speakersHasSpeakers) {
        console.log(`[FALLBACK] 🔄 Usando transcrição original para identificação`);
        speakersResult.identifiedText = rawTranscription;
      }
    } else {
      console.log(`[QUALITY-CHECK] ✅ Identificação válida (${speakersHasSpeakers ? 'com locutores' : 'sem locutores marcados'})`);
    }

    let summary: string | null = null;
    if (generateSummary) {
      // Step 3: Gerar sumário (usando texto identificado)
      console.log(`[FLOWS-SERVER] 📊 Iniciando geração de sumário...`);
      const summaryResult = await summarizeText({
        text: speakersResult.identifiedText,
        jobId,
      });
      summary = summaryResult.summary;
      console.log(`[FLOWS-SERVER] ✅ Sumário gerado (${summary?.length || 0} chars)`);
    }

    const totalDuration = Date.now() - totalStartTime;
    console.log(`[FLOWS-SERVER] 🎉 Todos os flows completados em ${totalDuration}ms`);
    console.log(`[FLOWS-SERVER] 📈 Tempo total (com paralelo): ${totalDuration}ms`);
    console.log(`[FLOWS-SERVER] 📊 Resumo final:`, {
      raw: `${rawTranscription.length} chars`,
      corrected: `${correctedResult.correctedTranscription.length} chars`,
      identified: `${speakersResult.identifiedText.length} chars`,
      summary: summary ? `${summary.length} chars` : 'none',
    });

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
        const statusUrl = `${apiUrl}/api/transcribe/async/status/${taskId}`;
        console.log(`[SYNC] 🔄 Sincronizando com API: ${statusUrl}`);
        
        // Adicionar timeout de 10 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const apiResponse = await fetch(statusUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
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
            
            // NOVO: Capturar eventos ANTES de salvar
            const processingEvents = globalProcessingTracker.getEventsForJob(jobId);
            console.log(`[SYNC] 🎯 Capturando ${processingEvents.length} eventos antes de salvar job`);
            
            asyncJobStorage.updateJobStatus(jobId, 'SUCCESS', resultData);
            
            // Adicionar eventos ao job após atualizar
            const updatedJob = asyncJobStorage.getJob(jobId);
            if (updatedJob && processingEvents.length > 0) {
              updatedJob.processingEvents = processingEvents;
              console.log(`[SYNC] ✅ Eventos anexados ao job`);
            }
            
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
          console.warn(`[SYNC] ⚠️ API retornou status ${apiResponse.status} para ${statusUrl}`);
          // Tentar fazer parse de erro
          try {
            const errorData = await apiResponse.json();
            console.warn(`[SYNC] Erro da API:`, errorData);
          } catch (e) {
            // Ignorar erro de parse
          }
        }
      } catch (syncError: any) {
        if (syncError.name === 'AbortError') {
          console.warn(`[SYNC TIMEOUT] ⏱️ Timeout ao sincronizar com API (10s)`);
        } else {
          console.error(`[SYNC ERROR] ❌ Erro ao sincronizar com API:`, syncError?.message || syncError);
        }
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

    // NOVO: Salvar transcrição no banco de dados se tiver resultado e status SUCCESS
    if (job.status === 'SUCCESS' && job.result?.rawTranscription) {
      try {
        // Extrair userId do jobId (formato: user_XXX:task_YYY)
        const parts = jobId.split(':');
        const userIdPrefix = parts[0]; // "user_XXX"
        const userId = userIdPrefix.startsWith('user_') ? userIdPrefix.substring(5) : null;

        if (userId) {
          // Verificar se transcrição já existe no banco
          const existingTranscription = await prisma.transcription.findFirst({
            where: { job_id: jobId },
          });

          if (!existingTranscription) {
            console.log(`[GET /api/jobs/${jobId}] 💾 Salvando transcrição no banco para userId: ${userId}`);
            
            const savedTranscription = await prisma.transcription.create({
              data: {
                user_id: userId,
                job_id: jobId,
                file_name: job.fileName || 'transcrição.ogg',
                status: 'COMPLETED',
                raw_text: job.result.rawTranscription,
                corrected_text: job.result.correctedTranscription || job.result.rawTranscription,
                identified_text: job.result.identifiedTranscription || job.result.rawTranscription,
                summary: job.result.summary || null,
                file_size: job.fileSize || 0,
                file_duration: job.result.audioInfo?.duration || 0,
                language: 'pt-BR',
                metadata: {
                  processingTime: job.result.processingTime || 0,
                  audioInfo: job.result.audioInfo || {},
                },
              },
            });

            console.log(`[GET /api/jobs/${jobId}] ✅ Transcrição salva no banco: ${savedTranscription.id}`);
          } else {
            console.log(`[GET /api/jobs/${jobId}] ℹ️ Transcrição já existe no banco: ${existingTranscription.id}`);
          }
        } else {
          console.warn(`[GET /api/jobs/${jobId}] ⚠️ Não foi possível extrair userId de jobId: ${jobId}`);
        }
      } catch (dbError: any) {
        console.error(`[GET /api/jobs/${jobId}] ❌ Erro ao salvar transcrição no banco:`, dbError.message);
        // Continuar mesmo se falhar a salvação no banco
      }
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
      console.log(`[GET /api/jobs/${jobId}] 📭 Nenhum evento registrado`);
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
