import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verificando usuário...')
  
  const user = await prisma.user.findUnique({
    where: { email: 'marcusantonio@id.uff.br' },
    include: { role: true }
  })

  if (!user) {
    console.log('❌ Usuário não encontrado!')
    return
  }

  console.log('\n📋 Dados do usuário:')
  console.log(`  Email: ${user.email}`)
  console.log(`  Nome: ${user.name}`)
  console.log(`  Role: ${user.role?.name}`)
  console.log(`  Role ID: ${user.role_id}`)
  console.log(`  Criado em: ${user.created_at}`)

  // Buscar role 'admin'
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' }
  })

  if (!adminRole) {
    console.log('\n❌ Role "admin" não existe no banco!')
    console.log('📋 Roles disponíveis:')
    const allRoles = await prisma.role.findMany()
    allRoles.forEach(r => console.log(`  - ${r.name}`))
    return
  }

  if (user.role?.name !== 'admin') {
    console.log('\n⚠️ Você NÃO é admin! Atualizando...')
    const updated = await prisma.user.update({
      where: { email: 'marcusantonio@id.uff.br' },
      data: { role_id: adminRole.id },
      include: { role: true }
    })
    console.log(`✅ Role atualizada para: ${updated.role?.name}`)
  } else {
    console.log('\n✅ Você já é admin!')
  }
}

main()
  .catch(e => {
    console.error('❌ Erro:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
