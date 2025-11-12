import { requireServerAuth } from '@/lib/server-auth';
import { TranscriptionsList } from '@/components/transcriptions-list';
import Link from 'next/link';

export default async function TranscriptionsPage() {
  const session = await requireServerAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white">
              ← Voltar
            </Link>
            <h1 className="text-2xl font-bold text-white">Minhas Transcrições</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <TranscriptionsList />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upload Quick */}
            <div className="bg-slate-800 rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Upload Rápido</h2>
              <Link
                href="/dashboard/upload"
                className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors"
              >
                + Novo Upload
              </Link>
            </div>

            {/* Info Card */}
            <div className="bg-slate-800 rounded-lg shadow-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Dicas</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Clique em uma transcrição para ver detalhes</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Todas as ações são registradas em seu histórico</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Você pode deletar transcrições a qualquer momento</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Use os sumários para reuniões mais rápidas</span>
                </li>
              </ul>
            </div>

            {/* Plan Info */}
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/20 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-2">Seu Plano</h3>
              <p className="text-blue-200 mb-4">
                {session.user.subscriptionPlan}
              </p>
              <Link
                href="/billing"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm transition-colors"
              >
                Ver Planos
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
