'use client';

import React, { useState } from 'react';
import { StickyNote, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Note } from '@/lib/transcription-types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NoteManagerProps {
  notes: Note[];
  onAdd: (note: Omit<Note, 'id'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Note>) => void;
}

export default function NoteManager({
  notes,
  onAdd,
  onDelete,
  onUpdate,
}: NoteManagerProps) {
  const [newNoteText, setNewNoteText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isAddingOpen, setIsAddingOpen] = useState(false);

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;

    const note: Omit<Note, 'id'> = {
      position: 0, // Will be set by parent based on current scroll position
      text: newNoteText,
      timestamp: Date.now(),
    };

    onAdd(note);
    setNewNoteText('');
    setIsAddingOpen(false);
  };

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const handleSaveEdit = (id: string) => {
    if (editText.trim()) {
      onUpdate(id, { text: editText });
    }
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <StickyNote className="w-4 h-4" />
          Notas ({notes.length})
        </h3>
        <Popover open={isAddingOpen} onOpenChange={setIsAddingOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Nova Nota</h4>
              <Textarea
                placeholder="Escreva sua nota..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  className="flex-1"
                  disabled={!newNoteText.trim()}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Nenhuma nota adicionada
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
            >
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="min-h-[80px] bg-background"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="h-7 gap-1"
                    >
                      <X className="w-3 h-3" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(note.id)}
                      className="h-7 gap-1"
                    >
                      <Save className="w-3 h-3" />
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap mb-2">{note.text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(note.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(note)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(note.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
