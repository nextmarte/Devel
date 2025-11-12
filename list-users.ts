import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Listando todos os usuários...\n')
  
  const users = await prisma.user.findMany({
    include: { role: true }
  })

  if (users.length === 0) {
    console.log('❌ Nenhum usuário encontrado!')
    return
  }

  console.log(`📋 Total de usuários: ${users.length}\n`)
  users.forEach(u => {
    console.log(`  • ${u.email}`)
    console.log(`    - Nome: ${u.name}`)
    console.log(`    - Role: ${u.role?.name}`)
    console.log(`    - Criado em: ${u.created_at.toLocaleString('pt-BR')}`)
    console.log()
  })

  // Listar roles disponíveis
  const roles = await prisma.role.findMany()
  console.log(`📋 Roles disponíveis: ${roles.length}`)
  roles.forEach(r => {
    console.log(`  - ${r.name}`)
  })
}

main()
  .catch(e => {
    console.error('❌ Erro:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
