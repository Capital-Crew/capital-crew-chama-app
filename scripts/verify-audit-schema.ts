import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Verifying AuditLog Schema...')

    try {
        const user = await prisma.user.findFirst()

        if (!user) {
            console.warn('⚠️ No users found. Skipping.')
            return
        }

        console.log(`Found User: ${user.id}`)

        // Use SETTINGS_UPDATED which is definitely valid
        const log = await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'SETTINGS_UPDATED',
                details: 'Schema Verification',

                // New Fields
                summary: 'Schema Verification Log',
                context: 'TEST_VERIFY',
                severity: 'INFO',
                ipAddress: '127.0.0.1',
                snapshot: { test: true },
                steps: [
                    { action: 'Step 1', timestamp: new Date(), type: 'INFO' }
                ],
                metadata: { version: '2.0' },
                durationMs: 100
            }
        })

        console.log('✅ Success: Created AuditLog with new fields!')
        console.log('Log ID:', log.id)

    } catch (e) {
        console.error('❌ Failed to create AuditLog.')
        console.error(e)
        process.exit(1)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
