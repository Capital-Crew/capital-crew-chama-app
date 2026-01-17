/**
 * Unit Tests for Decimal Operations
 * 
 * Tests the decimal.js-based financial calculation engine to ensure:
 * - No floating-point errors
 * - Correct rounding behavior
 * - Edge case handling
 */

import { describe, it, expect } from '@jest/globals'
import { add, subtract, multiply, divide, equals, greaterThan, lessThan, roundForStorage, roundForDisplay } from '@/lib/decimal/operations'
import { MoneyDecimal, RateDecimal, PercentDecimal } from '@/lib/decimal/config'
import { calculateEMI, calculateSimpleInterest, calculatePercentageFee, splitPayment } from '@/lib/decimal/formulas'
import Decimal from 'decimal.js-light'

describe('Decimal Arithmetic Operations', () => {
    it('should correctly add 0.1 + 0.2 = 0.3', () => {
        const result = add('0.1', '0.2')
        expect(result.toString()).toBe('0.3')
        expect(equals(result, '0.3')).toBe(true)
    })

    it('should correctly subtract 1 - 0.9 = 0.1', () => {
        const result = subtract('1', '0.9')
        expect(result.toString()).toBe('0.1')
    })

    it('should correctly multiply 0.1 * 0.2', () => {
        const result = multiply('0.1', '0.2')
        expect(result.toString()).toBe('0.02')
    })

    it('should correctly divide 1 / 3', () => {
        const result = divide('1', '3')
        // Should have high precision
        expect(result.toFixed(10)).toBe('0.3333333333')
    })

    it('should throw error on division by zero', () => {
        expect(() => divide('100', '0')).toThrow('Division by zero')
    })
})

describe('Decimal Comparison Operations', () => {
    it('should correctly compare equal values', () => {
        expect(equals('100.00', '100')).toBe(true)
        expect(equals('0.1', '0.10')).toBe(true)
    })

    it('should correctly compare greater than', () => {
        expect(greaterThan('100', '99.99')).toBe(true)
        expect(greaterThan('0.1', '0.09')).toBe(true)
        expect(greaterThan('100', '100')).toBe(false)
    })

    it('should correctly compare less than', () => {
        expect(lessThan('99.99', '100')).toBe(true)
        expect(lessThan('0.09', '0.1')).toBe(true)
        expect(lessThan('100', '100')).toBe(false)
    })
})

describe('Rounding Operations', () => {
    it('should round for storage to 4 decimal places', () => {
        const value = new MoneyDecimal('123.456789')
        const rounded = roundForStorage(value)
        expect(rounded.toString()).toBe('123.4568')
    })

    it('should round for display to 2 decimal places', () => {
        const value = new MoneyDecimal('123.456789')
        const rounded = roundForDisplay(value)
        expect(rounded).toBe('123.46')
    })

    it('should round .5 up (ROUND_HALF_UP)', () => {
        const value1 = new MoneyDecimal('123.455')
        const value2 = new MoneyDecimal('123.445')

        expect(roundForDisplay(value1)).toBe('123.46')
        expect(roundForDisplay(value2)).toBe('123.45')
    })

    it('should handle rounding at .005 boundary', () => {
        const value1 = new MoneyDecimal('123.4550')
        const value2 = new MoneyDecimal('123.4450')

        const rounded1 = roundForStorage(value1)
        const rounded2 = roundForStorage(value2)

        expect(rounded1.toString()).toBe('123.4550')
        expect(rounded2.toString()).toBe('123.4450')
    })
})

describe('Edge Cases', () => {
    it('should handle zero values', () => {
        expect(add('0', '0').toString()).toBe('0')
        expect(multiply('100', '0').toString()).toBe('0')
        expect(equals('0', '0.00')).toBe(true)
    })

    it('should handle negative values', () => {
        expect(add('-100', '50').toString()).toBe('-50')
        expect(subtract('50', '100').toString()).toBe('-50')
        expect(multiply('-10', '5').toString()).toBe('-50')
    })

    it('should handle very large numbers', () => {
        const large = '999999999999999.9999'
        const result = add(large, '0.0001')
        expect(result.toString()).toBe('1000000000000000.0000')
    })

    it('should handle very small numbers', () => {
        const small = '0.0001'
        const result = multiply(small, small)
        expect(result.toFixed(8)).toBe('0.00000001')
    })
})

describe('MoneyDecimal Constructor', () => {
    it('should create MoneyDecimal from string', () => {
        const money = new MoneyDecimal('1234.56')
        expect(money.toString()).toBe('1234.56')
    })

    it('should create MoneyDecimal from number', () => {
        const money = new MoneyDecimal(1234.56)
        expect(money.toFixed(2)).toBe('1234.56')
    })

    it('should handle precision correctly', () => {
        const money = new MoneyDecimal('1234.567890')
        expect(money.toDecimalPlaces(4).toString()).toBe('1234.5679')
    })
})

describe('Financial Formulas', () => {
    it('should calculate EMI correctly', () => {
        // Loan: 10,000 at 12% annual (1% monthly) for 12 months
        const emi = calculateEMI('10000', '0.12', 12)

        // Expected EMI ≈ 888.49
        expect(parseFloat(emi.toFixed(2))).toBeCloseTo(888.49, 1)
    })

    it('should calculate simple interest correctly', () => {
        // 10,000 at 12% for 1 year
        const interest = calculateSimpleInterest('10000', '0.12', '1')
        expect(interest.toString()).toBe('1200')
    })

    it('should calculate percentage fee correctly', () => {
        // 2.5% of 1000
        const fee = calculatePercentageFee('1000', '2.5')
        expect(fee.toString()).toBe('25')
    })

    it('should split payment into principal and interest', () => {
        const payment = splitPayment('1000', '5000', '100')

        // Payment of 1000, interest due is 100
        expect(payment.interest.toString()).toBe('100')
        expect(payment.principal.toString()).toBe('900')
    })

    it('should handle zero interest rate', () => {
        const emi = calculateEMI('10000', '0', 12)

        // With 0% interest, EMI = principal / installments
        expect(emi.toFixed(2)).toBe('833.33')
    })
})

describe('Precision Preservation', () => {
    it('should preserve precision through multiple operations', () => {
        let value = new MoneyDecimal('100')

        // Simulate multiple operations
        value = value.times('1.05') // +5%
        value = value.minus('10')
        value = value.dividedBy('2')

        // Should maintain precision
        expect(value.toFixed(4)).toBe('47.5000')
    })

    it('should not accumulate rounding errors', () => {
        let total = new MoneyDecimal('0')

        // Add 0.1 ten times
        for (let i = 0; i < 10; i++) {
            total = total.plus('0.1')
        }

        // Should equal exactly 1.0, not 0.9999999...
        expect(total.toString()).toBe('1')
        expect(equals(total, '1')).toBe(true)
    })

    it('should handle compound calculations without drift', () => {
        // Calculate: (100 * 1.05) - 5 repeated 10 times
        let value = new MoneyDecimal('100')

        for (let i = 0; i < 10; i++) {
            value = value.times('1.05').minus('5')
        }

        // Should be deterministic
        const expected = '112.8895156255625'
        expect(value.toFixed(13)).toBe(expected)
    })
})

describe('Type Safety', () => {
    it('should enforce MoneyDecimal type', () => {
        const money = new MoneyDecimal('100')
        expect(money).toBeInstanceOf(Decimal)
    })

    it('should enforce RateDecimal type', () => {
        const rate = new RateDecimal('0.12')
        expect(rate).toBeInstanceOf(Decimal)
    })

    it('should enforce PercentDecimal type', () => {
        const percent = new PercentDecimal('5.5')
        expect(percent).toBeInstanceOf(Decimal)
    })
})
