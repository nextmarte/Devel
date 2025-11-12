import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import { requireServerAuth } from '@/lib/server-auth';

/**
 * POST /api/transcriptions/export-docx
 * Exporta uma transcrição em formato DOCX
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireServerAuth();
    const body = await request.json();
    const { jobId, fileName, raw_text, corrected_text, identified_text, summary } = body;

    // Criar documento com as versões da transcrição
    const sections = [];

    // Título
    sections.push(
      new Paragraph({
        text: 'TRANSCRIÇÃO DE ÁUDIO',
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: 'TRANSCRIÇÃO DE ÁUDIO',
            bold: true,
            size: 32,
          }),
        ],
        spacing: { after: 200 },
      })
    );

    // Metadados
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Arquivo: ${fileName}`,
            size: 20,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Data: ${new Date().toLocaleDateString('pt-BR')}`,
            size: 20,
          }),
        ],
        spacing: { after: 200 },
      })
    );

    // Seção: Transcrição Original
    if (raw_text) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: 'Transcrição Original',
              bold: true,
            }),
          ],
          spacing: { before: 300, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: raw_text,
              size: 22,
            }),
          ],
          spacing: { after: 300 },
        })
      );
    }

    // Seção: Transcrição Corrigida
    if (corrected_text) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: 'Transcrição Corrigida',
              bold: true,
            }),
          ],
          spacing: { before: 300, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: corrected_text,
              size: 22,
            }),
          ],
          spacing: { after: 300 },
        })
      );
    }

    // Seção: Com Identificação de Falantes
    if (identified_text) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: 'Transcrição com Identificação de Falantes',
              bold: true,
            }),
          ],
          spacing: { before: 300, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: identified_text,
              size: 22,
            }),
          ],
          spacing: { after: 300 },
        })
      );
    }

    // Seção: Resumo/Ata
    if (summary) {
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: 'Resumo/Ata',
              bold: true,
            }),
          ],
          spacing: { before: 300, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: summary,
              size: 22,
            }),
          ],
          spacing: { after: 300 },
        })
      );
    }

    // Criar documento
    const doc = new Document({
      sections: [
        {
          children: sections,
          properties: {},
        },
      ],
    });

    // Gerar buffer
    const buffer = await Packer.toBuffer(doc);

    // Retornar como arquivo
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName.split('.')[0]}_transcrição.docx"`,
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao exportar DOCX:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao exportar DOCX' },
      { status: 500 }
    );
  }
}
