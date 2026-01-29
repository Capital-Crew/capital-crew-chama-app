/**
 * Currency Utility Tests
 * Validates the "No Rounding Up" policy
 */

import { describe, it, expect } from '@jest/globals';
import {
    truncateToDecimals,
    formatMoney,
    formatCurrency,
    parseCurrency,
    addMoney,
    subtractMoney,
    multiplyMoney,
    calculatePercentage
} from '../currency';

describe('Currency Truncation Policy', () => {
    describe('truncateToDecimals', () => {
        it('should truncate, never round up', () => {
            expect(truncateToDecimals(100.999, 2)).toBe(100.99);
            expect(truncateToDecimals(100.566, 2)).toBe(100.56);
            expect(truncateToDecimals(100.001, 2)).toBe(100.00);
            expect(truncateToDecimals(100.995, 2)).toBe(100.99);
        });

        it('should handle edge cases', () => {
            expect(truncateToDecimals(0, 2)).toBe(0);
            expect(truncateToDecimals(-100.999, 2)).toBe(-100.99);
            expect(truncateToDecimals(null as any, 2)).toBe(0);
            expect(truncateToDecimals(undefined as any, 2)).toBe(0);
            expect(truncateToDecimals('', 2)).toBe(0);
            expect(truncateToDecimals('100.999', 2)).toBe(100.99);
        });

        it('should handle different decimal places', () => {
            expect(truncateToDecimals(100.9999, 3)).toBe(100.999);
            expect(truncateToDecimals(100.9999, 1)).toBe(100.9);
            expect(truncateToDecimals(100.9999, 0)).toBe(100);
        });
    });

    describe('formatMoney', () => {
        it('should format with truncation', () => {
            expect(formatMoney(100.999)).toBe('100.99');
            expect(formatMoney(1234.567)).toBe('1,234.56');
            expect(formatMoney(1234567.899)).toBe('1,234,567.89');
        });

        it('should include symbol when requested', () => {
            expect(formatMoney(100.999, { includeSymbol: true })).toBe('KES 100.99');
            expect(formatMoney(100.999, { includeSymbol: true, symbol: 'USD' })).toBe('USD 100.99');
        });

        it('should handle zero and negative values', () => {
            expect(formatMoney(0)).toBe('0.00');
            expect(formatMoney(-100.999)).toBe('-100.99');
        });
    });

    describe('formatCurrency', () => {
        it('should format with symbol by default', () => {
            expect(formatCurrency(100.999)).toBe('KES 100.99');
            expect(formatCurrency(1234.567)).toBe('KES 1,234.56');
        });
    });

    describe('parseCurrency', () => {
        it('should parse and truncate currency strings', () => {
            expect(parseCurrency('KES 1,234.56')).toBe(1234.56);
            expect(parseCurrency('1,234.999')).toBe(1234.99);
            expect(parseCurrency('100.566')).toBe(100.56);
        });
    });

    describe('Money Arithmetic', () => {
        it('should add with truncation', () => {
            expect(addMoney(100.555, 50.555)).toBe(151.11);
            expect(addMoney(100.999, 50.999)).toBe(151.99);
        });

        it('should subtract with truncation', () => {
            expect(subtractMoney(100.999, 50.555)).toBe(50.44);
            expect(subtractMoney(100.555, 50.999)).toBe(49.55);
        });

        it('should multiply with truncation', () => {
            expect(multiplyMoney(100.999, 2)).toBe(201.99);
            expect(multiplyMoney(100.555, 1.5)).toBe(150.83);
        });

        it('should calculate percentage with truncation', () => {
            expect(calculatePercentage(1000, 2.5)).toBe(25.00);
            expect(calculatePercentage(1000, 2.55)).toBe(25.50);
            expect(calculatePercentage(1000, 2.556)).toBe(25.55);
        });
    });

    describe('Real-world Scenarios', () => {
        it('should handle loan processing fees correctly', () => {
            const loanAmount = 100000;
            const processingFeePercent = 2.5;
            const fee = calculatePercentage(loanAmount, processingFeePercent);

            expect(fee).toBe(2500.00);
            expect(formatCurrency(fee)).toBe('KES 2,500.00');
        });

        it('should handle insurance fees correctly', () => {
            const loanAmount = 50000;
            const insurancePercent = 1.75;
            const fee = calculatePercentage(loanAmount, insurancePercent);

            expect(fee).toBe(875.00);
            expect(formatCurrency(fee)).toBe('KES 875.00');
        });

        it('should handle net disbursement calculation', () => {
            const requestedAmount = 100000;
            const processingFee = calculatePercentage(requestedAmount, 2);
            const insuranceFee = calculatePercentage(requestedAmount, 1);
            const shareCapital = 500;

            const totalDeductions = addMoney(addMoney(processingFee, insuranceFee), shareCapital);
            const netDisbursement = subtractMoney(requestedAmount, totalDeductions);

            expect(processingFee).toBe(2000.00);
            expect(insuranceFee).toBe(1000.00);
            expect(totalDeductions).toBe(3500.00);
            expect(netDisbursement).toBe(96500.00);
        });

        it('should never round up in complex calculations', () => {
            // Scenario: Multiple fees that would round up with .toFixed()
            const amount = 10000.999;
            const fee1 = multiplyMoney(amount, 0.025); // 250.02 (not 250.03)
            const fee2 = multiplyMoney(amount, 0.015); // 150.01 (not 150.02)
            const total = addMoney(fee1, fee2); // 400.03 (not 400.05)

            expect(fee1).toBe(250.02);
            expect(fee2).toBe(150.01);
            expect(total).toBe(400.03);
        });
    });
});
