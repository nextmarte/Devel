import { requireServerAuth } from "@/lib/server-auth";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await requireServerAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">DareDevil.AI</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white font-medium">{session.user?.name}</p>
              <p className="text-slate-400 text-sm">{session.user?.subscriptionPlan}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Card */}
        <div className="bg-slate-800 rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Bem-vindo, {session.user?.name}! 👋
          </h2>
          <p className="text-slate-400 mb-6">
            Você está logado com a conta <code className="text-slate-300">{session.user?.email}</code>
          </p>

          {/* Session Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Função</p>
              <p className="text-white font-semibold capitalize">{session.user?.role || "user"}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Plano</p>
              <p className="text-white font-semibold">{session.user?.subscriptionPlan}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Status da Assinatura</p>
              <p className="text-white font-semibold capitalize">
                {session.user?.subscriptionStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Transcriptions */}
          <Link href="/dashboard/transcriptions">
            <div className="bg-slate-800 hover:bg-slate-700 rounded-lg shadow-lg p-6 cursor-pointer transition-colors group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors mb-4">
                <svg
                  className="w-6 h-6 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Minhas Transcrições</h3>
              <p className="text-slate-400 text-sm">Ver histórico de transcrições</p>
            </div>
          </Link>

          {/* Upload */}
          <Link href="/dashboard/upload">
            <div className="bg-slate-800 hover:bg-slate-700 rounded-lg shadow-lg p-6 cursor-pointer transition-colors group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors mb-4">
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Upload de Áudio</h3>
              <p className="text-slate-400 text-sm">Enviar novo áudio</p>
            </div>
          </Link>

          {/* Settings */}
          <Link href="/settings">
            <div className="bg-slate-800 hover:bg-slate-700 rounded-lg shadow-lg p-6 cursor-pointer transition-colors group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors mb-4">
                <svg
                  className="w-6 h-6 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Configurações</h3>
              <p className="text-slate-400 text-sm">Gerenciar sua conta</p>
            </div>
          </Link>

          {/* Billing */}
          <Link href="/billing">
            <div className="bg-slate-800 hover:bg-slate-700 rounded-lg shadow-lg p-6 cursor-pointer transition-colors group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors mb-4">
                <svg
                  className="w-6 h-6 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Faturamento</h3>
              <p className="text-slate-400 text-sm">Planos e pagamentos</p>
            </div>
          </Link>

          {/* Statistics */}
          <Link href="/dashboard/stats">
            <div className="bg-slate-800 hover:bg-slate-700 rounded-lg shadow-lg p-6 cursor-pointer transition-colors group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors mb-4">
                <svg
                  className="w-6 h-6 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Estatísticas</h3>
              <p className="text-slate-400 text-sm">Ver uso e custos</p>
            </div>
          </Link>
        </div>

        {/* Admin Link */}
        {session.user?.role === "admin" && (
          <div className="mt-8">
            <Link href="/admin">
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-lg shadow-lg p-6 cursor-pointer transition-colors group">
                <h3 className="text-white font-semibold mb-1">🔑 Painel de Administração</h3>
                <p className="text-amber-100 text-sm">Gerenciar usuários, planos e configurações</p>
              </div>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
