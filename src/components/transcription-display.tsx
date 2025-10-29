import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TranscriptionDisplayProps = {
  raw?: string;
  corrected?: string;
  identified?: string;
};

export default function TranscriptionDisplay({ 
  raw, 
  corrected, 
  identified 
}: TranscriptionDisplayProps) {
  // Split by speaker labels, but keep the delimiter
  const splitText = (text: string) => {
    return text.split(/(Locutor \d+:)/g).filter(Boolean);
  };

  const renderText = (text: string) => {
    const parts = splitText(text);
    return parts.map((part, index) => {
      if (part.match(/Locutor \d+:/)) {
        return (
          <React.Fragment key={index}>
            {index > 0 && <br />}
            <span className="font-bold text-primary">{part}</span>
          </React.Fragment>
        );
      }
      return <span key={index}>{part.trim()}</span>;
    });
  };

  const hasMultipleVersions = (raw || corrected || identified) && 
    [raw, corrected, identified].filter(Boolean).length > 1;

  if (!hasMultipleVersions && identified) {
    // If only identified version exists, show it directly
    return (
      <div className="w-full text-left whitespace-pre-wrap font-body text-base leading-relaxed">
        {renderText(identified)}
      </div>
    );
  }

  return (
    <Tabs defaultValue="identified" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        {raw && <TabsTrigger value="raw">Original</TabsTrigger>}
        {corrected && <TabsTrigger value="corrected">Corrigida</TabsTrigger>}
        {identified && <TabsTrigger value="identified">Com Locutores</TabsTrigger>}
      </TabsList>
      
      {raw && (
        <TabsContent value="raw" className="mt-4">
          <div className="w-full text-left whitespace-pre-wrap font-body text-base leading-relaxed text-gray-600">
            {renderText(raw)}
          </div>
        </TabsContent>
      )}
      
      {corrected && (
        <TabsContent value="corrected" className="mt-4">
          <div className="w-full text-left whitespace-pre-wrap font-body text-base leading-relaxed">
            {renderText(corrected)}
          </div>
        </TabsContent>
      )}
      
      {identified && (
        <TabsContent value="identified" className="mt-4">
          <div className="w-full text-left whitespace-pre-wrap font-body text-base leading-relaxed">
            {renderText(identified)}
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}
