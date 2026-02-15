
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding System Modules...')

    const modules = [
        { key: 'DASHBOARD', name: 'Dashboard', description: 'Access to the main dashboard overview.' },
        { key: 'APPROVALS', name: 'Approvals', description: 'View and manage approval requests.' },
        { key: 'MEMBERS', name: 'Members', description: 'Access member directory and profiles.' },
        { key: 'LOANS', name: 'Loans', description: 'Manage loan applications and history.' },
        { key: 'WALLET', name: 'Wallet', description: 'View and manage wallet transactions.' },
        { key: 'WELFARE', name: 'Welfare', description: 'Manage welfare fund contributions and claims.' },
        { key: 'ACCOUNTS', name: 'Chart of Accounts', description: 'Manage financial accounts and ledgers.' },
        { key: 'ADMIN', name: 'System Admin', description: 'Configure system settings and roles.' },
        { key: 'AUDIT', name: 'Audit Trail', description: 'View system audit logs.' },
    ]

    for (const mod of modules) {
        await prisma.systemModule.upsert({
            where: { key: mod.key },
            update: {
                name: mod.name,
                description: mod.description
            },
            create: {
                key: mod.key,
                name: mod.name,
                description: mod.description
            }
        })
        console.log(`✅ Module synced: ${mod.name} (${mod.key})`)
    }

    console.log('✨ System Modules seeding completed.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
