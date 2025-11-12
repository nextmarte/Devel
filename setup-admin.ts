import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Configurando seu usuário como admin...\n')
  
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' }
  })

  if (!adminRole) {
    console.log('❌ Role admin não encontrada!')
    return
  }

  // Tentar atualizar se existe, ou criar
  let user = await prisma.user.findUnique({
    where: { email: 'marcusantonio@id.uff.br' },
    include: { role: true }
  })

  if (user) {
    console.log('📝 Usuário encontrado, atualizando role...')
    user = await prisma.user.update({
      where: { email: 'marcusantonio@id.uff.br' },
      data: {
        role_id: adminRole.id,
        name: 'Marcus Antonio'
      },
      include: { role: true }
    })
  } else {
    console.log('👤 Usuário não encontrado, criando...')
    user = await prisma.user.create({
      data: {
        email: 'marcusantonio@id.uff.br',
        name: 'Marcus Antonio',
        role_id: adminRole.id,
        oauth_provider: 'google', // Seu login é via Google
        oauth_id: 'dummy', // Será substituído no próximo login
        email_verified: true,
        is_active: true
      },
      include: { role: true }
    })
  }

  console.log('\n✅ Sucesso!\n')
  console.log(`  Email: ${user.email}`)
  console.log(`  Nome: ${user.name}`)
  console.log(`  Role: ${user.role?.name}`)
  console.log(`  OAuth Provider: ${user.oauth_provider}`)
  console.log('\n🔗 Agora acesse: http://localhost:3000/admin')
  console.log('   (Você será redirecionado para fazer login via Google)')
}

main()
  .catch(e => {
    console.error('❌ Erro:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
