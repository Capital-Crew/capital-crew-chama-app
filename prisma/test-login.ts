import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testLogin() {
    console.log('🧪 Testing Login Credentials...\n')

    const testEmail = 'admin@capitalcrew.com'
    const testPassword = 'Admin123!'

    // Step 1: Find user by email
    console.log('Step 1: Looking up user by email...')
    const user = await prisma.user.findUnique({
        where: { email: testEmail },
        include: { member: true }
    })

    if (!user) {
        console.log('❌ FAILED: User not found')
        return
    }
    console.log('✅ User found:', user.email)
    console.log('   Name:', user.name)
    console.log('   Role:', user.role)
    console.log('   Member:', user.member?.name)
    console.log('')

    // Step 2: Check password hash exists
    console.log('Step 2: Checking password hash...')
    if (!user.passwordHash) {
        console.log('❌ FAILED: No password hash set')
        return
    }
    console.log('✅ Password hash exists')
    console.log('')

    // Step 3: Verify password
    console.log('Step 3: Verifying password...')
    const isValid = await bcrypt.compare(testPassword, user.passwordHash)

    if (!isValid) {
        console.log('❌ FAILED: Password does not match')
        console.log('   Expected:', testPassword)
        return
    }
    console.log('✅ Password matches!')
    console.log('')

    // Step 4: Check user has member association
    console.log('Step 4: Checking member association...')
    if (!user.memberId || !user.member) {
        console.log('⚠️  WARNING: User has no member association')
    } else {
        console.log('✅ Member association exists')
        console.log('   Member ID:', user.memberId)
        console.log('   Member Number:', user.member.memberNumber)
    }
    console.log('')

    // Final Result
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ LOGIN TEST PASSED!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email:    ' + testEmail)
    console.log('🔑 Password: ' + testPassword)
    console.log('👤 Role:     ' + user.role)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('✨ You can now login at: http://localhost:3000/login')
    console.log('')
}

testLogin()
    .catch((error) => {
        console.error('❌ Test failed with error:', error.message)
    })
    .finally(() => prisma.$disconnect())
