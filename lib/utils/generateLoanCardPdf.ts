import { db } from '@/lib/db'
import { PdfService } from '@/lib/services/PdfService'

/**
 * Extracts exactly the data needed by the existing Loan Card component
 * and generates a PDF Buffer in-memory using @react-pdf/renderer.
 */
export async function generateLoanCardPdf(loanId: string): Promise<Buffer> {
    const loan = await db.loan.findUnique({
        where: { id: loanId },
        include: {
            member: true,
            loanProduct: true
        }
    })

    if (!loan) {
        throw new Error(`Cannot generate Loan Card PDF: Loan ${loanId} not found`)
    }

    if (!loan.member) {
        throw new Error(`Cannot generate Loan Card PDF: Member for loan ${loanId} not found`)
    }

    if (!loan.loanProduct) {
        throw new Error(`Cannot generate Loan Card PDF: Product for loan ${loanId} not found`)
    }

    // Export the existing Loan Appraisal Card layout via pdfkit / react-pdf
    return await PdfService.generateAppraisal(loan, loan.member, loan.loanProduct)
}
