'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAdminTranscriptions } from '@/app/admin-actions';
import { Trash2, Eye, RotateCcw, Search, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface Transcription {
  id: string;
  job_id: string;
  file_name: string;
  status: string;
  created_at: Date;
  user_id: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  file_size: number;
  processing_time?: number;
  error_message?: string;
}

const ITEMS_PER_PAGE = 25;

export default function AdminTranscriptionsContent() {
  const [transcriptions, setTranscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Buscar transcrições
  const loadTranscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getAdminTranscriptions(ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE, {
        search: search || undefined,
        status: statusFilter || undefined,
      });

      setTranscriptions(result.transcriptions as any);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar transcrições');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar quando filtros mudam
  useEffect(() => {
    setCurrentPage(0);
  }, [search, statusFilter]);

  // Recarregar transcrições
  useEffect(() => {
    loadTranscriptions();
  }, [currentPage, search, statusFilter]);

  // Deletar transcrição
  const handleDelete = async (jobId: string) => {
    if (!window.confirm('Tem certeza que quer deletar esta transcrição?')) return;

    try {
      setDeleting(jobId);
      alert('Deletar transcrição - feature em desenvolvimento');
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  // Reprocessar transcrição
  const handleReprocess = async (jobId: string) => {
    if (!window.confirm('Reprocessar esta transcrição?')) return;

    try {
      alert('Reprocessar transcrição - feature em desenvolvimento');
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const hasMore = currentPage < totalPages - 1;
  const hasPrev = currentPage > 0;

  // Função para formatar tamanho de arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Função para status badge
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'SUCCESS': 'bg-green-500/20 text-green-300 border-green-500/50',
      'PENDING': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      'STARTED': 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      'FAILURE': 'bg-red-500/20 text-red-300 border-red-500/50',
      'RETRY': 'bg-orange-500/20 text-orange-300 border-orange-500/50',
      'CANCELLED': 'bg-slate-500/20 text-slate-300 border-slate-500/50',
    };
    return colors[status] || 'bg-slate-500/20 text-slate-300 border-slate-500/50';
  };

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome de arquivo ou job ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">Todos os Status</option>
          <option value="SUCCESS">Sucesso</option>
          <option value="PENDING">Pendente</option>
          <option value="STARTED">Iniciado</option>
          <option value="FAILURE">Erro</option>
          <option value="RETRY">Retry</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Table Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Todas as Transcrições {total > 0 && `(${total.toLocaleString('pt-BR')})`}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-slate-400 mt-4">Carregando transcrições...</p>
            </div>
          ) : transcriptions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Nenhuma transcrição encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Arquivo</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Usuário</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Tamanho</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Data</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transcriptions.map((t) => (
                    <tr key={t.job_id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono text-sm text-slate-300 truncate max-w-xs" title={t.file_name}>
                          {t.file_name || t.job_id}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-slate-300 text-sm">{t.user?.name || 'N/A'}</p>
                          <p className="text-slate-400 text-xs">{t.user?.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-sm">
                        {formatFileSize(t.file_size)}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-sm">
                        {formatDistanceToNow(new Date(t.created_at), { locale: ptBR, addSuffix: true })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => alert('Ver detalhes - em desenvolvimento')}
                            className="p-1 hover:bg-blue-500/20 rounded text-blue-400 transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {t.status !== 'SUCCESS' && (
                            <button
                              onClick={() => handleReprocess(t.job_id)}
                              className="p-1 hover:bg-orange-500/20 rounded text-orange-400 transition-colors"
                              title="Reprocessar"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(t.job_id)}
                            disabled={deleting === t.job_id}
                            className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors disabled:opacity-50"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {transcriptions.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={!hasPrev}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <span className="text-slate-400 text-sm">
                Página {currentPage + 1} de {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={!hasMore}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">ℹ️ Sobre esta Página</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <p>
            Esta página exibe <strong>TODAS</strong> as transcrições de <strong>TODOS</strong> os usuários do sistema.
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Busque por nome de arquivo ou job ID</li>
            <li>Filtre por status (Sucesso, Erro, Pendente, etc)</li>
            <li>Veja detalhes completos de cada transcrição</li>
            <li>Reprocesse transcrições que falharam</li>
            <li>Delete transcrições quando necessário</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
