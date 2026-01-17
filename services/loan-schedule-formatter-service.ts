/**
 * Loan Schedule Formatter Service
 * 
 * Formats loan repayment schedules for display, print, and PDF export.
 * Matches the professional format used in formal loan documents.
 */


import { organizationConfig } from '@/lib/config/organization'
import type { ScheduleInstallment } from '@/services/loan-schedule-service'

// ========================================
// TYPES
// ========================================

export interface FormattedScheduleData {
    // Organization Details
    organization: {
        name: string
        poBox: string
        phone: string
    }

    // Loan Details
    loan: {
        loanNumber: string
        productType: string
        approvedAmount: number
        installments: number
        monthlyRepayment: number
    }

    // Member Details
    member: {
        memberNo: string
        memberName: string
        issuedDate: Date
        interestRate: number
    }

    // Schedule Table
    schedule: Array<{
        code: number              // Installment number
        repaymentDate: Date
        openingBalance: number
        principal: number
        interest: number
        monthlyPay: number
        closingBalance: number
    }>
}

// ========================================
// SERVICE
// ========================================

export class LoanScheduleFormatterService {
    /**
     * Format schedule for loan document
     * 
     * Takes raw schedule data and formats it into the
     * professional layout matching the sample.
     */
    static formatSchedule(params: {
        loan: {
            loanApplicationNumber: string
            amount: number
            disbursementDate?: Date
        }
        product: {
            name: string
            interestRatePerPeriod: number
        }
        member: {
            memberNumber: number
            name: string
        }
        schedule: ScheduleInstallment[]
    }): FormattedScheduleData {
        const { loan, product, member, schedule } = params

        // Calculate monthly repayment (average for display)
        const averageMonthlyPayment = schedule.reduce(
            (sum, inst) => sum + inst.totalDue.toNumber(),
            0
        ) / schedule.length

        // Format schedule table rows
        const formattedSchedule = schedule.map((inst, index) => ({
            code: inst.installmentNumber,
            repaymentDate: inst.dueDate,
            openingBalance: index === 0
                ? loan.amount
                : schedule[index - 1].balance.toNumber(),
            principal: inst.principal.toNumber(),
            interest: inst.interest.toNumber(),
            monthlyPay: inst.totalDue.toNumber(),
            closingBalance: inst.balance.toNumber()
        }))

        return {
            organization: {
                name: organizationConfig.name,
                poBox: organizationConfig.poBox,
                phone: organizationConfig.phone
            },
            loan: {
                loanNumber: loan.loanApplicationNumber,
                productType: product.name,
                approvedAmount: loan.amount,
                installments: schedule.length,
                monthlyRepayment: averageMonthlyPayment
            },
            member: {
                memberNo: member.memberNumber.toString().padStart(5, '0'),
                memberName: member.name.toUpperCase(),
                issuedDate: loan.disbursementDate || new Date(),
                interestRate: product.interestRatePerPeriod
            },
            schedule: formattedSchedule
        }
    }

    /**
     * Generate HTML for printing
     */
    static generateHTML(data: FormattedScheduleData): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Loan Repayment Schedule</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.4;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
        }
        
        .header-left h1 {
            font-size: 16pt;
            font-weight: bold;
        }
        
        .header-right {
            text-align: right;
            border: 2px solid #333;
            padding: 10px 15px;
           border-radius: 5px;
        }
        
        .header-right h2 {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .details-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .details-column {
            flex: 1;
        }
        
        .details-row {
            display: flex;
            margin-bottom: 8px;
        }
        
        .details-label {
            font-weight: bold;
            min-width: 150px;
        }
        
        .details-value {
            flex: 1;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th, td {
            border: 1px solid #333;
            padding: 8px;
            text-align: right;
        }
        
        th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        
        th:first-child, td:first-child {
            text-align: center;
        }
        
        .text-right {
            text-align: right;
        }
        
        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <h1>Loan Repayment Schedule</h1>
        </div>
        <div class="header-right">
            <h2>${data.organization.name}</h2>
            <div>${data.organization.poBox}</div>
            <div>${data.organization.phone}</div>
        </div>
    </div>
    
    <div class="details-container">
        <div class="details-column">
            <div class="details-row">
                <div class="details-label">Loan Number</div>
                <div class="details-value">${data.loan.loanNumber}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Loan Product Type</div>
                <div class="details-value">${data.loan.productType}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Approved Amount</div>
                <div class="details-value">${data.loan.approvedAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Installments</div>
                <div class="details-value">${data.loan.installments}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Monthly Repayment</div>
                <div class="details-value">${data.loan.monthlyRepayment.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
            </div>
        </div>
        
        <div class="details-column">
            <div class="details-row">
                <div class="details-label">Member No</div>
                <div class="details-value">${data.member.memberNo}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Member Name</div>
                <div class="details-value">${data.member.memberName}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Issued Date</div>
                <div class="details-value">${new Date(data.member.issuedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Interest Rate (%)</div>
                <div class="details-value">${data.member.interestRate}</div>
            </div>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Code</th>
                <th>Repayment Date</th>
                <th>Opening Balance</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Monthly Pay</th>
                <th>Closing Balance</th>
            </tr>
        </thead>
        <tbody>
            ${data.schedule.map(row => `
                <tr>
                    <td>${row.code}</td>
                    <td>${new Date(row.repaymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td class="text-right">${row.openingBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right">${row.principal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right">${row.interest.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right">${row.monthlyPay.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right">${row.closingBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>
        `
    }
}
