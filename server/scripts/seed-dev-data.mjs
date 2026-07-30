import { prisma } from '../src/db.js'
import { loginWithWeChat } from '../src/services/auth.js'
import { seedTenantDemoData } from '../src/services/dev-seed.js'

async function main() {
  const result = await loginWithWeChat({
    code: 'dev:local-user',
    nickName: '开发用户',
  })

  const summary = await seedTenantDemoData({
    tenantId: result.tenant.id,
    userId: result.user.id,
  })

  console.log(
    JSON.stringify(
      {
        ok: true,
        tenantId: result.tenant.id,
        tenantName: result.tenant.name,
        summary,
      },
      null,
      2
    )
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
