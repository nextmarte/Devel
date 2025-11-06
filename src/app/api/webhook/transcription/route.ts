import { NextRequest, NextResponse } from 'next/server';
import { asyncJobStorage } from '@/lib/async-job-storage';
import { correctTranscriptionErrors } from '@/ai/flows/correct-transcription-errors';
import { identifySpeakers } from '@/ai/flows/identify-speakers-in-text';
import { summarizeText } from '@/ai/flows/summarize-text';

export async function POST(request: NextRequest) {
  try {
    // Validar secret do webhook
    const webhookSecret = request.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      console.warn('Webhook recebido com secret inválido');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const { jobId, status, result, error: apiError, processingTime } = payload;

    if (!jobId || !status) {
      return NextResponse.json(
        { error: 'jobId e status são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`Webhook recebido: job ${jobId} com status ${status}`);

    // Atualizar job com status da API
    const job = asyncJobStorage.updateJobStatus(
      jobId,
      status,
      undefined,
      apiError,
      processingTime
    );

    if (!job) {
      return NextResponse.json(
        { error: `Job ${jobId} não encontrado` },
        { status: 404 }
      );
    }

    // Se a transcrição foi bem-sucedida, processar com IA
    if (status === 'SUCCESS' && result) {
      try {
        const rawTranscription = result.transcription?.text || '';
        
        if (!rawTranscription) {
          throw new Error('Texto de transcrição vazio');
        }

        // Step 1: Corrigir erros gramaticais
        console.log(`Corrigindo transcrição do job ${jobId}...`);
        const correctedResult = await correctTranscriptionErrors({
          transcription: rawTranscription,
        });

        // Step 2: Identificar falantes
        console.log(`Identificando falantes do job ${jobId}...`);
        const speakersResult = await identifySpeakers({
          text: correctedResult.correctedTranscription,
        });
        const identifiedText = speakersResult.identifiedText;

        // Step 3: Gerar resumo (se necessário)
        // Você pode adicionar um flag no job para decidir se gera resumo
        let summary: string | null = null;
        console.log(`Gerando resumo do job ${jobId}...`);
        const summaryResult = await summarizeText({ text: identifiedText });
        summary = summaryResult.summary;

        // Atualizar job com resultado final
        const finalResult = {
          rawTranscription,
          correctedTranscription: correctedResult.correctedTranscription,
          identifiedTranscription: identifiedText,
          summary,
          processingTime: processingTime || 0,
          audioInfo: result.audio_info || {
            format: '',
            duration: 0,
            sampleRate: 0,
            channels: 0,
            fileSizeMb: 0,
          },
        };

        asyncJobStorage.updateJobStatus(jobId, 'SUCCESS', finalResult);

        console.log(`Job ${jobId} processado com sucesso`);

        return NextResponse.json({
          success: true,
          message: 'Transcrição processada com sucesso',
          jobId,
        });
      } catch (processingError: any) {
        console.error(`Erro ao processar job ${jobId}:`, processingError);

        // Marcar job como falho com erro do processamento
        asyncJobStorage.updateJobStatus(
          jobId,
          'FAILURE',
          undefined,
          `Erro no processamento: ${processingError.message}`
        );

        return NextResponse.json(
          {
            success: false,
            error: `Erro ao processar transcrição: ${processingError.message}`,
            jobId,
          },
          { status: 500 }
        );
      }
    }

    if (status === 'FAILURE') {
      console.error(`Job ${jobId} falhou: ${apiError}`);
    }

    return NextResponse.json({
      success: true,
      message: `Job ${jobId} atualizado para status ${status}`,
      jobId,
    });
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: `Erro interno: ${error.message}` },
      { status: 500 }
    );
  }
}
