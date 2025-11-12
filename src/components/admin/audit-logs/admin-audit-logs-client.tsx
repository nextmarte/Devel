'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuditLogs } from '@/app/admin-actions';
import { Search, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

const ITEMS_PER_PAGE = 50;

export default function AdminAuditLogsContent() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // Buscar logs
  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getAuditLogs(ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE, {
        action: actionFilter || undefined,
      });

      setLogs(result.logs as any);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar quando filtros mudam
  useEffect(() => {
    setCurrentPage(0);
  }, [search, actionFilter]);

  // Recarregar logs
  useEffect(() => {
    loadLogs();
  }, [currentPage, search, actionFilter]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const hasMore = currentPage < totalPages - 1;
  const hasPrev = currentPage > 0;

  // Função para cor do ícone de ação
  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      'create': '✅',
      'update': '✏️',
      'delete': '🗑️',
      'block': '🚫',
      'unblock': '✅',
      'login': '🔓',
      'logout': '🔒',
      'download': '⬇️',
      'export': '📤',
      'reprocess': '🔄',
      'user_created': '👤',
      'user_updated': '✏️',
      'user_deleted': '🗑️',
      'user_blocked': '🚫',
      'user_unblocked': '✅',
      'transcription_created': '📝',
      'transcription_deleted': '🗑️',
      'transcription_reprocessed': '🔄',
    };
    return icons[action] || '•';
  };

  // Função para cor da ação
  const getActionBadgeColor = (action: string) => {
    if (action.includes('delete')) return 'bg-red-500/20 text-red-300 border-red-500/50';
    if (action.includes('create')) return 'bg-green-500/20 text-green-300 border-green-500/50';
    if (action.includes('update')) return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
    if (action.includes('block')) return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
    return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
  };

  // Filtrar logs por search
  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(searchLower) ||
      log.resource_type?.toLowerCase().includes(searchLower) ||
      log.user?.email?.toLowerCase().includes(searchLower) ||
      log.resource_id?.toLowerCase().includes(searchLower)
    );
  });

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
              placeholder="Buscar por ação, tipo, usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Action Filter */}
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">Todas as Ações</option>
          <option value="create_user">Criar Usuário</option>
          <option value="update_user">Atualizar Usuário</option>
          <option value="delete_user">Deletar Usuário</option>
          <option value="block_user">Bloquear Usuário</option>
          <option value="unblock_user">Desbloquear Usuário</option>
          <option value="delete_transcription">Deletar Transcrição</option>
          <option value="reprocess_transcription">Reprocessar Transcrição</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Logs Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Logs de Auditoria {total > 0 && `(${total.toLocaleString('pt-BR')})`}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-slate-400 mt-4">Carregando logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredLogs.map((log, idx) => (
                <div key={idx} className="bg-slate-700/30 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{getActionIcon(log.action)}</span>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                        {log.resource_type && (
                          <span className="text-slate-400 text-xs bg-slate-600/50 px-2 py-1 rounded">
                            {log.resource_type}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-slate-400 text-xs">Usuário</p>
                          <p className="text-white">{log.user?.name || log.user?.email || 'N/A'}</p>
                        </div>
                        {log.resource_id && (
                          <div>
                            <p className="text-slate-400 text-xs">Recurso ID</p>
                            <p className="text-slate-300 font-mono text-xs truncate">{log.resource_id}</p>
                          </div>
                        )}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs">Detalhes</p>
                            <p className="text-slate-300 text-xs truncate">
                              {Object.entries(log.metadata)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(', ')}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-slate-400 text-xs">Hora</p>
                          <p className="text-slate-300 text-xs">
                            {formatDistanceToNow(new Date(log.timestamp), { locale: ptBR, addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {filteredLogs.length > 0 && totalPages > 1 && (
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
          <CardTitle className="text-white">ℹ️ Sobre Logs de Auditoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <p>
            Todos os eventos do sistema são registrados aqui para fins de auditoria e conformidade:
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong>Ações de usuário:</strong> Criação, atualização, bloqueio/desbloqueio</li>
            <li><strong>Operações:</strong> Cada ação importante é logada com timestamp</li>
            <li><strong>Rastreabilidade:</strong> Saiba quem fez o quê e quando</li>
            <li><strong>Segurança:</strong> Ajuda a detectar atividades suspeitas</li>
            <li><strong>Conformidade:</strong> Requisito para regulamentações como LGPD/GDPR</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
