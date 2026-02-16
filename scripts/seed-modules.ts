
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

    // Seed Permissions
    const officerRoles = ['CHAIRPERSON', 'TREASURER', 'SECRETARY']
    // Granting ADMIN access to officers as well for "All Access" request
    const officerModules = ['DASHBOARD', 'APPROVALS', 'MEMBERS', 'LOANS', 'WALLET', 'WELFARE', 'ACCOUNTS', 'AUDIT', 'ADMIN']

    for (const role of officerRoles) {
        console.log(`\n👮 Seeding permissions for ${role}...`)
        for (const moduleKey of officerModules) {
            await prisma.rolePermission.upsert({
                where: {
                    role_moduleKey: {
                        role: role as any,
                        moduleKey: moduleKey
                    }
                },
                update: { canAccess: true },
                create: {
                    role: role as any,
                    moduleKey: moduleKey,
                    canAccess: true
                }
            })
            console.log(`   - Granted ${moduleKey}`)
        }
    }

    // Seed MEMBER Permissions (Temporary Full Access)
    console.log(`\n👤 Seeding permissions for MEMBER (FULL ACCESS)...`)
    // Granting all modules to MEMBER as requested
    const memberModules = ['DASHBOARD', 'APPROVALS', 'MEMBERS', 'LOANS', 'WALLET', 'WELFARE', 'ACCOUNTS', 'ADMIN', 'AUDIT']
    for (const moduleKey of memberModules) {
        await prisma.rolePermission.upsert({
            where: {
                role_moduleKey: {
                    role: 'MEMBER',
                    moduleKey: moduleKey
                }
            },
            update: { canAccess: true },
            create: {
                role: 'MEMBER',
                moduleKey: moduleKey,
                canAccess: true
            }
        })
        console.log(`   - Granted ${moduleKey}`)
    }

    // System Admin gets everything
    console.log('\n👑 Seeding permissions for SYSTEM_ADMIN...')
    const allModules = [...officerModules, 'ADMIN']
    for (const moduleKey of allModules) {
        await prisma.rolePermission.upsert({
            where: {
                role_moduleKey: {
                    role: 'SYSTEM_ADMIN',
                    moduleKey: moduleKey
                }
            },
            update: { canAccess: true },
            create: {
                role: 'SYSTEM_ADMIN',
                moduleKey: moduleKey,
                canAccess: true
            }
        })
    }
    console.log(`   - Granted ALL modules`)

    console.log('✨ System Modules & Permissions seeding completed.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
