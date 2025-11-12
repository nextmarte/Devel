'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setSaveStatus('saving');
    setErrorMessage('');

    try {
      // TODO: Implementar API para atualizar perfil
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setErrorMessage('Erro ao salvar perfil');
      setSaveStatus('error');
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage('As senhas não correspondem');
      return;
    }

    if (formData.newPassword.length < 8) {
      setErrorMessage('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    setSaveStatus('saving');
    setErrorMessage('');

    try {
      // TODO: Implementar API para alterar senha
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaveStatus('success');
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setErrorMessage('Erro ao alterar senha');
      setSaveStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white">
              ← Voltar
            </Link>
            <h1 className="text-2xl font-bold text-white">Configurações</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
              <nav className="space-y-1 p-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  👤 Perfil
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === 'password'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🔐 Senha
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === 'preferences'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ⚙️ Preferências
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === 'privacy'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🛡️ Privacidade
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-slate-800 rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Informações do Perfil</h2>

                <div className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-2xl text-white font-bold">
                        {session?.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{session?.user?.name}</h3>
                      <p className="text-slate-400 text-sm">{session?.user?.email}</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Nome</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-2 bg-slate-700 text-slate-400 rounded-lg border border-slate-600 opacity-50 cursor-not-allowed"
                      />
                      <p className="text-slate-400 text-xs mt-2">
                        O email não pode ser alterado. Entre em contato com o suporte se precisar mudar.
                      </p>
                    </div>

                    {/* Status Messages */}
                    {errorMessage && (
                      <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-lg">
                        <p className="text-red-400 text-sm">{errorMessage}</p>
                      </div>
                    )}

                    {saveStatus === 'success' && (
                      <div className="p-4 bg-green-600/10 border border-green-600/30 rounded-lg">
                        <p className="text-green-400 text-sm">✅ Alterações salvas com sucesso!</p>
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveProfile}
                    disabled={saveStatus === 'saving'}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    {saveStatus === 'saving' ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="bg-slate-800 rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Alterar Senha</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <p className="text-slate-400 text-xs mt-2">
                      Mínimo de 8 caracteres, incluindo letras e números
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Confirmar Senha
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Status Messages */}
                  {errorMessage && (
                    <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-lg">
                      <p className="text-red-400 text-sm">{errorMessage}</p>
                    </div>
                  )}

                  {saveStatus === 'success' && (
                    <div className="p-4 bg-green-600/10 border border-green-600/30 rounded-lg">
                      <p className="text-green-400 text-sm">✅ Senha alterada com sucesso!</p>
                    </div>
                  )}

                  <button
                    onClick={handleChangePassword}
                    disabled={saveStatus === 'saving'}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    {saveStatus === 'saving' ? 'Alterando...' : 'Alterar Senha'}
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="bg-slate-800 rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Preferências</h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Notificações por Email</p>
                      <p className="text-slate-400 text-sm">Receba atualizações sobre transcrições</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-6 h-6" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Notificações de Conclusão</p>
                      <p className="text-slate-400 text-sm">
                        Avise quando transcrições forem concluídas
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-6 h-6" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Tema Escuro</p>
                      <p className="text-slate-400 text-sm">Use o tema escuro por padrão</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-6 h-6" />
                  </div>

                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                    Salvar Preferências
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="bg-slate-800 rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Privacidade e Segurança</h2>

                <div className="space-y-6">
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <h3 className="text-white font-semibold mb-2">Sessões Ativas</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Você está logado em um dispositivo
                    </p>
                    <button className="text-red-400 hover:text-red-300 text-sm font-medium">
                      Encerrar todas as outras sessões
                    </button>
                  </div>

                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <h3 className="text-white font-semibold mb-2">Autenticação em Dois Fatores</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Aumente a segurança da sua conta
                    </p>
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                      Configurar 2FA
                    </button>
                  </div>

                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <h3 className="text-white font-semibold mb-2">Excluir Conta</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Isso irá deletar permanentemente sua conta e todos os seus dados
                    </p>
                    <button className="text-red-400 hover:text-red-300 text-sm font-medium">
                      Excluir Conta Permanentemente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
