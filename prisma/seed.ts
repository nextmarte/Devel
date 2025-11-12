import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // ==================== CRIAR ROLES ====================
  console.log('📋 Criando roles...');

  const freeRole = await prisma.role.create({
    data: {
      name: 'free',
      description: 'Plano gratuito com recursos limitados',
      permissions: [
        'auth.login',
        'auth.register',
        'transcribe.create',
        'transcribe.view',
        'upload.audio',
        'export.txt',
        'history.view',
        'settings.theme',
        'settings.profile',
      ],
    },
  });

  const trialRole = await prisma.role.create({
    data: {
      name: 'trial',
      description: 'Plano trial com acesso expandido',
      permissions: [
        'auth.login',
        'auth.register',
        'transcribe.create',
        'transcribe.view',
        'transcribe.edit',
        'upload.audio',
        'upload.video',
        'export.txt',
        'export.pdf',
        'history.view',
        'history.search',
        'analytics.view',
        'settings.theme',
        'settings.profile',
      ],
    },
  });

  const starterRole = await prisma.role.create({
    data: {
      name: 'starter',
      description: 'Plano starter com mais recursos',
      permissions: [
        'auth.login',
        'auth.register',
        'transcribe.create',
        'transcribe.view',
        'transcribe.edit',
        'transcribe.delete',
        'upload.audio',
        'upload.video',
        'export.txt',
        'export.pdf',
        'export.docx',
        'history.view',
        'history.search',
        'analytics.view',
        'settings.theme',
        'settings.profile',
      ],
    },
  });

  const proRole = await prisma.role.create({
    data: {
      name: 'pro',
      description: 'Plano profissional com acesso completo',
      permissions: [
        'auth.login',
        'auth.register',
        'transcribe.create',
        'transcribe.view',
        'transcribe.edit',
        'transcribe.delete',
        'upload.audio',
        'upload.video',
        'export.txt',
        'export.pdf',
        'export.docx',
        'history.view',
        'history.search',
        'analytics.view',
        'settings.theme',
        'settings.profile',
      ],
    },
  });

  const enterpriseRole = await prisma.role.create({
    data: {
      name: 'enterprise',
      description: 'Plano enterprise com suporte completo',
      permissions: [
        'auth.login',
        'auth.register',
        'transcribe.create',
        'transcribe.view',
        'transcribe.edit',
        'transcribe.delete',
        'upload.audio',
        'upload.video',
        'export.txt',
        'export.pdf',
        'export.docx',
        'history.view',
        'history.search',
        'analytics.view',
        'settings.theme',
        'settings.profile',
      ],
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: 'admin',
      description: 'Administrador do sistema',
      permissions: ['*'], // Todas as permissões
    },
  });

  console.log('✅ Roles criados com sucesso!\n');

  // ==================== CRIAR PLANOS ====================
  console.log('💰 Criando planos de assinatura...');

  const freePlan = await prisma.plan.create({
    data: {
      name: 'Free',
      description: '30 minutos por mês',
      price: 0,
      billing_interval: 'month',
      features: {
        transcribe: true,
        upload_audio: true,
        export_txt: true,
        history_view: true,
      },
      limits: {
        monthlyMinutes: 30,
        maxFileSize: 50,
        maxFileDuration: 10,
        concurrentJobs: 1,
        historyRetention: 7,
      },
    },
  });

  const trialPlan = await prisma.plan.create({
    data: {
      name: 'Trial',
      description: '120 minutos por mês - experimental',
      price: 0,
      billing_interval: 'month',
      features: {
        transcribe: true,
        upload_audio: true,
        upload_video: true,
        export_txt: true,
        export_pdf: true,
        history_view: true,
        history_search: true,
        analytics_view: true,
      },
      limits: {
        monthlyMinutes: 120,
        maxFileSize: 200,
        maxFileDuration: 30,
        concurrentJobs: 2,
        historyRetention: 30,
      },
    },
  });

  const starterPlan = await prisma.plan.create({
    data: {
      name: 'Starter',
      description: '300 minutos por mês',
      price: 990, // $9.99
      billing_interval: 'month',
      features: {
        transcribe: true,
        upload_audio: true,
        upload_video: true,
        export_txt: true,
        export_pdf: true,
        export_docx: true,
        history_view: true,
        history_search: true,
        analytics_view: true,
      },
      limits: {
        monthlyMinutes: 300,
        maxFileSize: 500,
        maxFileDuration: 60,
        concurrentJobs: 3,
        historyRetention: 90,
      },
      stripe_price_id: 'price_starter_monthly', // Será atualizado com ID real do Stripe
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      name: 'Pro',
      description: '1000 minutos por mês',
      price: 2990, // $29.99
      billing_interval: 'month',
      features: {
        transcribe: true,
        upload_audio: true,
        upload_video: true,
        export_txt: true,
        export_pdf: true,
        export_docx: true,
        history_view: true,
        history_search: true,
        analytics_view: true,
      },
      limits: {
        monthlyMinutes: 1000,
        maxFileSize: 1000,
        maxFileDuration: 120,
        concurrentJobs: 5,
        historyRetention: 365,
      },
      stripe_price_id: 'price_pro_monthly', // Será atualizado com ID real do Stripe
    },
  });

  const enterprisePlan = await prisma.plan.create({
    data: {
      name: 'Enterprise',
      description: 'Ilimitado + suporte dedicado',
      price: 9990, // $99.99
      billing_interval: 'month',
      features: {
        transcribe: true,
        upload_audio: true,
        upload_video: true,
        export_txt: true,
        export_pdf: true,
        export_docx: true,
        history_view: true,
        history_search: true,
        analytics_view: true,
      },
      limits: {
        monthlyMinutes: -1, // Ilimitado
        maxFileSize: 2000,
        maxFileDuration: -1, // Ilimitado
        concurrentJobs: 10,
        historyRetention: -1, // Ilimitado
      },
      stripe_price_id: 'price_enterprise_monthly', // Será atualizado com ID real do Stripe
    },
  });

  console.log('✅ Planos criados com sucesso!\n');

  // ==================== CRIAR USUÁRIO ADMIN ====================
  console.log('👤 Criando usuário administrador...');

  const adminPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@devel.local',
      name: 'Administrador',
      password_hash: adminPassword,
      email_verified: true,
      is_active: true,
      role_id: adminRole.id,
    },
  });

  // Criar subscription para admin
  await prisma.subscription.create({
    data: {
      user_id: adminUser.id,
      plan_id: enterprisePlan.id,
      status: 'active',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Usuário administrador criado com sucesso!\n');

  // ==================== CRIAR ALGUNS USUÁRIOS DE TESTE ====================
  console.log('👥 Criando usuários de teste...');

  // Usuário Free
  const freeUser = await prisma.user.create({
    data: {
      email: 'user@free.local',
      name: 'Usuário Free',
      password_hash: await bcrypt.hash('password123', 10),
      email_verified: true,
      is_active: true,
      role_id: freeRole.id,
    },
  });

  await prisma.subscription.create({
    data: {
      user_id: freeUser.id,
      plan_id: freePlan.id,
      status: 'active',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Usuário Trial
  const trialUser = await prisma.user.create({
    data: {
      email: 'user@trial.local',
      name: 'Usuário Trial',
      password_hash: await bcrypt.hash('password123', 10),
      email_verified: true,
      is_active: true,
      role_id: trialRole.id,
    },
  });

  await prisma.subscription.create({
    data: {
      user_id: trialUser.id,
      plan_id: trialPlan.id,
      status: 'active',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Usuário Pro
  const proUser = await prisma.user.create({
    data: {
      email: 'user@pro.local',
      name: 'Usuário Pro',
      password_hash: await bcrypt.hash('password123', 10),
      email_verified: true,
      is_active: true,
      role_id: proRole.id,
    },
  });

  await prisma.subscription.create({
    data: {
      user_id: proUser.id,
      plan_id: proPlan.id,
      status: 'active',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Usuários de teste criados com sucesso!\n');

  // ==================== RESUMO ====================
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║           ✅ SEED FINALIZADO COM SUCESSO           ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  console.log('📊 Resumo do que foi criado:\n');
  console.log('Roles:');
  console.log(`  • ${freeRole.name} - Plano gratuito`);
  console.log(`  • ${trialRole.name} - Plano trial`);
  console.log(`  • ${starterRole.name} - Plano starter`);
  console.log(`  • ${proRole.name} - Plano profissional`);
  console.log(`  • ${enterpriseRole.name} - Plano enterprise`);
  console.log(`  • ${adminRole.name} - Administrador\n`);

  console.log('Planos:');
  console.log(`  • ${freePlan.name} - ${freePlan.description}`);
  console.log(`  • ${trialPlan.name} - ${trialPlan.description}`);
  console.log(`  • ${starterPlan.name} - ${starterPlan.description}`);
  console.log(`  • ${proPlan.name} - ${proPlan.description}`);
  console.log(`  • ${enterprisePlan.name} - ${enterprisePlan.description}\n`);

  console.log('Usuários de Teste:');
  console.log(`  • ${adminUser.email} (Administrador) - Senha: admin123`);
  console.log(`  • ${freeUser.email} (Free) - Senha: password123`);
  console.log(`  • ${trialUser.email} (Trial) - Senha: password123`);
  console.log(`  • ${proUser.email} (Pro) - Senha: password123\n`);

  console.log('🔗 URLs de Acesso:');
  console.log('  • Aplicação: http://localhost:8565');
  console.log('  • PgAdmin: http://localhost:5050 (usar: make pgadmin)\n');

  console.log('💡 Próximos passos:');
  console.log('  1. Instalar dependências de autenticação: bun add next-auth @auth/prisma-adapter bcryptjs');
  console.log('  2. Criar lib/auth.ts com NextAuth config');
  console.log('  3. Implementar páginas de login/signup');
  console.log('  4. Testar autenticação\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
