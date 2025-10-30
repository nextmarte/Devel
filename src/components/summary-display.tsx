import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import TranscriptionActions from './transcription-actions';

type SummaryDisplayProps = {
  summary: string;
};

export default function SummaryDisplay({ summary }: SummaryDisplayProps) {
  // Simple markdown rendering with table support
  const renderMarkdown = (text: string) => {
    const parts = [];
    const lines = text.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Check for table (lines with |)
      if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|') && lines[i + 1].includes('-')) {
        const headerLine = line;
        const separatorLine = lines[i + 1];
        const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);
        
        let tableRows = [];
        let j = i + 2;
        while (j < lines.length && lines[j].includes('|')) {
          const cells = lines[j].split('|').map(c => c.trim()).filter(c => c);
          if (cells.length === headers.length) {
            tableRows.push(cells);
          }
          j++;
        }

        parts.push(
          <div key={`table-${i}`} className="overflow-x-auto my-4">
            <table className="w-full border-collapse border border-muted">
              <thead>
                <tr className="bg-muted/50">
                  {headers.map((header, idx) => (
                    <th key={idx} className="border border-muted px-3 py-2 text-left font-bold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-muted/30">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border border-muted px-3 py-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

        i = j;
        continue;
      }

      // Headers com #
      if (line.startsWith('###')) {
        parts.push(<h3 key={i} className="text-lg font-bold text-primary mt-4 mb-2">{line.replace('### ', '')}</h3>);
        i++;
        continue;
      }
      if (line.startsWith('##')) {
        parts.push(<h2 key={i} className="text-xl font-bold text-primary mt-4 mb-2">{line.replace('## ', '')}</h2>);
        i++;
        continue;
      }
      if (line.startsWith('#')) {
        parts.push(<h1 key={i} className="text-2xl font-bold text-primary mt-4 mb-2">{line.replace('# ', '')}</h1>);
        i++;
        continue;
      }

      // Listas
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        const listItems = [];
        while (i < lines.length && (lines[i].trim().startsWith('-') || lines[i].trim().startsWith('*'))) {
          const item = lines[i].replace(/^[-*]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1');
          listItems.push(
            <li key={i} className="text-foreground ml-2">
              {item}
            </li>
          );
          i++;
        }
        parts.push(
          <ul key={`list-${i}`} className="list-disc list-inside space-y-1 my-2">
            {listItems}
          </ul>
        );
        continue;
      }

      // Parágrafos vazios
      if (!line.trim()) {
        i++;
        continue;
      }

      // Negrito e itálico
      let content = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/__(.*?)__/g, '<u class="underline">$1</u>');

      parts.push(
        <p key={i} className="text-foreground leading-relaxed my-2 text-justify" dangerouslySetInnerHTML={{ __html: content }} />
      );
      i++;
    }

    return parts;
  };

  return (
    <Card className="shadow-lg shadow-primary/10 border-border">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Ata da Reunião / Resumo</CardTitle>
        <div className="mt-4">
          <TranscriptionActions text={summary} title="Ata da Reunião" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-invert max-w-none text-left font-body text-base leading-relaxed">
          {renderMarkdown(summary)}
        </div>
      </CardContent>
    </Card>
  );
}
