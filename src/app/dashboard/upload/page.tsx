import { requireServerAuth } from '@/lib/server-auth';
import { UploadAudioForm } from '@/components/upload-audio-form';
import Link from 'next/link';

export default async function UploadPage() {
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
            <h1 className="text-2xl font-bold text-white">Upload de Áudio</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Upload Form */}
          <UploadAudioForm />

          {/* Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">🎵 Formatos de Áudio Suportados</h3>
              <div className="space-y-3 text-slate-300 text-sm">
                <div>
                  <p className="font-semibold text-blue-400 mb-2">WhatsApp:</p>
                  <p className="ml-2">.opus, .ogg</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-400 mb-2">Instagram/Redes Sociais:</p>
                  <p className="ml-2">.mp4, .m4a, .aac</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-400 mb-2">Padrão:</p>
                  <p className="ml-2">.mp3, .wav, .flac, .webm</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">🎬 Formatos de Vídeo Suportados</h3>
              <div className="space-y-2 text-slate-300 text-sm">
                <p className="mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  .mp4, .avi, .mov, .mkv
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  .flv, .wmv, .webm, .ogv
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  .ts, .mts, .m2ts, .3gp, .f4v, .asf
                </p>
                <p className="text-xs text-slate-400 mt-3">
                  ℹ️ O áudio será automaticamente extraído em qualidade otimizada
                </p>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">🌍 Linguagens Suportadas</h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-yellow-400">⭐</span>
                  <span><strong>pt:</strong> Português Brasileiro (padrão)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span><strong>en:</strong> Inglês</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span><strong>es:</strong> Espanhol</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span><strong>fr:</strong> Francês</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span><strong>de:</strong> Alemão, <strong>it:</strong> Italiano</span>
                </li>
                <li className="text-xs text-slate-400 mt-2">
                  + Outros idiomas suportados pelo Whisper
                </li>
              </ul>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">✨ Otimizações para Português</h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Remove hesitações comuns (tipo, sabe, entendeu, né, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Capitalização correta de frases
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Pontuação normalizada
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Abreviações expandidas
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Identificação de locutores
                </li>
              </ul>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Como Funciona</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Selecione o Arquivo</h4>
                  <p className="text-slate-400 text-sm">Escolha um arquivo de áudio ou vídeo do seu computador</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Envie o Arquivo</h4>
                  <p className="text-slate-400 text-sm">Clique em "Processar Áudio" para enviar e processar</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Processamento</h4>
                  <p className="text-slate-400 text-sm">Nosso sistema transcreve, corrige e identifica falantes automaticamente</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                    4
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Resultado</h4>
                  <p className="text-slate-400 text-sm">Acesse sua transcrição em "Minhas Transcrições" e exporte quando quiser</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Perguntas Frequentes</h3>
            <div className="space-y-4">
              <details className="group">
                <summary className="cursor-pointer text-white font-semibold hover:text-blue-400 transition-colors">
                  Quanto tempo leva para processar um arquivo?
                </summary>
                <p className="mt-2 text-slate-400 text-sm">
                  Geralmente o tempo de processamento é de 1-5 minutos, dependendo do tamanho e qualidade do áudio.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer text-white font-semibold hover:text-blue-400 transition-colors">
                  Meus dados são privados?
                </summary>
                <p className="mt-2 text-slate-400 text-sm">
                  Sim! Todos os seus arquivos e transcrições são privados e criptografados. Apenas você pode acessá-los.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer text-white font-semibold hover:text-blue-400 transition-colors">
                  Posso fazer upload de vídeos?
                </summary>
                <p className="mt-2 text-slate-400 text-sm">
                  Sim! Você pode fazer upload de arquivos MP4 e outros formatos de vídeo. Nós extrairemos o áudio automaticamente.
                </p>
              </details>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
