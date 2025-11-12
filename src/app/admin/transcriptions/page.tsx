import { requireServerAuth } from '@/lib/server-auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AdminTranscriptionsContent from '@/components/admin/transcriptions/admin-transcriptions-client'

export default async function AdminTranscriptionsPage() {
  const session = await requireServerAuth()

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
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-white">📝 Transcrições (Admin)</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AdminTranscriptionsContent />
      </main>
    </div>
  )
}

// Client component imported separately to avoid issues
import AdminTranscriptionsClient from '@/components/admin/transcriptions/admin-transcriptions-client'

function AdminTranscriptionsClientWrapper() {
  return <AdminTranscriptionsClient />
}
