import { requireServerAuth } from '@/lib/server-auth';
import { getUserUsageStats } from '@/app/actions-protected';
import Link from 'next/link';

export default async function BillingPage() {
  const session = await requireServerAuth();
  const statsResult = await getUserUsageStats();

  const stats = statsResult.data || {
    totalTranscriptions: 0,
    totalCost: 0,
    totalFileSize: 0,
    totalDuration: 0,
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/ mês',
      description: 'Para começar',
      features: ['1h de transcrições', '100MB de armazenamento', 'Suporte por email'],
      current: session.user.subscriptionPlan === 'Free',
      color: 'slate',
    },
    {
      name: 'Starter',
      price: '$9',
      period: '/ mês',
      description: 'Para pequenos projetos',
      features: ['10h de transcrições', '1GB de armazenamento', 'Suporte prioritário', 'API access'],
      current: session.user.subscriptionPlan === 'Starter',
      color: 'blue',
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/ mês',
      description: 'Para profissionais',
      features: [
        '50h de transcrições',
        '10GB de armazenamento',
        'Suporte 24/7',
        'API avançada',
        'Análise detalhada',
      ],
      current: session.user.subscriptionPlan === 'Pro',
      color: 'purple',
    },
    {
      name: 'Enterprise',
      price: 'Personalizado',
      period: '',
      description: 'Para grandes volumes',
      features: [
        'Transcrições ilimitadas',
        'Armazenamento ilimitado',
        'Suporte dedicado',
        'SLA 99.9%',
        'Recursos customizados',
      ],
      current: session.user.subscriptionPlan === 'Enterprise',
      color: 'amber',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      slate: 'from-slate-600 to-slate-800 border-slate-600',
      blue: 'from-blue-600 to-blue-800 border-blue-600',
      purple: 'from-purple-600 to-purple-800 border-purple-600',
      amber: 'from-amber-600 to-amber-800 border-amber-600',
    };
    return colors[color] || colors.slate;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white">
              ← Voltar
            </Link>
            <h1 className="text-2xl font-bold text-white">Faturamento</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Current Plan */}
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-2">Seu Plano Atual</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 mb-2">Plano: <span className="font-bold text-white">{session.user.subscriptionPlan}</span></p>
              <p className="text-slate-400 text-sm">
                Status: <span className="font-semibold text-green-400">Ativo</span>
              </p>
            </div>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              Gerenciar Assinatura
            </button>
          </div>
        </div>

        {/* Usage Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-800 rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-2">Transcrições este mês</p>
            <p className="text-3xl font-bold text-white">{stats.totalTranscriptions}</p>
            <p className="text-slate-500 text-xs mt-2">Atualizando em tempo real</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-2">Custo este mês</p>
            <p className="text-3xl font-bold text-white">${stats.totalCost.toFixed(2)}</p>
            <p className="text-slate-500 text-xs mt-2">Baseado em uso</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-2">Próxima renovação</p>
            <p className="text-3xl font-bold text-white">
              {new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString('pt-BR')}
            </p>
            <p className="text-slate-500 text-xs mt-2">Renovação automática</p>
          </div>
        </div>

        {/* Plans */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-8">Nossos Planos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 ${
                  plan.current ? 'ring-2 ring-green-500' : ''
                }`}
              >
                {/* Card Background */}
                <div className={`bg-gradient-to-br ${getColorClasses(plan.color)} p-6 text-white`}>
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm opacity-90 mb-4">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm opacity-75">{plan.period}</span>
                  </div>

                  {plan.current ? (
                    <div className="w-full py-2 px-4 bg-white text-slate-900 font-semibold rounded-lg text-center">
                      ✓ Plano Atual
                    </div>
                  ) : (
                    <button className="w-full py-2 px-4 bg-white text-slate-900 font-semibold rounded-lg hover:bg-opacity-90 transition-all">
                      Fazer Upgrade
                    </button>
                  )}
                </div>

                {/* Features */}
                <div className="bg-slate-800 p-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-slate-300">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Histórico de Faturamento</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold">Data</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold">Descrição</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold">Valor</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                  <td className="py-3 px-4 text-slate-300">
                    {new Date().toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    Transcrições - {stats.totalTranscriptions} arquivos
                  </td>
                  <td className="py-3 px-4 text-white font-semibold">${stats.totalCost.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                      Pago
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                  <td className="py-3 px-4 text-slate-300">
                    {new Date(new Date().setDate(new Date().getDate() - 30)).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 text-slate-300">Transcrições - 0 arquivos</td>
                  <td className="py-3 px-4 text-white font-semibold">$0.00</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                      Período Livre
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-12 bg-slate-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Métodos de Pagamento</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">VISA</span>
                </div>
                <div>
                  <p className="text-white font-medium">Cartão de Crédito</p>
                  <p className="text-slate-400 text-sm">•••• •••• •••• 4242</p>
                </div>
              </div>
              <button className="text-red-400 hover:text-red-300 font-medium text-sm">Remover</button>
            </div>

            <button className="w-full py-3 border-2 border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 rounded-lg transition-colors font-medium">
              + Adicionar Método de Pagamento
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
