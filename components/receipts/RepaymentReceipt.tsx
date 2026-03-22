import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';


const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#212B36',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007B55',
        textTransform: 'uppercase',
    },
    companyInfo: {
        alignItems: 'flex-end',
        fontSize: 8,
        color: '#637381',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    section: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: '30%',
        fontWeight: 'bold',
        color: '#637381',
    },
    value: {
        width: '70%',
        fontWeight: 'bold',
    },
    table: {
        display: "flex",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderColor: '#E7E7E7',
        marginTop: 20,
        marginBottom: 20,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row"
    },
    tableCol: {
        width: "50%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#E7E7E7',
    },
    tableHeader: {
        backgroundColor: '#F3F4F6',
        padding: 5,
        fontWeight: 'bold',
        fontSize: 9,
    },
    tableCell: {
        margin: "auto",
        padding: 5,
        fontSize: 9,
        width: '100%',
        textAlign: 'right'
    },
    tableLabel: {
        margin: "auto",
        padding: 5,
        fontSize: 9,
        width: '100%',
        textAlign: 'left'
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#919EAB',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 10,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#E7E7E7',
        paddingTop: 10,
    },
    totalLabel: {
        fontWeight: 'bold',
        fontSize: 12,
        marginRight: 20,
    },
    totalValue: {
        fontWeight: 'bold',
        fontSize: 12,
        color: '#007B55',
    }
});


export interface ReceiptData {
    transactionId: string;
    date: Date;
    amount: number;
    description: string;
    member: {
        name: string;
        number: string;
    };
    loan: {
        number: string;
        product: string;
    };
    allocation?: {
        principal: number;
        interest: number;
        penalty: number;
        fees: number;
    };
}


export function RepaymentReceipt({ data }: { data: ReceiptData }) {
    const { transactionId, date, amount, description, member, loan, allocation } = data;

    const formatDate = (d: Date) => format(new Date(d), 'dd MMM yyyy, HH:mm');
    const formatCurrency = (n: number) => `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

    return (
        <Document>
            <Page size="A5" style={styles.page}>
                {}
                <View style={styles.header}>
                    <Text style={styles.logoText}>CAPITAL CREW SACCO</Text>
                    <View style={styles.companyInfo}>
                        <Text>P.O. Box 1234, Nairobi</Text>
                        <Text>Tel: +254 700 000000</Text>
                        <Text>Email: info@capitalcrew.co.ke</Text>
                    </View>
                </View>

                {}
                <Text style={styles.title}>Official Receipt</Text>

                {}
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                    <View style={{ width: '48%' }}>
                        <Text style={{ ...styles.section, color: '#637381', fontSize: 9 }}>RECEIVED FROM:</Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 11 }}>{member.name}</Text>
                        <Text style={{ fontSize: 9 }}>Member No: {member.number}</Text>
                    </View>
                    <View style={{ width: '48%', alignItems: 'flex-end' }}>
                        <Text style={{ ...styles.section, color: '#637381', fontSize: 9 }}>RECEIPT DETAILS:</Text>
                        <Text style={{ fontSize: 9 }}>Receipt No: {transactionId.slice(-8).toUpperCase()}</Text>
                        <Text style={{ fontSize: 9 }}>Date: {formatDate(date)}</Text>
                        <Text style={{ fontSize: 9 }}>Loan Ref: {loan.number}</Text>
                    </View>
                </View>

                {}
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCol}>
                            <Text style={styles.tableHeader}>Payment Allocation</Text>
                        </View>
                        <View style={styles.tableCol}>
                            <Text style={{ ...styles.tableHeader, textAlign: 'right' }}>Amount</Text>
                        </View>
                    </View>

                    {allocation && (
                        <>
                            {allocation.penalty > 0 && (
                                <View style={styles.tableRow}>
                                    <View style={styles.tableCol}><Text style={styles.tableLabel}>Penalty</Text></View>
                                    <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(allocation.penalty)}</Text></View>
                                </View>
                            )}
                            {allocation.fees > 0 && (
                                <View style={styles.tableRow}>
                                    <View style={styles.tableCol}><Text style={styles.tableLabel}>Fees</Text></View>
                                    <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(allocation.fees)}</Text></View>
                                </View>
                            )}
                            {allocation.interest > 0 && (
                                <View style={styles.tableRow}>
                                    <View style={styles.tableCol}><Text style={styles.tableLabel}>Interest</Text></View>
                                    <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(allocation.interest)}</Text></View>
                                </View>
                            )}
                            {allocation.principal > 0 && (
                                <View style={styles.tableRow}>
                                    <View style={styles.tableCol}><Text style={styles.tableLabel}>Principal</Text></View>
                                    <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(allocation.principal)}</Text></View>
                                </View>
                            )}
                        </>
                    )}

                    {!allocation && (
                        <View style={styles.tableRow}>
                            <View style={styles.tableCol}><Text style={styles.tableLabel}>Total Payment</Text></View>
                            <View style={styles.tableCol}><Text style={styles.tableCell}>{formatCurrency(amount)}</Text></View>
                        </View>
                    )}
                </View>

                {}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL AMOUNT PAID:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(amount)}</Text>
                </View>

                <Text style={{ marginTop: 5, fontSize: 9, fontStyle: 'italic', color: '#637381', textAlign: 'right' }}>
                    ({description})
                </Text>

                {}
                <View style={styles.footer}>
                    <Text>This is a system generated receipt and does not require a signature.</Text>
                    <Text>Capital Crew Sacco System • {format(new Date(), 'yyyy')}</Text>
                </View>
            </Page>
        </Document>
    );
}
