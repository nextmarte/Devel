'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface TranscriptionSearchProps {
  text: string;
  onHighlight: (matches: number[], currentIndex: number) => void;
}

export default function TranscriptionSearch({ text, onHighlight }: TranscriptionSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [speakerFilter, setSpeakerFilter] = useState<string>('all');
  const [matches, setMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Extract unique speakers from text
  const extractSpeakers = (text: string): string[] => {
    const speakerRegex = /Locutor (\d+):/g;
    const speakers = new Set<string>();
    let match;
    
    while ((match = speakerRegex.exec(text)) !== null) {
      speakers.add(match[1]);
    }
    
    return Array.from(speakers).sort((a, b) => parseInt(a) - parseInt(b));
  };

  const speakers = extractSpeakers(text);

  // Find all matches in text
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      onHighlight([], -1);
      return;
    }

    let searchText = text;
    
    // Filter by speaker if selected
    if (speakerFilter !== 'all') {
      const speakerRegex = new RegExp(`Locutor ${speakerFilter}:([^L]*)`, 'g');
      const speakerMatches = [...text.matchAll(speakerRegex)];
      searchText = speakerMatches.map(m => m[0]).join(' ');
    }

    const query = searchQuery.toLowerCase();
    const foundMatches: number[] = [];
    let index = 0;

    while (index < searchText.length) {
      const matchIndex = searchText.toLowerCase().indexOf(query, index);
      if (matchIndex === -1) break;
      foundMatches.push(matchIndex);
      index = matchIndex + 1;
    }

    setMatches(foundMatches);
    if (foundMatches.length > 0) {
      setCurrentMatchIndex(0);
      onHighlight(foundMatches, 0);
    } else {
      setCurrentMatchIndex(-1);
      onHighlight([], -1);
    }
  }, [searchQuery, speakerFilter, text]);

  const handlePrevious = () => {
    if (matches.length === 0) return;
    const newIndex = currentMatchIndex <= 0 ? matches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(newIndex);
    onHighlight(matches, newIndex);
  };

  const handleNext = () => {
    if (matches.length === 0) return;
    const newIndex = currentMatchIndex >= matches.length - 1 ? 0 : currentMatchIndex + 1;
    setCurrentMatchIndex(newIndex);
    onHighlight(matches, newIndex);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSpeakerFilter('all');
    setMatches([]);
    setCurrentMatchIndex(-1);
    onHighlight([], -1);
  };

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar na transcrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={handleClear}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {speakers.length > 0 && (
          <Select value={speakerFilter} onValueChange={setSpeakerFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por locutor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os locutores</SelectItem>
              {speakers.map((speaker) => (
                <SelectItem key={speaker} value={speaker}>
                  Locutor {speaker}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {searchQuery && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {matches.length === 0 
                ? 'Nenhum resultado' 
                : `${currentMatchIndex + 1} de ${matches.length} resultados`}
            </Badge>
            {speakerFilter !== 'all' && (
              <Badge variant="outline">
                Locutor {speakerFilter}
              </Badge>
            )}
          </div>
          
          {matches.length > 0 && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={matches.length === 0}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={matches.length === 0}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
