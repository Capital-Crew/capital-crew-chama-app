
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { type Loan, type Member, type LoanProduct, type RepaymentScheduleItem } from '@/lib/types'

// Register Fonts (Optional, using standard fonts for now)
// Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/Roboto-Regular.ttf' });

const styles = StyleSheet.create({
    page: { padding: 30, fontFamily: 'Helvetica' },
    header: { marginBottom: 20, borderBottom: 2, paddingBottom: 12, borderBottomColor: '#1a365d', alignItems: 'center' },
    groupName: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#1a365d', letterSpacing: 1, marginBottom: 4 },
    title: { fontSize: 14, color: '#4a5568', marginBottom: 2 },
    subtitle: { fontSize: 10, color: '#718096' },
    section: { marginBottom: 15 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 5, color: '#2d3748', backgroundColor: '#edf2f7', padding: 5 },
    row: { flexDirection: 'row', marginBottom: 5 },
    label: { width: '40%', fontSize: 10, color: '#4a5568' },
    value: { width: '60%', fontSize: 10, fontWeight: 'bold', color: '#1a202c' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#2d3748', padding: 5, color: 'white', fontSize: 10, fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', borderBottom: 1, borderBottomColor: '#e2e8f0', padding: 5, fontSize: 10 },
    col1: { width: '10%' },
    col2: { width: '30%' },
    col3: { width: '20%', textAlign: 'right' },
    col4: { width: '20%', textAlign: 'right' },
    col5: { width: '20%', textAlign: 'right' },
    totalRow: { flexDirection: 'row', backgroundColor: '#edf2f7', padding: 5, fontSize: 10, fontWeight: 'bold' },
    footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#aaa', borderTop: 1, paddingTop: 10 }
})

interface AppraisalProps {
    loan: Loan
    member: Member
    product: LoanProduct
}

const AppraisalDocument = ({ loan, member, product }: AppraisalProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.groupName}>CAPITAL CREW SHG</Text>
                <Text style={styles.title}>Loan Appraisal Card</Text>
                <Text style={styles.subtitle}>Application #{loan.loanApplicationNumber}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Member Details</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Name:</Text>
                    <Text style={styles.value}>{member.name}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Membership No:</Text>
                    <Text style={styles.value}>{member.memberNumber}</Text>
                </View>

            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Loan Details</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Product:</Text>
                    <Text style={styles.value}>{product.name}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Amount Applied:</Text>
                    <Text style={styles.value}>KES {Number(loan.amount).toLocaleString()}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Interest Rate:</Text>
                    <Text style={styles.value}>{Number(loan.interestRate)}% P.A</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Duration:</Text>
                    <Text style={styles.value}>{loan.installments || product.numberOfRepayments} Months</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Deductions & Net Disbursement</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Processing Fee:</Text>
                    <Text style={styles.value}>{Number(loan.processingFee).toLocaleString()}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Insurance Fee:</Text>
                    <Text style={styles.value}>{Number(loan.insuranceFee).toLocaleString()}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Contribution Deduction:</Text>
                    <Text style={styles.value}>{Number(loan.contributionDeduction).toLocaleString()}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={[styles.label, { color: '#e53e3e' }]}>Loan Offset:</Text>
                    <Text style={[styles.value, { color: '#e53e3e' }]}>{Number(loan.existingLoanOffset).toLocaleString()}</Text>
                </View>
                <View style={[styles.row, { marginTop: 5, paddingTop: 5, borderTop: 1 }]}>
                    <Text style={styles.label}>Total Deductions:</Text>
                    <Text style={styles.value}>{Number(loan.totalDeductions).toLocaleString()}</Text>
                </View>
                <View style={[styles.row, { padding: 5, backgroundColor: '#f0fff4', borderColor: '#48bb78', borderWidth: 1, marginTop: 5 }]}>
                    <Text style={styles.label}>NET DISBURSEMENT:</Text>
                    <Text style={[styles.value, { fontSize: 14, color: '#2f855a' }]}>KES {Number(loan.netDisbursementAmount).toLocaleString()}</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text>Generated by Capital Crew SHG System • {new Date().toLocaleString()}</Text>
            </View>
        </Page>
    </Document>
)

interface ScheduleProps {
    schedule: RepaymentScheduleItem[]
    loanNumber: string
    memberName: string
}

const ScheduleDocument = ({ schedule, loanNumber, memberName }: ScheduleProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Repayment Schedule</Text>
                <Text style={styles.subtitle}>{memberName} • Loan #{loanNumber}</Text>
            </View>

            <View style={styles.tableHeader}>
                <Text style={styles.col1}>#</Text>
                <Text style={styles.col2}>Due Date</Text>
                <Text style={styles.col3}>Principal</Text>
                <Text style={styles.col4}>Interest</Text>
                <Text style={styles.col5}>Total</Text>
            </View>

            {schedule.map((item, index) => (
                <View key={index} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? 'white' : '#f7fafc' }]}>
                    <Text style={styles.col1}>{index + 1}</Text>
                    <Text style={styles.col2}>{new Date(item.dueDate).toLocaleDateString()}</Text>
                    <Text style={styles.col3}>{item.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    <Text style={styles.col4}>{item.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    <Text style={styles.col5}>{item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </View>
            ))}

            <View style={styles.totalRow}>
                <Text style={[styles.col1, { width: '40%' }]}>TOTALS</Text>
                <Text style={styles.col3}>{schedule.reduce((sum, i) => sum + i.principal, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={styles.col4}>{schedule.reduce((sum, i) => sum + i.interest, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={styles.col5}>{schedule.reduce((sum, i) => sum + i.total, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.footer}>
                <Text>This is a computer-generated schedule.</Text>
            </View>
        </Page>
    </Document>
)

export class PdfService {
    static async generateAppraisal(loan: any, member: any, product: any): Promise<Buffer> {
        return await renderToBuffer(
            <AppraisalDocument loan={loan} member={member} product={product} />
        )
    }

    static async generateSchedule(schedule: RepaymentScheduleItem[], loanNumber: string, memberName: string): Promise<Buffer> {
        return await renderToBuffer(
            <ScheduleDocument schedule={schedule} loanNumber={loanNumber} memberName={memberName} />
        )
    }
}
