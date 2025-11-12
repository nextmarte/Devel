'use client';

import { useState } from 'react';
import { Copy, Save, Edit2, Check, X, Download } from 'lucide-react';

interface EditableTranscriptionViewProps {
  jobId: string;
  fileName: string;
  result: {
    text?: string;
    correctedText?: string;
    identifiedText?: string;
    summary?: string | null;
  };
  onReset: () => void;
}

export default function EditableTranscriptionView({
  jobId,
  fileName,
  result,
  onReset,
}: EditableTranscriptionViewProps) {
  const [activeTab, setActiveTab] = useState<'original' | 'corrected' | 'identified' | 'summary'>('corrected');
  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState(result.correctedText || result.text || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const tabs = [
    { id: 'original' as const, label: 'Original', text: result.text, hasData: !!result.text },
    { id: 'corrected' as const, label: 'Corrigida', text: result.correctedText, hasData: !!result.correctedText },
    { id: 'identified' as const, label: 'Com Speakers', text: result.identifiedText, hasData: !!result.identifiedText },
    { id: 'summary' as const, label: 'Resumo', text: result.summary, hasData: !!result.summary },
  ];

  const currentTab = tabs.find(t => t.id === activeTab);
  const currentText = editMode ? editedText : (currentTab?.text || '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentText);
      setMessage('✅ Copiado!');
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage('❌ Erro ao copiar');
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleExportDocx = async () => {
    try {
      setMessage('📥 Gerando DOCX...');
      const response = await fetch(`/api/transcriptions/export-docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          fileName,
          raw_text: result.text,
          corrected_text: result.correctedText,
          identified_text: result.identifiedText,
          summary: result.summary,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar DOCX');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName.split('.')[0]}_transcrição.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setMessage('✅ DOCX baixado!');
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage('❌ Erro ao exportar DOCX');
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/transcriptions/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          [activeTab === 'corrected' ? 'corrected_text' : activeTab === 'identified' ? 'identified_text' : 'raw_text']: editedText,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar');
      }

      setMessage('✅ Salvo com sucesso!');
      setEditMode(false);
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage('❌ Erro ao salvar transcrição');
      setTimeout(() => setMessage(null), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-lg p-6 border border-slate-700 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">✓ Transcrição Concluída</h3>
          <p className="text-sm text-slate-400 mt-1">Arquivo: {fileName}</p>
        </div>
        {message && (
          <div className="px-4 py-2 rounded bg-slate-700 text-sm text-slate-300">
            {message}
          </div>
        )}
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b border-slate-700 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              if (editMode) setEditMode(false);
              setActiveTab(tab.id);
            }}
            disabled={!tab.hasData}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : !tab.hasData
                ? 'border-transparent text-slate-500 cursor-not-allowed'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {currentTab && currentTab.hasData && (
        <div className="space-y-4">
          {/* Área de texto */}
          <div className="bg-slate-700 rounded-lg border border-slate-600 overflow-hidden">
            {editMode ? (
              <textarea
                value={editedText}
                onChange={e => setEditedText(e.target.value)}
                className="w-full h-64 p-4 bg-slate-700 text-slate-100 border-0 outline-none resize-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="p-4 h-64 overflow-y-auto text-slate-200 whitespace-pre-wrap break-words text-sm leading-relaxed">
                {currentText}
              </div>
            )}
          </div>

          {/* Estatísticas */}
          <div className="flex gap-4 text-xs text-slate-400">
            <span>📝 Palavras: {currentText.split(/\s+/).filter(w => w.length > 0).length}</span>
            <span>📊 Caracteres: {currentText.length}</span>
            {editMode && editedText !== currentTab.text && (
              <span className="text-orange-400">⚡ Editado</span>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-3">
            {editMode ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setEditedText(currentTab.text || '');
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-600 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditMode(true);
                    setEditedText(currentText);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-600 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>
                <button
                  onClick={handleExportDocx}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                  DOCX
                </button>
              </>
            )}
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-600 hover:bg-slate-700 text-slate-300 transition-colors ml-auto"
            >
              🔄 Nova
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
