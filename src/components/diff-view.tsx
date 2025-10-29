import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';

type DiffViewProps = {
  original: string;
  corrected: string;
};

// Simple diff algorithm to highlight changes
const calculateDiff = (original: string, corrected: string) => {
  const origWords = original.split(/\s+/);
  const corrWords = corrected.split(/\s+/);
  const result: { type: 'unchanged' | 'removed' | 'added'; text: string }[] = [];

  let i = 0,
    j = 0;
  while (i < origWords.length || j < corrWords.length) {
    if (i < origWords.length && j < corrWords.length && origWords[i] === corrWords[j]) {
      result.push({ type: 'unchanged', text: origWords[i] });
      i++;
      j++;
    } else if (i < origWords.length) {
      result.push({ type: 'removed', text: origWords[i] });
      i++;
    } else if (j < corrWords.length) {
      result.push({ type: 'added', text: corrWords[j] });
      j++;
    }
  }

  return result;
};

export default function DiffView({ original, corrected }: DiffViewProps) {
  const diff = useMemo(() => calculateDiff(original, corrected), [original, corrected]);

  const hasChanges = diff.some(item => item.type !== 'unchanged');

  if (!hasChanges) {
    return (
      <div className="w-full text-left whitespace-pre-wrap font-body text-base leading-relaxed">
        {original}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          {diff.filter(item => item.type !== 'unchanged').length} mudanças detectadas
        </p>
      </div>
      <div className="w-full text-left font-body text-base leading-relaxed">
        {diff.map((item, index) => {
          switch (item.type) {
            case 'removed':
              return (
                <span key={index} className="line-through text-red-500 bg-red-500/10">
                  {item.text}{' '}
                </span>
              );
            case 'added':
              return (
                <span key={index} className="font-semibold text-green-500 bg-green-500/10">
                  {item.text}{' '}
                </span>
              );
            default:
              return <span key={index}>{item.text} </span>;
          }
        })}
      </div>
    </div>
  );
}
