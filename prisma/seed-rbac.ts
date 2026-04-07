
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Starting RBAC Seed ---')

  const modules = [
    { key: 'DASHBOARD', name: 'Dashboard', description: 'Main overview and summary statistics' },
    { key: 'APPROVALS', name: 'Approvals Management', description: 'Centralized approval workflow management' },
    { key: 'MEMBERS', name: 'Members Management', description: 'Directory and management of Sacco members' },
    { key: 'LOANS', name: 'Loans Management', description: 'Loan applications and portfolio management' },
    { key: 'WALLET', name: 'My Wallet & Savings', description: 'Personal financial tracking and savings' },
    { key: 'WELFARE', name: 'Welfare Module', description: 'Sacco welfare funds and requisitions' },
    { key: 'MEETINGS', name: 'Meetings & Attendance', description: 'Scheduling and tracking of Sacco meetings' },
    { key: 'EXPENSES', name: 'Expense Management', description: 'Operational expenses and claims' },
    { key: 'REPORTS_HUB', name: 'Reports & Analytics', description: 'Financial statements and operational reports' },
    { key: 'ACCOUNTS', name: 'Accounting & Ledgers', description: 'Chart of accounts and ledger management' },
    { key: 'ADMIN', name: 'System Administration', description: 'Global system configuration and settings' },
    { key: 'AUDIT', name: 'Audit Logs', description: 'Security and operation activity tracking' },
  ]

  console.log('Upserting modules...')
  for (const mod of modules) {
    await prisma.systemModule.upsert({
      where: { key: mod.key },
      update: { name: mod.name, description: mod.description },
      create: mod,
    })
  }

  const rolePermissions: Record<UserRole, string[]> = {
    [UserRole.SYSTEM_ADMIN]: modules.map(m => m.key),
    [UserRole.CHAIRPERSON]: modules.map(m => m.key),
    [UserRole.TREASURER]: [
      'DASHBOARD', 'APPROVALS', 'MEMBERS', 'LOANS', 'WALLET', 
      'EXPENSES', 'REPORTS_HUB', 'ACCOUNTS', 'AUDIT'
    ],
    [UserRole.SECRETARY]: [
      'DASHBOARD', 'APPROVALS', 'MEMBERS', 'LOANS', 'WELFARE', 
      'MEETINGS', 'REPORTS_HUB', 'AUDIT'
    ],
    [UserRole.MEMBER]: [
      'DASHBOARD', 'LOANS', 'WALLET', 'WELFARE', 'MEETINGS', 'EXPENSES'
    ]
  }

  console.log('Setting up role permissions...')
  for (const [role, allowedModules] of Object.entries(rolePermissions)) {
    for (const mod of modules) {
      const canAccess = allowedModules.includes(mod.key)
      
      await prisma.rolePermission.upsert({
        where: {
          role_moduleKey: {
            role: role as UserRole,
            moduleKey: mod.key
          }
        },
        update: { canAccess },
        create: {
          role: role as UserRole,
          moduleKey: mod.key,
          canAccess: canAccess
        }
      })
    }
  }

  console.log('--- RBAC Seed Completed Successfully ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
