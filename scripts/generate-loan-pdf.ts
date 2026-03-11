import * as dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
    // Get the most recent loan
    const loan = await prisma.loan.findFirst({
        where: { memberId: { not: '' } },
        orderBy: { updatedAt: 'desc' },
        include: { member: true, loanProduct: true }
    })

    if (!loan || !loan.member || !loan.loanProduct) {
        console.error('Could not find a loan with member and product')
        process.exit(1)
    }

    console.log(`Generating PDF for: ${loan.loanApplicationNumber} — ${loan.member.name}`)

    const { PdfService } = await import('../lib/services/PdfService')
    const pdfBuffer = await PdfService.generateAppraisal(loan, loan.member, loan.loanProduct)

    const outputPath = join(process.cwd(), 'loan-appraisal-card.pdf')
    writeFileSync(outputPath, pdfBuffer)

    console.log(`\n✅ PDF saved to: ${outputPath}`)
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
