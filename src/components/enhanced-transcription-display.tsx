'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TranscriptionEditor from '@/components/transcription-editor';
import TranscriptionSearch from '@/components/transcription-search';
import { TranscriptionEdit } from '@/lib/transcription-types';

type EnhancedTranscriptionDisplayProps = {
  raw?: string;
  corrected?: string;
  identified?: string;
  onEdit?: (editedText: string, edits: TranscriptionEdit[]) => void;
  editable?: boolean;
};

export default function EnhancedTranscriptionDisplay({ 
  raw, 
  corrected, 
  identified,
  onEdit,
  editable = false
}: EnhancedTranscriptionDisplayProps) {
  const [activeTab, setActiveTab] = useState('identified');
  const [highlightMatches, setHighlightMatches] = useState<number[]>([]);
  const [currentMatch, setCurrentMatch] = useState(-1);
  const contentRef = useRef<HTMLDivElement>(null);

  const getCurrentText = () => {
    if (activeTab === 'raw' && raw) return raw;
    if (activeTab === 'corrected' && corrected) return corrected;
    if (activeTab === 'identified' && identified) return identified;
    return '';
  };

  const handleHighlight = (matches: number[], currentIndex: number) => {
    setHighlightMatches(matches);
    setCurrentMatch(currentIndex);
    
    // Scroll to current match
    if (currentIndex >= 0 && contentRef.current) {
      const elements = contentRef.current.querySelectorAll('.search-highlight');
      if (elements[currentIndex]) {
        elements[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const splitText = (text: string) => {
    return text.split(/(Locutor \d+:)/g).filter(Boolean);
  };

  const highlightSearchMatches = (text: string) => {
    if (highlightMatches.length === 0 || !text) {
      return renderText(text);
    }

    const query = getCurrentText().toLowerCase();
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let matchCounter = 0;

    highlightMatches.forEach((matchIndex) => {
      if (matchIndex < lastIndex) return;

      // Add text before match
      if (matchIndex > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, matchIndex)}
          </span>
        );
      }

      // Find the end of the search query
      const queryEnd = matchIndex + query.length;
      const isCurrentMatch = matchCounter === currentMatch;

      // Add highlighted match
      parts.push(
        <mark
          key={`match-${matchIndex}`}
          className={`search-highlight ${isCurrentMatch ? 'bg-accent text-accent-foreground' : 'bg-yellow-200 dark:bg-yellow-900'} rounded px-1`}
        >
          {text.substring(matchIndex, queryEnd)}
        </mark>
      );

      lastIndex = queryEnd;
      matchCounter++;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  const renderText = (text: string) => {
    if (!text) return null;
    
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
    return (
      <div className="space-y-4">
        <TranscriptionSearch text={identified} onHighlight={handleHighlight} />
        <div ref={contentRef} className="w-full text-left whitespace-pre-wrap font-body text-base leading-relaxed">
          {editable ? (
            <TranscriptionEditor
              initialText={identified}
              onSave={(editedText, edits) => onEdit?.(editedText, edits)}
              readOnly={!editable}
            />
          ) : (
            highlightMatches.length > 0 ? highlightSearchMatches(identified) : renderText(identified)
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TranscriptionSearch text={getCurrentText()} onHighlight={handleHighlight} />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {raw && <TabsTrigger value="raw">Original</TabsTrigger>}
          {corrected && <TabsTrigger value="corrected">Corrigida</TabsTrigger>}
          {identified && <TabsTrigger value="identified">Com Locutores</TabsTrigger>}
        </TabsList>
        
        {raw && (
          <TabsContent value="raw" className="mt-4">
            <div ref={contentRef} className="w-full text-left whitespace-pre-wrap font-body text-base leading-relaxed text-gray-600">
              {highlightMatches.length > 0 ? highlightSearchMatches(raw) : renderText(raw)}
            </div>
          </TabsContent>
        )}
        
        {corrected && (
          <TabsContent value="corrected" className="mt-4">
            <div ref={contentRef} className="w-full text-left whitespace-pre-wrap font-body text-base leading-relaxed">
              {highlightMatches.length > 0 ? highlightSearchMatches(corrected) : renderText(corrected)}
            </div>
          </TabsContent>
        )}
        
        {identified && (
          <TabsContent value="identified" className="mt-4">
            <div ref={contentRef} className="w-full text-left whitespace-pre-wrap font-body text-base leading-relaxed">
              {editable ? (
                <TranscriptionEditor
                  initialText={identified}
                  onSave={(editedText, edits) => onEdit?.(editedText, edits)}
                  readOnly={!editable}
                />
              ) : (
                highlightMatches.length > 0 ? highlightSearchMatches(identified) : renderText(identified)
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
