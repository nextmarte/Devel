'use client';

import React, { useMemo } from 'react';
import { BarChart3, Clock, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TranscriptionAnalyticsProps {
  rawTranscription: string;
  correctedTranscription: string;
  identifiedTranscription: string;
  duration: number;
}

interface SpeakerStats {
  speaker: string;
  wordCount: number;
  percentage: number;
}

export default function TranscriptionAnalytics({
  rawTranscription,
  correctedTranscription,
  identifiedTranscription,
  duration,
}: TranscriptionAnalyticsProps) {
  const analytics = useMemo(() => {
    // Calculate accuracy (percentage of unchanged words)
    const rawWords = rawTranscription.split(/\s+/).filter(w => w.length > 0);
    const correctedWords = correctedTranscription.split(/\s+/).filter(w => w.length > 0);
    
    let unchangedWords = 0;
    const minLength = Math.min(rawWords.length, correctedWords.length);
    for (let i = 0; i < minLength; i++) {
      if (rawWords[i].toLowerCase() === correctedWords[i].toLowerCase()) {
        unchangedWords++;
      }
    }
    
    const accuracy = rawWords.length > 0 
      ? Math.round((unchangedWords / rawWords.length) * 100) 
      : 100;

    // Calculate words per speaker
    const speakerRegex = /(Locutor \d+):([\s\S]*?)(?=Locutor \d+:|$)/g;
    const matches = [...identifiedTranscription.matchAll(speakerRegex)];
    
    const speakerStats: Record<string, number> = {};
    let totalWords = 0;

    matches.forEach((match) => {
      const speaker = match[1];
      const text = match[2];
      const words = text.split(/\s+/).filter(w => w.length > 0).length;
      speakerStats[speaker] = (speakerStats[speaker] || 0) + words;
      totalWords += words;
    });

    const speakerData: SpeakerStats[] = Object.entries(speakerStats).map(([speaker, count]) => ({
      speaker,
      wordCount: count,
      percentage: totalWords > 0 ? Math.round((count / totalWords) * 100) : 0,
    }));

    // Calculate average sentence duration
    const sentences = identifiedTranscription.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceDuration = sentences.length > 0 
      ? Math.round(duration / sentences.length) 
      : 0;

    return {
      totalDuration: duration,
      totalWords: totalWords,
      accuracy,
      speakerData,
      sentenceCount: sentences.length,
      avgSentenceDuration,
      corrections: rawWords.length - unchangedWords,
    };
  }, [rawTranscription, correctedTranscription, identifiedTranscription, duration]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Estatísticas da Transcrição
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Duration */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Duração Total</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(analytics.totalDuration)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.totalWords} palavras
            </p>
          </div>

          {/* Accuracy Rate */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Taxa de Precisão</span>
            </div>
            <p className="text-2xl font-bold">{analytics.accuracy}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.corrections} correções realizadas
            </p>
          </div>

          {/* Average Sentence Duration */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Duração Média por Frase</span>
            </div>
            <p className="text-2xl font-bold">{analytics.avgSentenceDuration}s</p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.sentenceCount} frases detectadas
            </p>
          </div>

          {/* Speakers Count */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Locutores Identificados</span>
            </div>
            <p className="text-2xl font-bold">{analytics.speakerData.length}</p>
          </div>
        </div>

        {/* Words per Speaker */}
        {analytics.speakerData.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3">Palavras por Locutor</h4>
            <div className="space-y-3">
              {analytics.speakerData.map((speaker) => (
                <div key={speaker.speaker}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{speaker.speaker}</span>
                    <span className="text-muted-foreground">
                      {speaker.wordCount} palavras ({speaker.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${speaker.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
