import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import TranscriptionActions from './transcription-actions';

type SummaryDisplayProps = {
  summary: string;
};

// A simple Markdown-like parser
const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Headers (e.g., **Title:**)
    if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(<h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(2, -2)}</h3>);
      continue;
    }
    
    // Bold text inside a line
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
    
    // List items (e.g., - Item)
    if (line.trim().startsWith('- ')) {
      if (!inList) {
        inList = true;
        elements.push(<ul key={`ul-${i}`} className="list-disc pl-5 mb-2"></ul>);
      }
      const listElement = elements[elements.length - 1] as React.ReactElement;
      const listItems = listElement.props.children || [];
      listItems.push(<li key={i} dangerouslySetInnerHTML={{ __html: line.trim().slice(2) }} />);
      elements[elements.length - 1] = React.cloneElement(listElement, {}, listItems);
    } else {
      inList = false;
      elements.push(<p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: line }} />);
    }
  }

  return elements;
};


export default function SummaryDisplay({ summary }: SummaryDisplayProps) {
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
