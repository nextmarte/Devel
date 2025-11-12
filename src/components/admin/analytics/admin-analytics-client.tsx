'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSystemStats, getUsersGrowth, getTranscriptionsStats } from '@/app/admin-actions';
import { TrendingUp, Users, Zap, BarChart3, DollarSign, AlertCircle } from 'lucide-react';

export default function AdminAnalyticsContent() {
  const [stats, setStats] = useState<any>(null);
  const [usersGrowth, setUsersGrowth] = useState<any[]>([]);
  const [transcriptionsStats, setTranscriptionsStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [systemStats, usersData, transcriptionsData] = await Promise.all([
        getSystemStats(),
        getUsersGrowth(30),
        getTranscriptionsStats(30)
      ]);

      setStats(systemStats);
      setUsersGrowth(usersData);
      setTranscriptionsStats(transcriptionsData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-slate-400 mt-4">Carregando analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Users */}
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total de Usuários</p>
                  <p className="text-2xl font-bold text-white mt-2">{stats.totalUsers.toLocaleString('pt-BR')}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-white mt-2">{stats.activeUsers.toLocaleString('pt-BR')}</p>
                </div>
                <Zap className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          {/* Total Transcriptions */}
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Transcrições</p>
                  <p className="text-2xl font-bold text-white mt-2">{stats.totalTranscriptions.toLocaleString('pt-BR')}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          {/* MRR */}
          <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">MRR</p>
                  <p className="text-2xl font-bold text-white mt-2">R$ {stats.mrr?.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          {/* Active Subscriptions */}
          <Card className="bg-gradient-to-br from-pink-900/20 to-pink-800/10 border-pink-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Assinaturas Ativas</p>
                  <p className="text-2xl font-bold text-white mt-2">{stats.activeSubscriptions.toLocaleString('pt-BR')}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Growth */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Crescimento de Usuários (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {usersGrowth.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Sem dados de crescimento</p>
            ) : (
              <div className="space-y-2">
                {usersGrowth.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{item.date}</span>
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-500/20 rounded w-24 h-6">
                        <div
                          className="bg-blue-500 h-full rounded"
                          style={{
                            width: `${Math.min((item.count / Math.max(...usersGrowth.map(u => u.count))) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-white text-sm font-medium">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transcriptions Status */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Status de Transcrições (últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {transcriptionsStats.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Sem dados de transcrições</p>
            ) : (
              <div className="space-y-3">
                {transcriptionsStats.slice(-7).map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">{item.date}</span>
                      <span className="text-slate-300 font-medium">
                        {(item.SUCCESS || 0) + (item.PENDING || 0) + (item.STARTED || 0)} total
                      </span>
                    </div>
                    <div className="flex gap-1 h-4 bg-slate-700 rounded overflow-hidden">
                      {(item.SUCCESS || 0) > 0 && (
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${((item.SUCCESS || 0) / ((item.SUCCESS || 0) + (item.PENDING || 0) + (item.STARTED || 0) + (item.CANCELLED || 0))) * 100}%`
                          }}
                          title={`Sucesso: ${item.SUCCESS || 0}`}
                        />
                      )}
                      {(item.PENDING || 0) > 0 && (
                        <div
                          className="bg-yellow-500"
                          style={{
                            width: `${((item.PENDING || 0) / ((item.SUCCESS || 0) + (item.PENDING || 0) + (item.STARTED || 0) + (item.CANCELLED || 0))) * 100}%`
                          }}
                          title={`Pendente: ${item.PENDING || 0}`}
                        />
                      )}
                      {(item.STARTED || 0) > 0 && (
                        <div
                          className="bg-blue-500"
                          style={{
                            width: `${((item.STARTED || 0) / ((item.SUCCESS || 0) + (item.PENDING || 0) + (item.STARTED || 0) + (item.CANCELLED || 0))) * 100}%`
                          }}
                          title={`Iniciado: ${item.STARTED || 0}`}
                        />
                      )}
                      {(item.CANCELLED || 0) > 0 && (
                        <div
                          className="bg-red-500"
                          style={{
                            width: `${((item.CANCELLED || 0) / ((item.SUCCESS || 0) + (item.PENDING || 0) + (item.STARTED || 0) + (item.CANCELLED || 0))) * 100}%`
                          }}
                          title={`Cancelado: ${item.CANCELLED || 0}`}
                        />
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400 mt-1">
                      {(item.SUCCESS || 0) > 0 && <span>✅ {item.SUCCESS}</span>}
                      {(item.PENDING || 0) > 0 && <span>⏳ {item.PENDING}</span>}
                      {(item.STARTED || 0) > 0 && <span>▶️ {item.STARTED}</span>}
                      {(item.CANCELLED || 0) > 0 && <span>❌ {item.CANCELLED}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">ℹ️ Dashboard Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <p>
            Este dashboard mostra <strong>métricas em tempo real</strong> de todo o sistema:
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong>Total de Usuários:</strong> Quantidade total de usuários cadastrados</li>
            <li><strong>Usuários Ativos:</strong> Usuários com assinatura ativa</li>
            <li><strong>Transcrições:</strong> Total de transcrições processadas</li>
            <li><strong>MRR:</strong> Receita menária recorrente</li>
            <li><strong>Assinaturas Ativas:</strong> Assinaturas em vigor</li>
            <li><strong>Crescimento:</strong> Novos usuários nos últimos 30 dias</li>
            <li><strong>Status:</strong> Distribuição de transcrições por status</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
