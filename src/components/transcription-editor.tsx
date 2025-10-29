'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { TranscriptionEdit } from '@/lib/transcription-types';

interface TranscriptionEditorProps {
  initialText: string;
  onSave: (editedText: string, edits: TranscriptionEdit[]) => void;
  readOnly?: boolean;
}

export default function TranscriptionEditor({ 
  initialText, 
  onSave, 
  readOnly = false 
}: TranscriptionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(initialText);
  const [edits, setEdits] = useState<TranscriptionEdit[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setEditedText(initialText);
  }, [initialText]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleSave = () => {
    if (editedText !== initialText) {
      const edit: TranscriptionEdit = {
        timestamp: Date.now(),
        originalText: initialText,
        editedText: editedText,
        position: 0,
      };
      
      const newEdits = [...edits, edit];
      setEdits(newEdits);
      onSave(editedText, newEdits);
      
      toast({
        title: 'Alterações salvas',
        description: 'Suas edições foram salvas com sucesso',
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(initialText);
    setIsEditing(false);
  };

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

  if (readOnly) {
    return (
      <div className="w-full text-left whitespace-pre-wrap font-body text-base leading-relaxed">
        {renderText(editedText)}
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="relative group">
        <div className="w-full text-left whitespace-pre-wrap font-body text-base leading-relaxed">
          {renderText(editedText)}
        </div>
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartEdit}
            className="gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        className="min-h-[400px] font-body text-base leading-relaxed"
        placeholder="Digite a transcrição..."
      />
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="gap-2"
        >
          <X className="w-4 h-4" />
          Cancelar
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          Salvar
        </Button>
      </div>
      {edits.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {edits.length} edição(ões) realizada(s)
        </div>
      )}
    </div>
  );
}
