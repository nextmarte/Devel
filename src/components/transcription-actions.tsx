import React, { useState } from 'react';
import { Copy, Download, Share2, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type TranscriptionActionsProps = {
  text: string;
  title?: string;
};

export default function TranscriptionActions({ text, title = 'transcrição' }: TranscriptionActionsProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'Copiado',
        description: `${title} copiada para a área de transferência`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível copiar',
      });
    }
  };

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: 'Download iniciado',
      description: `${title} foi baixada como arquivo de texto`,
    });
  };

  const handleDownloadPdf = async () => {
    try {
      const jsPDFModule = await import('jspdf');
      const { jsPDF } = jsPDFModule;
      const doc = new jsPDF();
      
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      const maxWidth = pageWidth - 2 * margin;
      
      // Adiciona título
      doc.setFontSize(16);
      doc.text(title, margin, margin + 10);
      
      // Adiciona data
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, margin + 20);
      
      // Adiciona conteúdo
      doc.setFontSize(11);
      doc.setTextColor(0);
      const splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, margin, margin + 30);
      
      doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: 'Download iniciado',
        description: `${title} foi baixada como PDF`,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível gerar o PDF. Tente novamente.',
      });
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const docxModule = await import('docx');
      const { Document, Packer, Paragraph, HeadingLevel } = docxModule;
      
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                text: `Data: ${new Date().toLocaleDateString('pt-BR')}`,
                spacing: { after: 400 },
              }),
              ...text.split('\n').map(paragraph =>
                new Paragraph({
                  text: paragraph || ' ',
                  spacing: { line: 240, after: 200 },
                })
              ),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const element = document.createElement('a');
      element.href = url;
      element.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download iniciado',
        description: `${title} foi baixada como DOCX`,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível gerar o DOCX. Tente novamente.',
      });
    }
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `📄 *${title}*\n\n${text.substring(0, 500)}${text.length > 500 ? '...\n\n(Mensagem truncada)' : ''}`
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');

    toast({
      title: 'Abrindo WhatsApp',
      description: 'A mensagem foi preparada para compartilhamento',
    });
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="gap-2"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copiado' : 'Copiar'}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={handleDownloadTxt}>
            Texto (.txt)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadDocx}>
            <FileText className="w-4 h-4 mr-2" />
            Word (.docx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadPdf}>
            PDF (.pdf)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        onClick={handleShareWhatsApp}
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        WhatsApp
      </Button>
    </div>
  );
}
