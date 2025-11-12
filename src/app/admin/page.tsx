import { requireServerAuth } from '@/lib/server-auth';
import Link from 'next/link';
import { getSystemStats } from '@/app/admin-actions';

export default async function AdminPage() {
  const session = await requireServerAuth();
  const stats = await getSystemStats();

  // Verify admin role
  if (session.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 rounded-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">❌ Acesso Negado</h1>
          <p className="text-slate-400 mb-6">
            Você não tem permissão para acessar o painel de administração.
          </p>
          <Link href="/dashboard">
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              Voltar ao Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-slate-400 hover:text-white">
                ← Voltar
              </Link>
              <h1 className="text-2xl font-bold text-white">🔑 Painel de Administração</h1>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
              Admin
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-600 to-blue-900 rounded-lg shadow-lg p-6">
            <div className="text-blue-200 text-sm font-semibold mb-2">Total de Usuários</div>
            <div className="text-3xl font-bold text-white">{stats.users.total}</div>
            <div className="text-xs text-blue-200 mt-2">Ativos e registrados</div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-900 rounded-lg shadow-lg p-6">
            <div className="text-green-200 text-sm font-semibold mb-2">MRR (Receita Mensal)</div>
            <div className="text-3xl font-bold text-white">${stats.revenue.mrr.toFixed(2)}</div>
            <div className="text-xs text-green-200 mt-2">{stats.revenue.activeSubscriptions} assinaturas ativas</div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-900 rounded-lg shadow-lg p-6">
            <div className="text-purple-200 text-sm font-semibold mb-2">Transcrições Processadas</div>
            <div className="text-3xl font-bold text-white">{stats.transcriptions.total}</div>
            <div className="text-xs text-purple-200 mt-2">Taxa de sucesso: {stats.transcriptions.successRate}%</div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-900 rounded-lg shadow-lg p-6">
            <div className="text-orange-200 text-sm font-semibold mb-2">Usuários Ativos</div>
            <div className="text-3xl font-bold text-white">{stats.users.active24h}</div>
            <div className="text-xs text-orange-200 mt-2">Últimas 24 horas</div>
          </div>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Users Management */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">👥 Gerenciar Usuários</h2>

            <p className="text-slate-400 text-sm mb-6">
              Visualize, gerencie e controle todos os usuários da plataforma.
            </p>

            <Link href="/admin/users">
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                Ir para Gerenciamento de Usuários
              </button>
            </Link>
          </div>

          {/* Transcriptions Management */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">� Gerenciar Transcrições</h2>

            <p className="text-slate-400 text-sm mb-6">
              Visualize, analise e gerencie todas as transcrições da plataforma.
            </p>

            <Link href="/admin/transcriptions">
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                Ir para Gerenciamento de Transcrições
              </button>
            </Link>
          </div>
        </div>

        {/* System Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Database Status */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">💾 Database</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Status</span>
                <span className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Conectado
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Tamanho</span>
                <span className="text-white text-sm font-medium">245 MB</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Conexões</span>
                <span className="text-white text-sm font-medium">12 ativas</span>
              </div>
            </div>
          </div>

          {/* Cache Status */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">⚡ Cache (Redis)</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Status</span>
                <span className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Ativo
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Memória</span>
                <span className="text-white text-sm font-medium">142 MB / 512 MB</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Hit Rate</span>
                <span className="text-white text-sm font-medium">94.2%</span>
              </div>
            </div>
          </div>

          {/* API Status */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">🌐 API</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Status</span>
                <span className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Funcionando
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Uptime</span>
                <span className="text-white text-sm font-medium">99.98%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Latência</span>
                <span className="text-white text-sm font-medium">45ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-gradient-to-r from-amber-600/10 to-orange-600/10 border border-amber-500/20 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">⚙️ Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/admin/analytics">
              <button className="w-full px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-lg font-medium transition-colors">
                📊 Analytics
              </button>
            </Link>
            <Link href="/admin/audit-logs">
              <button className="w-full px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-lg font-medium transition-colors">
                🔍 Audit Logs
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="w-full px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-lg font-medium transition-colors">
                ← Voltar Dashboard
              </button>
            </Link>
            <button className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-lg font-medium transition-colors disabled opacity-50" disabled>
              ⚙️ Configurações (Em Breve)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
