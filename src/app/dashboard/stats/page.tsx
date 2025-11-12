import { requireServerAuth } from '@/lib/server-auth';
import { getUserUsageStats } from '@/app/actions-protected';
import Link from 'next/link';

export default async function StatsPage() {
  const session = await requireServerAuth();
  const statsResult = await getUserUsageStats();

  const stats = statsResult.data || {
    totalTranscriptions: 0,
    totalCost: 0,
    totalFileSize: 0,
    totalDuration: 0,
  };

  const fileSizeGB = (stats.totalFileSize / (1024 * 1024 * 1024)).toFixed(2);
  const durationHours = (stats.totalDuration / 3600).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white">
              ← Voltar
            </Link>
            <h1 className="text-2xl font-bold text-white">Estatísticas de Uso</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Transcriptions */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-900 rounded-lg shadow-lg p-6">
            <div className="text-blue-200 text-sm font-semibold mb-2">Transcrições Processadas</div>
            <div className="text-3xl font-bold text-white">{stats.totalTranscriptions}</div>
            <div className="text-xs text-blue-200 mt-2">Últimos 30 dias</div>
          </div>

          {/* Total Cost */}
          <div className="bg-gradient-to-br from-green-600 to-green-900 rounded-lg shadow-lg p-6">
            <div className="text-green-200 text-sm font-semibold mb-2">Custo Total</div>
            <div className="text-3xl font-bold text-white">${stats.totalCost.toFixed(2)}</div>
            <div className="text-xs text-green-200 mt-2">Créditos utilizados</div>
          </div>

          {/* Total File Size */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-900 rounded-lg shadow-lg p-6">
            <div className="text-purple-200 text-sm font-semibold mb-2">Tamanho Processado</div>
            <div className="text-3xl font-bold text-white">{fileSizeGB} GB</div>
            <div className="text-xs text-purple-200 mt-2">Total de dados</div>
          </div>

          {/* Total Duration */}
          <div className="bg-gradient-to-br from-orange-600 to-orange-900 rounded-lg shadow-lg p-6">
            <div className="text-orange-200 text-sm font-semibold mb-2">Tempo de Áudio</div>
            <div className="text-3xl font-bold text-white">{durationHours}h</div>
            <div className="text-xs text-orange-200 mt-2">Duração total</div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Resumo Detalhado</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">Transcrições processadas com sucesso</span>
              <span className="text-white font-semibold">{stats.totalTranscriptions}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">Custo médio por transcrição</span>
              <span className="text-white font-semibold">
                ${stats.totalTranscriptions > 0 ? (stats.totalCost / stats.totalTranscriptions).toFixed(2) : '0.00'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">Tamanho médio de arquivo</span>
              <span className="text-white font-semibold">
                {stats.totalTranscriptions > 0
                  ? (stats.totalFileSize / stats.totalTranscriptions / (1024 * 1024)).toFixed(1)
                  : '0'}{' '}
                MB
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">Duração média de áudio</span>
              <span className="text-white font-semibold">
                {stats.totalTranscriptions > 0
                  ? Math.round((stats.totalDuration / stats.totalTranscriptions) / 60)
                  : '0'}{' '}
                minutos
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">Seu plano atual</span>
              <span className="text-white font-semibold">{session.user.subscriptionPlan}</span>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">💡 Dicas para Economizar</h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex gap-2">
              <span className="text-blue-400">•</span>
              <span>Comprima seus arquivos antes de enviar para reduzir custos</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400">•</span>
              <span>Considere fazer upgrade para um plano superior se processa muitos arquivos</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400">•</span>
              <span>Use o recurso de sumário apenas quando necessário</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400">•</span>
              <span>Delete transcrições antigas para liberar espaço</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
