import React, { useState } from 'react';
import { Copy, Download, Check, FileText } from 'lucide-react';
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

  const handleDownloadDocx = async () => {
    try {
      const docxModule = await import('docx');
      const { Document, Packer, Paragraph, HeadingLevel, AlignmentType } = docxModule;
      
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
                  alignment: AlignmentType.JUSTIFIED,
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
          <DropdownMenuItem onClick={handleDownloadDocx}>
            <FileText className="w-4 h-4 mr-2" />
            Word (.docx)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
