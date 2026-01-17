import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding test user...')

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: 'admin@capitalcrew.com' }
    })

    if (existingUser) {
        console.log('✅ Test user already exists')
        console.log('📧 Email: admin@capitalcrew.com')
        console.log('🔑 Password: Admin123!')
        return
    }

    // Create a member first (required for user)
    const member = await prisma.member.create({
        data: {
            name: 'Admin User',
            memberNumber: 1001,
            contact: '+254700000000',
            status: 'ACTIVE',
            details: {
                create: {
                    firstName: 'Admin',
                    lastName: 'User',
                    dateOfBirth: new Date('1990-01-01'),
                    gender: 'MALE',
                    maritalStatus: 'SINGLE',
                    occupation: 'Administrator',
                    physicalAddress: 'Nairobi, Kenya',
                    postalAddress: 'P.O. Box 12345',
                    postalCode: '00100',
                    city: 'Nairobi',
                    county: 'Nairobi',
                    country: 'Kenya'
                }
            }
        }
    })

    console.log('✅ Created member:', member.name, `(#${member.memberNumber})`)

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin123!', 10)

    // Create user with hashed password
    const user = await prisma.user.create({
        data: {
            email: 'admin@capitalcrew.com',
            passwordHash: hashedPassword,
            name: 'Admin User',
            role: 'CHAIRPERSON', // Highest permission level
            memberId: member.id
        }
    })

    console.log('✅ Created user account')
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 Test User Created Successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email:    admin@capitalcrew.com')
    console.log('🔑 Password: Admin123!')
    console.log('👤 Role:     CHAIRPERSON')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('You can now login with these credentials!')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding user:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
