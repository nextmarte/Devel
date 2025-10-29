'use client';

import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bookmark as BookmarkType } from '@/lib/transcription-types';

interface BookmarkManagerProps {
  bookmarks: BookmarkType[];
  onAdd: (bookmark: Omit<BookmarkType, 'id'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<BookmarkType>) => void;
  onJumpTo: (position: number) => void;
}

const BOOKMARK_COLORS = [
  { value: 'red', label: 'Vermelho', class: 'bg-red-500' },
  { value: 'yellow', label: 'Amarelo', class: 'bg-yellow-500' },
  { value: 'green', label: 'Verde', class: 'bg-green-500' },
  { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
  { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
  { value: 'pink', label: 'Rosa', class: 'bg-pink-500' },
];

export default function BookmarkManager({
  bookmarks,
  onAdd,
  onDelete,
  onUpdate,
  onJumpTo,
}: BookmarkManagerProps) {
  const [newBookmarkLabel, setNewBookmarkLabel] = useState('');
  const [newBookmarkColor, setNewBookmarkColor] = useState('blue');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [isAddingOpen, setIsAddingOpen] = useState(false);

  const handleAddBookmark = () => {
    if (!newBookmarkLabel.trim()) return;

    const bookmark: Omit<BookmarkType, 'id'> = {
      timestamp: Date.now(),
      position: 0, // Will be set by parent based on current scroll position
      label: newBookmarkLabel,
      color: newBookmarkColor,
    };

    onAdd(bookmark);
    setNewBookmarkLabel('');
    setNewBookmarkColor('blue');
    setIsAddingOpen(false);
  };

  const handleStartEdit = (bookmark: BookmarkType) => {
    setEditingId(bookmark.id);
    setEditLabel(bookmark.label);
  };

  const handleSaveEdit = (id: string) => {
    if (editLabel.trim()) {
      onUpdate(id, { label: editLabel });
    }
    setEditingId(null);
    setEditLabel('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
  };

  const getColorClass = (color?: string) => {
    const colorObj = BOOKMARK_COLORS.find(c => c.value === color);
    return colorObj?.class || 'bg-blue-500';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Bookmark className="w-4 h-4" />
          Marcadores ({bookmarks.length})
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
              <h4 className="font-medium text-sm">Novo Marcador</h4>
              <Input
                placeholder="Nome do marcador"
                value={newBookmarkLabel}
                onChange={(e) => setNewBookmarkLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddBookmark();
                }}
              />
              <Select value={newBookmarkColor} onValueChange={setNewBookmarkColor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cor" />
                </SelectTrigger>
                <SelectContent>
                  {BOOKMARK_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color.class}`} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  onClick={handleAddBookmark}
                  className="flex-1"
                  disabled={!newBookmarkLabel.trim()}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Nenhum marcador adicionado
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => onJumpTo(bookmark.position)}
            >
              <div className={`w-3 h-3 rounded-full ${getColorClass(bookmark.color)} shrink-0`} />
              
              {editingId === bookmark.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="h-7"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(bookmark.id);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveEdit(bookmark.id);
                    }}
                    className="h-7 w-7 p-0"
                  >
                    <Save className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelEdit();
                    }}
                    className="h-7 w-7 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm truncate">{bookmark.label}</span>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(bookmark);
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(bookmark.id);
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
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
