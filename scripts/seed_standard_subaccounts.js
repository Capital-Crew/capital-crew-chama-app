
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seed() {
    try {
        console.log("Creating Standard Sub-Accounts...")

        // Helper to create account if missing
        const createAcc = async (code, name, type, parentCode) => {
            const parent = await prisma.ledgerAccount.findUnique({ where: { code: parentCode } })
            if (!parent) {
                console.log(`❌ Parent ${parentCode} not found for ${name}`)
                return
            }

            const acc = await prisma.ledgerAccount.upsert({
                where: { code },
                update: { name, type, parentId: parent.id },
                create: {
                    code,
                    name,
                    type,
                    parentId: parent.id,
                    isActive: true,
                    description: `Standard ${name} Account`
                }
            })
            console.log(`✅ ${code} - ${name} [${type}]`)
            return acc
        }

        // 1. ASSETS (Parent: 1000)
        const loanPortfolio = await createAcc('1100', 'Loan Portfolio', 'ASSET', '1000')
        const cashAccount = await createAcc('1001', 'Cash @ Bank / M-Pesa', 'ASSET', '1000')

        // 2. REVENUE (Parent: 4000)
        const interestIncome = await createAcc('4100', 'Interest Income', 'REVENUE', '4000') // Or 'INCOME' if using legacy enum
        const feeIncome = await createAcc('4200', 'Fee Income', 'REVENUE', '4000')

        // 3. EXPENSES (Parent: Assume 5000 or create if missing? User has none)
        // Let's check for Expense parent. User only had 1000, 1200, 2000, 3000, 4000
        // We will stick to the requested ones for now.

        // 4. MAP SYSTEM EVENTS TO THESE ACCOUNTS
        console.log("\nMapping System Events...")

        const mapEvent = async (type, accountId) => {
            await prisma.systemAccountingMapping.upsert({
                where: { type },
                create: { type, accountId },
                update: { accountId }
            })
            console.log(`🔗 Mapped ${type} -> ${accountId}`)
        }

        if (loanPortfolio) {
            // When we disburse, we Debit this account (Increase Asset)
            await mapEvent('EVENT_LOAN_DISBURSEMENT', loanPortfolio.id)
            // When principal is repaid, we Credit this account (Decrease Asset)
            await mapEvent('EVENT_LOAN_REPAYMENT_PRINCIPAL', loanPortfolio.id)
        }

        if (cashAccount) {
            // Cash deposits go here
            await mapEvent('CASH_ON_HAND', cashAccount.id)
            await mapEvent('EVENT_CASH_DEPOSIT', cashAccount.id)
            await mapEvent('EVENT_CASH_WITHDRAWAL', cashAccount.id)
        }

        if (interestIncome) {
            await mapEvent('INCOME_LOAN_INTEREST', interestIncome.id)
        }

        if (feeIncome) {
            await mapEvent('INCOME_LOAN_PROCESSING_FEE', feeIncome.id)
            await mapEvent('INCOME_GENERAL_FEE', feeIncome.id)
        }

    } catch (e) {
        console.error("❌ Error:", e)
    } finally {
        await prisma.$disconnect()
    }
}

seed()
